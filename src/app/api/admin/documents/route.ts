import { requireAdmin } from "../_auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractSource, type SourceType } from "@/lib/brain/ingest";
import { processDocument } from "@/lib/brain/kb";
import { logAudit } from "@/lib/admin/guard";

export const runtime = "nodejs";
export const maxDuration = 60;

// GET /api/admin/documents — list knowledge-base documents
export async function GET() {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("documents")
    .select("id, title, source_type, source_url, status, error, tags, chunk_count, char_count, created_at")
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ documents: data });
}

// POST /api/admin/documents — create a document from an uploaded file, raw text,
// or a URL, extract its text, store it, then run the embed pipeline.
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  const form = await request.formData();
  const sourceType = String(form.get("sourceType") ?? "text") as SourceType;
  const title = String(form.get("title") ?? "").trim();
  const tagsRaw = String(form.get("tags") ?? "").trim();
  const tags = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [];

  try {
    // Extract text up front so re-index never needs the original binary.
    let rawText = "";
    let resolvedTitle = title;
    let sourceUrl: string | null = null;

    if (sourceType === "pdf" || sourceType === "word") {
      const file = form.get("file");
      if (!(file instanceof File)) {
        return Response.json({ error: "فایل ارسال نشده." }, { status: 400 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const extracted = await extractSource({ sourceType, buffer });
      rawText = extracted.text;
      if (!resolvedTitle) resolvedTitle = file.name;
    } else if (sourceType === "url") {
      sourceUrl = String(form.get("url") ?? "").trim();
      if (!sourceUrl) return Response.json({ error: "URL لازم است." }, { status: 400 });
      const extracted = await extractSource({ sourceType, url: sourceUrl });
      rawText = extracted.text;
      if (!resolvedTitle) resolvedTitle = extracted.title ?? sourceUrl;
    } else {
      rawText = String(form.get("text") ?? "").trim();
      if (!rawText) return Response.json({ error: "متن لازم است." }, { status: 400 });
    }

    if (!resolvedTitle) resolvedTitle = "بدون عنوان";

    const supabase = createAdminClient();
    const { data: doc, error } = await supabase
      .from("documents")
      .insert({
        title: resolvedTitle,
        source_type: sourceType,
        source_url: sourceUrl,
        raw_text: rawText,
        tags,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });

    // Process synchronously (small docs). For very large docs this can be moved
    // to a background job later.
    await processDocument(doc.id);
    await logAudit(auth.admin, "document.create", doc.id, { title: resolvedTitle });

    return Response.json({ ok: true, id: doc.id }, { status: 201 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "خطای پردازش" },
      { status: 500 }
    );
  }
}
