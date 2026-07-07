// =============================================================================
// Client-side streaming helper for /api/chat. Parses the text/event-stream
// response into typed events. Shared by the full-page channel and the widget —
// this is the only place that knows the wire format.
// =============================================================================

export type ChatStreamEvent =
  | { type: "token"; value: string }
  | { type: "citations"; value: { documentId: string; title: string; similarity: number }[] }
  | { type: "tool"; name: string; status: "called" | "done" }
  | { type: "done"; conversationId: string; messageId: string }
  | { type: "error"; message: string };

export async function* streamChat(input: {
  channel: "web" | "widget";
  sessionId: string;
  message: string;
  locale?: string;
  userName?: string;
  signal?: AbortSignal;
}): AsyncGenerator<ChatStreamEvent> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      channel: input.channel,
      sessionId: input.sessionId,
      message: input.message,
      locale: input.locale ?? "fa",
      userName: input.userName,
    }),
    signal: input.signal,
  });

  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}));
    yield { type: "error", message: data.error ?? `HTTP ${res.status}` };
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      const line = part.split("\n").find((l) => l.startsWith("data: "));
      if (!line) continue;
      try {
        yield JSON.parse(line.slice(6)) as ChatStreamEvent;
      } catch {
        // ignore malformed frame
      }
    }
  }
}

/** Stable per-browser session id, persisted in localStorage. */
export function getSessionId(storageKey = "aen_chat_session"): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem(storageKey);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(storageKey, id);
  }
  return id;
}
