import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ChatMessage, Channel } from "./types";

// =============================================================================
// Conversation memory. Short-term = recent messages of the active conversation.
// Long-term = a rolling `summary` on the conversation row, regenerated when the
// history grows past a threshold so the context sent to the model stays bounded.
// =============================================================================

const RECENT_LIMIT = 12; // messages kept verbatim in the prompt
const SUMMARY_TRIGGER = 20; // total messages before we (re)summarise

export interface ConversationRef {
  id: string;
  summary: string | null;
}

/** Find-or-create the unified user + active conversation for this channel id. */
export async function getOrCreateConversation(input: {
  channel: Channel;
  externalUserId: string;
  userName?: string;
  locale: string;
}): Promise<ConversationRef> {
  const supabase = createAdminClient();

  // Upsert unified user.
  const { data: user } = await supabase
    .from("unified_users")
    .upsert(
      {
        channel: input.channel,
        external_id: input.externalUserId,
        name: input.userName ?? null,
        last_seen: new Date().toISOString(),
      },
      { onConflict: "channel,external_id" }
    )
    .select("id")
    .single();

  // Reuse the most recent active conversation, else create one.
  const { data: existing } = await supabase
    .from("conversations")
    .select("id, summary")
    .eq("channel", input.channel)
    .eq("external_user_id", input.externalUserId)
    .in("status", ["active", "needs_human", "human"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) return { id: existing.id, summary: existing.summary };

  const { data: created, error } = await supabase
    .from("conversations")
    .insert({
      channel: input.channel,
      unified_user_id: user?.id ?? null,
      external_user_id: input.externalUserId,
      locale: input.locale,
    })
    .select("id, summary")
    .single();

  if (error) throw new Error(`create conversation: ${error.message}`);
  return { id: created.id, summary: created.summary };
}

/** Reset: close the active conversation so the next message starts fresh. */
export async function resetConversation(
  channel: Channel,
  externalUserId: string
): Promise<void> {
  const supabase = createAdminClient();
  await supabase
    .from("conversations")
    .update({ status: "closed" })
    .eq("channel", channel)
    .eq("external_user_id", externalUserId)
    .in("status", ["active"]);
}

export async function getRecentMessages(
  conversationId: string
): Promise<ChatMessage[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .in("role", ["user", "assistant"])
    .order("created_at", { ascending: false })
    .limit(RECENT_LIMIT);

  return (data ?? [])
    .reverse()
    .map((m) => ({ role: m.role as ChatMessage["role"], content: m.content }));
}

export async function saveMessage(input: {
  conversationId: string;
  role: ChatMessage["role"];
  content: string;
  modelUsed?: string;
  tokensIn?: number;
  tokensOut?: number;
  retrievedChunkIds?: string[];
}): Promise<string> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: input.conversationId,
      role: input.role,
      content: input.content,
      model_used: input.modelUsed ?? null,
      tokens_in: input.tokensIn ?? null,
      tokens_out: input.tokensOut ?? null,
      retrieved_chunk_ids: input.retrievedChunkIds ?? [],
    })
    .select("id")
    .single();
  if (error) throw new Error(`save message: ${error.message}`);

  // touch conversation.updated_at
  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", input.conversationId);

  return data.id;
}

/**
 * Regenerate the rolling summary when a conversation grows long. Called after a
 * turn completes; uses a cheap model via OpenRouter. Best-effort (never throws
 * into the request path).
 */
export async function maybeSummarize(conversationId: string): Promise<void> {
  const supabase = createAdminClient();
  const { count } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", conversationId);

  if (!count || count < SUMMARY_TRIGGER) return;

  const { data: msgs } = await supabase
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .in("role", ["user", "assistant"])
    .order("created_at", { ascending: true });

  if (!msgs || msgs.length === 0) return;

  try {
    const { getOpenRouter } = await import("./openrouter");
    const transcript = msgs
      .map((m) => `${m.role === "user" ? "کاربر" : "دستیار"}: ${m.content}`)
      .join("\n");
    const res = await getOpenRouter().chat.completions.create({
      model: "anthropic/claude-haiku-4.5",
      messages: [
        {
          role: "system",
          content:
            "این گفتگو را در حداکثر ۴ جملهٔ فارسی خلاصه کن؛ روی نیاز کاربر و نکات کلیدی تمرکز کن.",
        },
        { role: "user", content: transcript },
      ],
      max_tokens: 300,
    });
    const summary = res.choices[0]?.message?.content?.trim();
    if (summary) {
      await supabase
        .from("conversations")
        .update({ summary })
        .eq("id", conversationId);
    }
  } catch {
    // best-effort; ignore summarization failures
  }
}
