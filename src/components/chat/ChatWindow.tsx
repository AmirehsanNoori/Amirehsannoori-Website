"use client";

import { useEffect, useRef, useState } from "react";
import { streamChat, getSessionId, type ChatStreamEvent } from "@/lib/chat-client";

// =============================================================================
// Shared chat UI — used identically by the full-page /consultant channel and
// the embeddable widget. All logic (streaming, citations, tool status,
// feedback) lives here so the two channels never drift.
// =============================================================================

interface Citation {
  documentId: string;
  title: string;
  similarity: number;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  toolStatus?: string;
  messageId?: string;
}

export function ChatWindow({
  channel,
  welcomeMessage,
  suggestedQuestions,
  onLeadCaptured,
  compact = false,
}: {
  channel: "web" | "widget";
  welcomeMessage?: string;
  suggestedQuestions?: string[];
  onLeadCaptured?: () => void;
  compact?: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 1 | -1>>({});
  const sessionId = useRef<string>("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sessionId.current = getSessionId(channel === "widget" ? "aen_widget_session" : "aen_chat_session");
  }, [channel]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: trimmed };
    const assistantMsg: Message = { id: crypto.randomUUID(), role: "assistant", content: "" };
    setMessages((m) => [...m, userMsg, assistantMsg]);
    setInput("");
    setBusy(true);

    try {
      for await (const ev of streamChat({
        channel,
        sessionId: sessionId.current,
        message: trimmed,
      })) {
        applyEvent(assistantMsg.id, ev);
      }
    } finally {
      setBusy(false);
    }
  }

  function applyEvent(assistantId: string, ev: ChatStreamEvent) {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== assistantId) return m;
        if (ev.type === "token") return { ...m, content: m.content + ev.value };
        if (ev.type === "citations") return { ...m, citations: ev.value };
        if (ev.type === "tool") {
          return {
            ...m,
            toolStatus:
              ev.status === "called"
                ? ev.name === "capture_lead"
                  ? "در حال ثبت درخواست…"
                  : "در حال ارجاع…"
                : undefined,
          };
        }
        if (ev.type === "done") {
          return { ...m, messageId: ev.messageId };
        }
        if (ev.type === "error") {
          return { ...m, content: m.content || `خطا: ${ev.message}` };
        }
        return m;
      })
    );
    if (ev.type === "tool" && ev.name === "capture_lead" && ev.status === "done") {
      onLeadCaptured?.();
    }
  }

  async function sendFeedback(messageId: string, rating: 1 | -1) {
    setFeedbackGiven((f) => ({ ...f, [messageId]: rating }));
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, rating }),
    }).catch(() => {});
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="space-y-3">
            {welcomeMessage && (
              <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-surface px-4 py-2.5 text-sm">
                {welcomeMessage}
              </div>
            )}
            {suggestedQuestions && suggestedQuestions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="rounded-full border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:border-brand-blue hover:text-foreground"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "flex justify-start" : "flex justify-end"}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                m.role === "user"
                  ? "rounded-tl-sm bg-brand-blue text-white"
                  : "rounded-tr-sm bg-surface text-foreground"
              }`}
            >
              {m.content || (busy && m.role === "assistant" ? <TypingDots /> : null)}

              {m.toolStatus && <p className="mt-1 text-xs opacity-70">{m.toolStatus}</p>}

              {m.citations && m.citations.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 border-t border-border/50 pt-2">
                  {m.citations.map((c) => (
                    <span
                      key={c.documentId}
                      className="rounded bg-background px-2 py-0.5 text-[10px] text-muted"
                      title={`شباهت ${(c.similarity * 100).toFixed(0)}%`}
                    >
                      📄 {c.title}
                    </span>
                  ))}
                </div>
              )}

              {m.role === "assistant" && m.messageId && !busy && (
                <div className="mt-2 flex gap-2 border-t border-border/50 pt-2 text-xs">
                  <button
                    onClick={() => sendFeedback(m.messageId!, 1)}
                    className={feedbackGiven[m.messageId] === 1 ? "opacity-100" : "opacity-40 hover:opacity-70"}
                    aria-label="پاسخ مفید بود"
                  >
                    👍
                  </button>
                  <button
                    onClick={() => sendFeedback(m.messageId!, -1)}
                    className={feedbackGiven[m.messageId] === -1 ? "opacity-100" : "opacity-40 hover:opacity-70"}
                    aria-label="پاسخ مفید نبود"
                  >
                    👎
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className={`flex items-center gap-2 border-t border-border p-3 ${compact ? "" : ""}`}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="سؤال خود را بنویسید…"
          disabled={busy}
          className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:border-brand-blue"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="brand-gradient flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white disabled:opacity-50"
          aria-label="ارسال"
        >
          <SendIcon />
        </button>
      </form>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex gap-1">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted" />
    </span>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 2 11 13" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 2 15 22l-4-9-9-4 20-7Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
