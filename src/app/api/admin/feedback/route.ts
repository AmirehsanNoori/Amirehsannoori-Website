import { requireAdmin } from "../_auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// GET /api/admin/feedback — negative feedback + unanswered questions (assistant
// replies with no retrieved chunks, i.e. the guardrail fallback fired).
export async function GET() {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  const supabase = createAdminClient();

  const [{ data: negative, error: negErr }, { data: unanswered, error: unErr }] =
    await Promise.all([
      supabase
        .from("feedback")
        .select("id, rating, comment, created_at, messages(id, content, conversation_id)")
        .eq("rating", -1)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("messages")
        .select("id, content, conversation_id, created_at")
        .eq("role", "assistant")
        .eq("retrieved_chunk_ids", "{}")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

  if (negErr) return Response.json({ error: negErr.message }, { status: 500 });
  if (unErr) return Response.json({ error: unErr.message }, { status: 500 });

  // Pair each unanswered assistant reply with the user question before it.
  const conversationIds = [...new Set((unanswered ?? []).map((m) => m.conversation_id))];
  let precedingByConv: Record<string, { content: string; created_at: string }[]> = {};
  if (conversationIds.length > 0) {
    const { data: userMsgs } = await supabase
      .from("messages")
      .select("conversation_id, content, created_at")
      .in("conversation_id", conversationIds)
      .eq("role", "user")
      .order("created_at", { ascending: true });
    precedingByConv = {};
    for (const m of userMsgs ?? []) {
      (precedingByConv[m.conversation_id] ??= []).push({
        content: m.content,
        created_at: m.created_at,
      });
    }
  }

  const unansweredWithQuestion = (unanswered ?? []).map((m) => {
    const candidates = precedingByConv[m.conversation_id] ?? [];
    const question = [...candidates].reverse().find((u) => u.created_at < m.created_at);
    return { ...m, question: question?.content ?? null };
  });

  return Response.json({ negative, unanswered: unansweredWithQuestion });
}
