"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Negative {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  messages: { id: string; content: string; conversation_id: string } | null;
}

interface Unanswered {
  id: string;
  content: string;
  conversation_id: string;
  created_at: string;
  question: string | null;
}

export function FeedbackReview() {
  const [negative, setNegative] = useState<Negative[]>([]);
  const [unanswered, setUnanswered] = useState<Unanswered[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/feedback");
      if (res.ok) {
        const data = await res.json();
        setNegative(data.negative ?? []);
        setUnanswered(data.unanswered ?? []);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <p className="mt-6 text-sm text-muted">در حال بارگذاری…</p>;

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="font-semibold">👎 پاسخ‌های نامفید ({negative.length})</h2>
        <div className="mt-4 space-y-3">
          {negative.length === 0 && <p className="text-sm text-muted">موردی ثبت نشده.</p>}
          {negative.map((n) => (
            <div key={n.id} className="rounded-lg border border-border bg-background p-3 text-sm">
              <p className="line-clamp-3">{n.messages?.content}</p>
              {n.comment && <p className="mt-1 text-xs text-muted">نظر: {n.comment}</p>}
              <div className="mt-2 flex items-center justify-between text-xs text-muted">
                <span dir="ltr">{new Date(n.created_at).toLocaleDateString("fa-IR")}</span>
                {n.messages?.conversation_id && (
                  <Link
                    href={`/admin/conversations/${n.messages.conversation_id}`}
                    className="text-brand-blue hover:underline"
                  >
                    مشاهدهٔ گفتگو ←
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="font-semibold">سؤالات بی‌پاسخ ({unanswered.length})</h2>
        <p className="mt-1 text-xs text-muted">
          پاسخ‌هایی که هیچ منبعی از پایگاه دانش پیدا نکردند — کاندید افزودن به دانش.
        </p>
        <div className="mt-4 space-y-3">
          {unanswered.length === 0 && <p className="text-sm text-muted">موردی ثبت نشده.</p>}
          {unanswered.map((u) => (
            <div key={u.id} className="rounded-lg border border-border bg-background p-3 text-sm">
              {u.question && <p className="font-medium">{u.question}</p>}
              <p className="mt-1 line-clamp-2 text-xs text-muted">{u.content}</p>
              <div className="mt-2 flex items-center justify-between text-xs text-muted">
                <span dir="ltr">{new Date(u.created_at).toLocaleDateString("fa-IR")}</span>
                <Link href="/admin/knowledge" className="text-brand-blue hover:underline">
                  افزودن به پایگاه دانش ←
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
