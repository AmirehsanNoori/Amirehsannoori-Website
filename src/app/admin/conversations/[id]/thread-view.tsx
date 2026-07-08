"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Msg {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  model_used: string | null;
  tokens_in: number | null;
  tokens_out: number | null;
  retrieved_chunk_ids: string[];
  created_at: string;
  feedback: { rating: number; comment: string | null }[];
}

interface ConversationDetail {
  id: string;
  channel: string;
  external_user_id: string;
  status: string;
  locale: string;
  unified_users: { name: string | null } | null;
}

const statusOptions = [
  { value: "active", label: "فعال (بات)" },
  { value: "needs_human", label: "نیاز به انسان" },
  { value: "human", label: "اپراتور (بات متوقف)" },
  { value: "closed", label: "بسته" },
];

export function ThreadView({ id }: { id: string }) {
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [chunkTitles, setChunkTitles] = useState<
    Record<string, { title: string; content: string }>
  >({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/admin/conversations/${id}`);
    if (res.ok) {
      const data = await res.json();
      setConversation(data.conversation);
      setMessages(data.messages ?? []);
      setChunkTitles(data.chunkTitles ?? {});
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function setStatus(status: string) {
    setBusy(true);
    await fetch(`/api/admin/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await load();
    setBusy(false);
  }

  if (loading) return <p className="mt-6 text-sm text-muted">در حال بارگذاری…</p>;
  if (!conversation) return <p className="mt-6 text-sm text-muted">گفتگو یافت نشد.</p>;

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_260px]">
      {/* Thread */}
      <div className="space-y-3 rounded-xl border border-border bg-surface p-5">
        {messages
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => (
            <div key={m.id} className={m.role === "user" ? "flex justify-start" : "flex justify-end"}>
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === "user"
                    ? "rounded-tl-sm bg-background"
                    : "rounded-tr-sm bg-brand-blue/10"
                }`}
              >
                {m.content}

                {m.role === "assistant" && m.retrieved_chunk_ids.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5 border-t border-border/50 pt-2">
                    {m.retrieved_chunk_ids.map((cid) => (
                      <span
                        key={cid}
                        className="rounded bg-background px-2 py-0.5 text-[10px] text-muted"
                        title={chunkTitles[cid]?.content?.slice(0, 200)}
                      >
                        📄 {chunkTitles[cid]?.title ?? cid.slice(0, 8)}
                      </span>
                    ))}
                  </div>
                )}

                {m.role === "assistant" && m.feedback?.length > 0 && (
                  <div className="mt-1 text-xs">
                    {m.feedback.map((f, i) => (
                      <span key={i}>{f.rating === 1 ? "👍" : "👎"}</span>
                    ))}
                  </div>
                )}

                <div className="mt-1 flex items-center gap-2 text-[10px] text-muted" dir="ltr">
                  {new Date(m.created_at).toLocaleTimeString("fa-IR")}
                  {m.model_used && <span>· {m.model_used}</span>}
                  {m.tokens_in != null && (
                    <span>
                      · {m.tokens_in}↑/{m.tokens_out}↓ توکن
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        {messages.filter((m) => m.role === "user" || m.role === "assistant").length === 0 && (
          <p className="text-sm text-muted">پیامی ثبت نشده.</p>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-surface p-4 text-sm">
          <div className="text-xs text-muted">کاربر</div>
          <div className="font-medium">
            {conversation.unified_users?.name || conversation.external_user_id}
          </div>
          <div className="mt-3 text-xs text-muted">کانال</div>
          <div>{conversation.channel}</div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="mb-2 text-xs text-muted">وضعیت</div>
          <div className="flex flex-col gap-1.5">
            {statusOptions.map((s) => (
              <button
                key={s.value}
                disabled={busy || conversation.status === s.value}
                onClick={() => setStatus(s.value)}
                className={`rounded-lg px-3 py-1.5 text-right text-sm disabled:opacity-100 ${
                  conversation.status === s.value
                    ? "bg-brand-blue text-white"
                    : "bg-background text-muted hover:text-foreground"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <Link
          href="/admin/conversations"
          className="block text-center text-sm text-brand-blue hover:underline"
        >
          ← بازگشت به لیست
        </Link>
      </div>
    </div>
  );
}
