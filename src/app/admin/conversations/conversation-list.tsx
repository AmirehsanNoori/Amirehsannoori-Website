"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Conversation {
  id: string;
  channel: string;
  external_user_id: string;
  status: string;
  summary: string | null;
  locale: string;
  started_at: string;
  updated_at: string;
  unified_users: { name: string | null } | null;
}

const statusLabel: Record<string, string> = {
  active: "فعال (بات)",
  needs_human: "نیاز به انسان",
  human: "اپراتور",
  closed: "بسته",
};

const statusColor: Record<string, string> = {
  active: "bg-blue-500/15 text-blue-600",
  needs_human: "bg-amber-500/15 text-amber-600",
  human: "bg-purple-500/15 text-purple-600",
  closed: "bg-gray-500/15 text-gray-500",
};

const channelLabel: Record<string, string> = {
  web: "صفحهٔ کامل",
  widget: "ویجت",
  telegram: "تلگرام",
};

export function ConversationList() {
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState("");
  const [status, setStatus] = useState("");

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (channel) params.set("channel", channel);
    if (status) params.set("status", status);
    const res = await fetch(`/api/admin/conversations?${params}`);
    if (res.ok) setItems((await res.json()).conversations ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, status]);

  return (
    <div className="mt-6">
      <div className="mb-4 flex flex-wrap gap-2">
        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm"
        >
          <option value="">همهٔ کانال‌ها</option>
          <option value="web">صفحهٔ کامل</option>
          <option value="widget">ویجت</option>
          <option value="telegram">تلگرام</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm"
        >
          <option value="">همهٔ وضعیت‌ها</option>
          <option value="active">فعال (بات)</option>
          <option value="needs_human">نیاز به انسان</option>
          <option value="human">اپراتور</option>
          <option value="closed">بسته</option>
        </select>
        <button
          onClick={load}
          className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:text-foreground"
        >
          به‌روزرسانی
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-muted">در حال بارگذاری…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted">گفتگویی یافت نشد.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <table className="w-full text-right text-sm">
            <thead className="text-xs text-muted">
              <tr className="border-b border-border">
                <th className="p-3 font-medium">کاربر</th>
                <th className="p-3 font-medium">کانال</th>
                <th className="p-3 font-medium">وضعیت</th>
                <th className="p-3 font-medium">آخرین فعالیت</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-b border-border/50 last:border-0">
                  <td className="p-3">
                    <Link href={`/admin/conversations/${c.id}`} className="hover:underline">
                      <div className="font-medium">
                        {c.unified_users?.name || c.external_user_id.slice(0, 12)}
                      </div>
                      {c.summary && (
                        <div className="mt-0.5 line-clamp-1 text-xs text-muted">{c.summary}</div>
                      )}
                    </Link>
                  </td>
                  <td className="p-3 text-muted">{channelLabel[c.channel] ?? c.channel}</td>
                  <td className="p-3">
                    <span className={`rounded px-2 py-0.5 text-xs ${statusColor[c.status] ?? ""}`}>
                      {statusLabel[c.status] ?? c.status}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-muted" dir="ltr">
                    {new Date(c.updated_at).toLocaleString("fa-IR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
