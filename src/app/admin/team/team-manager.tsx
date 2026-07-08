"use client";

import { useEffect, useState } from "react";

interface Member {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

const roles = [
  { value: "owner", label: "مالک" },
  { value: "admin", label: "ادمین" },
  { value: "editor", label: "ویرایشگر محتوا" },
  { value: "operator", label: "اپراتور" },
  { value: "viewer", label: "فقط‌خواندنی" },
];

export function TeamManager() {
  const [members, setMembers] = useState<Member[]>([]);
  const [currentEmail, setCurrentEmail] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/team");
    if (res.ok) {
      const data = await res.json();
      setMembers(data.members ?? []);
      setCurrentEmail(data.currentEmail ?? "");
      setIsOwner(
        (data.members ?? []).find((m: Member) => m.email === data.currentEmail)?.role ===
          "owner"
      );
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) setError(data.error ?? "خطا در افزودن");
    else {
      setEmail("");
      await load();
    }
    setBusy(false);
  }

  async function remove(id: string) {
    if (!confirm("این عضو حذف شود؟")) return;
    setBusy(true);
    await fetch(`/api/admin/team?id=${id}`, { method: "DELETE" });
    await load();
    setBusy(false);
  }

  if (loading) return <p className="mt-6 text-sm text-muted">در حال بارگذاری…</p>;

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <section className="rounded-xl border border-border bg-surface p-5 lg:col-span-2">
        <h2 className="mb-4 font-semibold">اعضا ({members.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="text-xs text-muted">
              <tr className="border-b border-border">
                <th className="p-2 font-medium">ایمیل</th>
                <th className="p-2 font-medium">نقش</th>
                <th className="p-2 font-medium">اقدام</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b border-border/50 last:border-0">
                  <td className="p-2" dir="ltr">
                    {m.email}
                    {m.email === currentEmail && (
                      <span className="mr-2 text-xs text-muted">(شما)</span>
                    )}
                  </td>
                  <td className="p-2 text-muted">
                    {roles.find((r) => r.value === m.role)?.label ?? m.role}
                  </td>
                  <td className="p-2">
                    {isOwner && m.email !== currentEmail && (
                      <button
                        disabled={busy}
                        onClick={() => remove(m.id)}
                        className="text-red-500 hover:underline disabled:opacity-50"
                      >
                        حذف
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {isOwner && (
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="font-semibold">افزودن عضو</h2>
          <form onSubmit={invite} className="mt-4 space-y-3">
            <input
              type="email"
              required
              dir="ltr"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              {roles.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              disabled={busy}
              className="brand-gradient rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              افزودن
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
