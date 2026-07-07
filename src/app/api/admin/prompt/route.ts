import { requireAdmin } from "../_auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/admin/guard";

export const runtime = "nodejs";

// GET /api/admin/prompt — all persona/system-prompt versions (newest first).
export async function GET() {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("prompt_versions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ versions: data });
}

// POST /api/admin/prompt — create a new version (optionally activate it), or
// activate an existing one by id.
// Body: { content?, persona?, activate?: boolean } | { activateId }
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "bad body" }, { status: 400 });

  const supabase = createAdminClient();

  try {
    // Activate an existing version.
    if (body.activateId) {
      await supabase.from("prompt_versions").update({ is_active: false }).eq("is_active", true);
      const { error } = await supabase
        .from("prompt_versions")
        .update({ is_active: true })
        .eq("id", body.activateId);
      if (error) throw new Error(error.message);
      await logAudit(auth.admin, "prompt.activate", body.activateId);
      return Response.json({ ok: true });
    }

    // Create a new version.
    if (!body.content || typeof body.content !== "string") {
      return Response.json({ error: "content لازم است." }, { status: 400 });
    }
    const activate = body.activate !== false; // default: activate new versions
    if (activate) {
      await supabase.from("prompt_versions").update({ is_active: false }).eq("is_active", true);
    }
    const { data, error } = await supabase
      .from("prompt_versions")
      .insert({
        content: body.content,
        persona: body.persona ?? null,
        is_active: activate,
        created_by: auth.admin.email,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await logAudit(auth.admin, "prompt.create", data.id);
    return Response.json({ ok: true, id: data.id }, { status: 201 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "خطا" },
      { status: 500 }
    );
  }
}
