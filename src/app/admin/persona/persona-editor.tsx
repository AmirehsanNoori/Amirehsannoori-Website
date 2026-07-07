"use client";

import { useEffect, useState } from "react";

interface Version {
  id: string;
  content: string;
  persona: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

export function PersonaEditor() {
  const [versions, setVersions] = useState<Version[]>([]);
  const [content, setContent] = useState("");
  const [persona, setPersona] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/prompt");
    if (res.ok) {
      const data = await res.json();
      const v: Version[] = data.versions ?? [];
      setVersions(v);
      const active = v.find((x) => x.is_active);
      if (active && !content) {
        setContent(active.content);
        setPersona(active.persona ?? "");
      }
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    if (!content.trim()) return;
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/admin/prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, persona, activate: true }),
    });
    setMsg(res.ok ? "نسخهٔ جدید ذخیره و فعال شد." : "خطا در ذخیره.");
    await load();
    setBusy(false);
  }

  async function activate(id: string) {
    setBusy(true);
    await fetch("/api/admin/prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activateId: id }),
    });
    await load();
    setBusy(false);
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-3">
      <section className="rounded-xl border border-border bg-surface p-5 lg:col-span-2">
        {msg && (
          <div className="mb-3 rounded-lg border border-brand-blue/40 bg-brand-blue/10 px-4 py-2 text-sm">
            {msg}
          </div>
        )}
        <label className="text-sm">
          <span className="mb-1 block text-xs text-muted">برچسب پرسونا (اختیاری)</span>
          <input
            className="mb-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            placeholder="مثلاً: راهنمای مشاوره"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs text-muted">System Prompt</span>
          <textarea
            className="h-96 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm leading-7"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </label>
        <button
          onClick={save}
          disabled={busy}
          className="brand-gradient mt-3 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? "…" : "ذخیره نسخهٔ جدید و فعال‌سازی"}
        </button>
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-3 font-semibold">نسخه‌ها</h2>
        <div className="space-y-2">
          {versions.map((v) => (
            <div
              key={v.id}
              className="rounded-lg border border-border bg-background p-3 text-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{v.persona ?? "بدون برچسب"}</span>
                {v.is_active ? (
                  <span className="rounded bg-green-500/15 px-2 py-0.5 text-xs text-green-600">
                    فعال
                  </span>
                ) : (
                  <button
                    onClick={() => activate(v.id)}
                    disabled={busy}
                    className="text-xs text-brand-blue hover:underline"
                  >
                    فعال کن
                  </button>
                )}
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-muted">{v.content}</p>
              <p className="mt-1 text-[10px] text-muted opacity-60">
                {new Date(v.created_at).toLocaleString("fa-IR")} · {v.created_by ?? ""}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
