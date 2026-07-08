import { requireAdmin } from "../../_auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/admin/guard";

export const runtime = "nodejs";

const VALID_STATUS = ["active", "needs_human", "human", "closed"];

// GET /api/admin/conversations/[id] — full thread + resolved citations.
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  const { id } = await ctx.params;

  const supabase = createAdminClient();
  const [{ data: conversation, error: convErr }, { data: messages, error: msgErr }] =
    await Promise.all([
      supabase
        .from("conversations")
        .select(
          "id, channel, external_user_id, status, summary, locale, started_at, updated_at, unified_users(name)"
        )
        .eq("id", id)
        .single(),
      supabase
        .from("messages")
        .select(
          "id, role, content, model_used, tokens_in, tokens_out, retrieved_chunk_ids, created_at, feedback(rating, comment)"
        )
        .eq("conversation_id", id)
        .order("created_at", { ascending: true }),
    ]);

  if (convErr) return Response.json({ error: convErr.message }, { status: 404 });
  if (msgErr) return Response.json({ error: msgErr.message }, { status: 500 });

  // Resolve citation titles for any retrieved_chunk_ids referenced in messages.
  const allChunkIds = [
    ...new Set((messages ?? []).flatMap((m) => m.retrieved_chunk_ids ?? [])),
  ];
  let chunkTitles: Record<string, { title: string; content: string }> = {};
  if (allChunkIds.length > 0) {
    const { data: chunks } = await supabase
      .from("chunks")
      .select("id, content, documents(title)")
      .in("id", allChunkIds);
    chunkTitles = Object.fromEntries(
      (chunks ?? []).map((c) => [
        c.id,
        {
          title:
            (c.documents as unknown as { title: string } | null)?.title ??
            "بدون عنوان",
          content: c.content,
        },
      ])
    );
  }

  return Response.json({ conversation, messages, chunkTitles });
}

// PATCH /api/admin/conversations/[id] — change status (handoff / close / return to bot).
export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  const { id } = await ctx.params;

  const body = await request.json().catch(() => null);
  if (!body?.status || !VALID_STATUS.includes(body.status)) {
    return Response.json({ error: "bad status" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("conversations")
    .update({ status: body.status })
    .eq("id", id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  await logAudit(auth.admin, "conversation.status", id, { status: body.status });
  return Response.json({ ok: true });
}
