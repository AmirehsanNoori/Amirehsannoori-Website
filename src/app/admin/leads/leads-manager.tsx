"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Lead {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  locale: string;
  source: string;
  status: string;
  conversation_id: string | null;
  created_at: string;
}

const statusOptions = [
  { value: "new", label: "جدید" },
  { value: "contacted", label: "تماس گرفته شد" },
  { value: "converted", label: "تبدیل به مشتری" },
  { value: "closed", label: "بسته" },
];

const statusColor: Record<string, string> = {
  new: "bg-amber-500/15 text-amber-600",
  contacted: "bg-blue-500/15 text-blue-600",
  converted: "bg-green-500/15 text-green-600",
  closed: "bg-gray-500/15 text-gray-500",
};

export function LeadsManager() {
  const [items, setItems] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    const res = await fetch(`/api/admin/leads?${params}`);
    if (res.ok) setItems((await res.json()).leads ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function updateStatus(id: string, newStatus: string) {
    setItems((prev) => prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l)));
    await fetch("/api/admin/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: newStatus }),
    });
  }

  return (
    <div className="mt-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm"
        >
          <option value="">همهٔ وضعیت‌ها</option>
          {statusOptions.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <button
          onClick={load}
          className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:text-foreground"
        >
          به‌روزرسانی
        </button>
        <a
          href="/api/admin/leads/export"
          className="mr-auto rounded-lg bg-brand-blue px-3 py-1.5 text-sm text-white hover:opacity-90"
        >
          خروجی CSV
        </a>
      </div>

      {loading ? (
        <p className="text-sm text-muted">در حال بارگذاری…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted">لیدی یافت نشد.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-right text-sm">
            <thead className="text-xs text-muted">
              <tr className="border-b border-border">
                <th className="p-3 font-medium">نام / تماس</th>
                <th className="p-3 font-medium">پیام</th>
                <th className="p-3 font-medium">منبع</th>
                <th className="p-3 font-medium">وضعیت</th>
                <th className="p-3 font-medium">تاریخ</th>
              </tr>
            </thead>
            <tbody>
              {items.map((l) => (
                <tr key={l.id} className="border-b border-border/50 last:border-0 align-top">
                  <td className="p-3">
                    <div className="font-medium">{l.name || "—"}</div>
                    <div className="text-xs text-muted" dir="ltr">
                      {l.email}
                      {l.phone ? ` · ${l.phone}` : ""}
                    </div>
                  </td>
                  <td className="max-w-xs p-3 text-xs text-muted">
                    <div className="line-clamp-2">{l.message || "—"}</div>
                    {l.conversation_id && (
                      <Link
                        href={`/admin/conversations/${l.conversation_id}`}
                        className="mt-1 inline-block text-brand-blue hover:underline"
                      >
                        مشاهدهٔ گفتگو ←
                      </Link>
                    )}
                  </td>
                  <td className="p-3 text-xs text-muted">{l.source}</td>
                  <td className="p-3">
                    <select
                      value={l.status}
                      onChange={(e) => updateStatus(l.id, e.target.value)}
                      className={`rounded px-2 py-1 text-xs ${statusColor[l.status] ?? ""}`}
                    >
                      {statusOptions.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3 text-xs text-muted" dir="ltr">
                    {new Date(l.created_at).toLocaleDateString("fa-IR")}
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
