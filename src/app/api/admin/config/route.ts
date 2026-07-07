import { requireAdmin } from "../_auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/admin/guard";

export const runtime = "nodejs";

// GET /api/admin/config — current embedding + per-channel model config.
export async function GET() {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  const supabase = createAdminClient();
  const [{ data: embedding }, { data: models }] = await Promise.all([
    supabase
      .from("embedding_config")
      .select("*")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("model_config").select("*").order("channel"),
  ]);

  return Response.json({ embedding, models });
}

// POST /api/admin/config — update embedding config and/or a model_config row.
// Body: { embedding?: {...}, model?: { channel, ... } }
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "bad body" }, { status: 400 });

  const supabase = createAdminClient();

  try {
    if (body.embedding) {
      const e = body.embedding;
      const { error } = await supabase
        .from("embedding_config")
        .update({
          provider: e.provider,
          model: e.model,
          dimensions: e.dimensions,
          chunk_size: e.chunk_size,
          chunk_overlap: e.chunk_overlap,
          chunk_strategy: e.chunk_strategy,
          top_k: e.top_k,
          similarity_threshold: e.similarity_threshold,
          reranker_enabled: e.reranker_enabled,
          reranker_model: e.reranker_model,
          updated_at: new Date().toISOString(),
        })
        .eq("id", e.id);
      if (error) throw new Error(error.message);
      await logAudit(auth.admin, "config.embedding.update");
    }

    if (body.model) {
      const m = body.model;
      const { error } = await supabase
        .from("model_config")
        .update({
          active_model: m.active_model,
          temperature: m.temperature,
          max_tokens: m.max_tokens,
          top_p: m.top_p,
          fallback_provider: m.fallback_provider || null,
          fallback_model: m.fallback_model || null,
          updated_at: new Date().toISOString(),
        })
        .eq("channel", m.channel);
      if (error) throw new Error(error.message);
      await logAudit(auth.admin, "config.model.update", m.channel);
    }

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "خطا" },
      { status: 500 }
    );
  }
}
