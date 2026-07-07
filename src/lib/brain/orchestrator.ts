import "server-only";
import { getModelConfig, getActiveSystemPrompt } from "./config";
import { retrieve } from "./retrieve";
import { runGeneration } from "./generate";
import { buildContextBlock } from "./guardrails";
import {
  getOrCreateConversation,
  getRecentMessages,
  saveMessage,
  maybeSummarize,
} from "./memory";
import type { ChatCompletionMessage } from "./openrouter";
import type { BrainRequest, BrainEvent, Citation } from "./types";

// =============================================================================
// The single brain entry point. Every channel (web, widget, telegram) calls
// runChat() and consumes the same event stream. This is the ONLY place that
// wires retrieval → generation → memory → tools together.
// =============================================================================

export async function* runChat(req: BrainRequest): AsyncGenerator<BrainEvent> {
  const locale = req.locale ?? "fa";

  try {
    // 1. Resolve conversation + config
    const conversation = await getOrCreateConversation({
      channel: req.channel,
      externalUserId: req.externalUserId,
      userName: req.userName,
      locale,
    });
    const [modelCfg, systemPrompt] = await Promise.all([
      getModelConfig(req.channel),
      getActiveSystemPrompt(),
    ]);

    // 2. Retrieve context
    const chunks = await retrieve(req.userMessage);
    const citations: Citation[] = dedupeCitations(chunks);
    if (citations.length > 0) {
      yield { type: "citations", value: citations };
    }

    // 3. Persist the user's message
    await saveMessage({
      conversationId: conversation.id,
      role: "user",
      content: req.userMessage,
    });

    // 4. Assemble the prompt: system + persona, rolling summary, context, history
    const history = await getRecentMessages(conversation.id);
    const messages: ChatCompletionMessage[] = [
      { role: "system", content: systemPrompt },
    ];
    if (conversation.summary) {
      messages.push({
        role: "system",
        content: `خلاصهٔ گفتگوی قبلی:\n${conversation.summary}`,
      });
    }
    messages.push({
      role: "system",
      content: buildContextBlock(chunks),
    });
    // recent history already includes the just-saved user message at the end
    for (const m of history) {
      messages.push({ role: m.role as "user" | "assistant", content: m.content });
    }

    // 5. Stream generation (handles tool calls internally)
    let finalText = "";
    let tokensIn = 0;
    let tokensOut = 0;

    for await (const ev of runGeneration({
      model: modelCfg,
      messages,
      toolCtx: {
        conversationId: conversation.id,
        channel: req.channel,
        locale,
      },
    })) {
      if (ev.type === "token") {
        yield { type: "token", value: ev.value };
      } else if (ev.type === "tool") {
        yield { type: "tool", name: ev.name, status: ev.status };
      } else if (ev.type === "usage") {
        tokensIn = ev.tokensIn;
        tokensOut = ev.tokensOut;
      } else if (ev.type === "final") {
        finalText = ev.text;
      }
    }

    // 6. Persist the assistant's answer + token usage
    const messageId = await saveMessage({
      conversationId: conversation.id,
      role: "assistant",
      content: finalText,
      modelUsed: modelCfg.activeModel,
      tokensIn,
      tokensOut,
      retrievedChunkIds: chunks.map((c) => c.id),
    });

    // 7. Long-conversation summarization (best-effort, non-blocking semantics)
    await maybeSummarize(conversation.id);

    yield { type: "done", conversationId: conversation.id, messageId };
  } catch (err) {
    yield {
      type: "error",
      message: err instanceof Error ? err.message : "خطای ناشناخته",
    };
  }
}

function dedupeCitations(
  chunks: { documentId: string; title: string; similarity: number }[]
): Citation[] {
  const byDoc = new Map<string, Citation>();
  for (const c of chunks) {
    const existing = byDoc.get(c.documentId);
    if (!existing || c.similarity > existing.similarity) {
      byDoc.set(c.documentId, {
        documentId: c.documentId,
        title: c.title,
        similarity: c.similarity,
      });
    }
  }
  return [...byDoc.values()].sort((a, b) => b.similarity - a.similarity);
}
