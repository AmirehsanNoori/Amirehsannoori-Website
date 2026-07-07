"use client";

import { useEffect, useState } from "react";

// =============================================================================
// Client manager for the knowledge base: upload (file/text/url), list with
// status, re-index, delete, and a test-search box. Talks to /api/admin/*.
// =============================================================================

interface Doc {
  id: string;
  title: string;
  source_type: string;
  source_url: string | null;
  status: string;
  error: string | null;
  tags: string[];
  chunk_count: number;
  char_count: number | null;
  created_at: string;
}

type SourceType = "text" | "url" | "pdf" | "word";

const statusLabel: Record<string, string> = {
  pending: "در صف",
  processing: "در حال پردازش",
  ready: "آماده",
  error: "خطا",
};

export function KnowledgeManager() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sourceType, setSourceType] = useState<SourceType>("text");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    { title: string; content: string; similarity: number }[] | null
  >(null);
  const [searching, setSearching] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/documents");
    if (res.ok) setDocs((await res.json()).documents ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData();
    form.set("sourceType", sourceType);
    form.set("title", title);
    form.set("tags", tags);
    if (sourceType === "text") form.set("text", text);
    if (sourceType === "url") form.set("url", url);
    if ((sourceType === "pdf" || sourceType === "word") && file) form.set("file", file);

    const res = await fetch("/api/admin/documents", { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "خطا در آپلود");
    } else {
      setTitle("");
      setText("");
      setUrl("");
      setTags("");
      setFile(null);
      await load();
    }
    setBusy(false);
  }

  async function reindex(id: string) {
    setBusy(true);
    await fetch(`/api/admin/documents/${id}/reindex`, { method: "POST" });
    await load();
    setBusy(false);
  }

  async function remove(id: string) {
    if (!confirm("این سند و همهٔ قطعه‌هایش حذف شود؟")) return;
    setBusy(true);
    await fetch(`/api/admin/documents/${id}`, { method: "DELETE" });
    await load();
    setBusy(false);
  }

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setResults(null);
    const res = await fetch("/api/admin/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const data = await res.json().catch(() => ({}));
    setResults(data.chunks ?? []);
    setSearching(false);
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      {/* Upload */}
      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="font-semibold">افزودن منبع</h2>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {(["text", "url", "pdf", "word"] as SourceType[]).map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setSourceType(t)}
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  sourceType === t
                    ? "bg-brand-blue text-white"
                    : "bg-background text-muted hover:text-foreground"
                }`}
              >
                {t === "text" ? "متن" : t === "url" ? "لینک" : t.toUpperCase()}
              </button>
            ))}
          </div>

          <input
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            placeholder="عنوان (اختیاری)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {sourceType === "text" && (
            <textarea
              className="h-32 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="متن دانش را اینجا بچسبانید…"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          )}
          {sourceType === "url" && (
            <input
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="https://example.com/page"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              dir="ltr"
            />
          )}
          {(sourceType === "pdf" || sourceType === "word") && (
            <input
              type="file"
              accept={sourceType === "pdf" ? ".pdf" : ".docx,.doc"}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm"
            />
          )}

          <input
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            placeholder="برچسب‌ها با کاما جدا شوند (اختیاری)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            disabled={busy}
            className="brand-gradient rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "در حال پردازش…" : "آپلود و ایندکس"}
          </button>
        </form>
      </section>

      {/* Test search */}
      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="font-semibold">جست‌وجوی آزمایشی</h2>
        <form onSubmit={runSearch} className="mt-4 flex gap-2">
          <input
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
            placeholder="یک سؤال بنویسید…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            disabled={searching}
            className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-60"
          >
            {searching ? "…" : "جست‌وجو"}
          </button>
        </form>
        {results && (
          <div className="mt-4 space-y-3">
            {results.length === 0 && (
              <p className="text-sm text-muted">نتیجه‌ای بالای آستانه یافت نشد.</p>
            )}
            {results.map((r, i) => (
              <div key={i} className="rounded-lg border border-border bg-background p-3">
                <div className="mb-1 flex items-center justify-between text-xs text-muted">
                  <span className="font-medium">{r.title}</span>
                  <span>{(r.similarity * 100).toFixed(0)}%</span>
                </div>
                <p className="line-clamp-3 text-sm">{r.content}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Document list */}
      <section className="rounded-xl border border-border bg-surface p-5 lg:col-span-2">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">اسناد ({docs.length})</h2>
          <button onClick={load} className="text-sm text-muted hover:text-foreground">
            به‌روزرسانی
          </button>
        </div>
        {loading ? (
          <p className="text-sm text-muted">در حال بارگذاری…</p>
        ) : docs.length === 0 ? (
          <p className="text-sm text-muted">هنوز سندی اضافه نشده.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="text-xs text-muted">
                <tr className="border-b border-border">
                  <th className="p-2 font-medium">عنوان</th>
                  <th className="p-2 font-medium">نوع</th>
                  <th className="p-2 font-medium">وضعیت</th>
                  <th className="p-2 font-medium">قطعه‌ها</th>
                  <th className="p-2 font-medium">اقدام</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id} className="border-b border-border/50">
                    <td className="p-2">
                      <div className="font-medium">{d.title}</div>
                      {d.error && <div className="text-xs text-red-500">{d.error}</div>}
                    </td>
                    <td className="p-2 text-muted">{d.source_type}</td>
                    <td className="p-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs ${
                          d.status === "ready"
                            ? "bg-green-500/15 text-green-600"
                            : d.status === "error"
                              ? "bg-red-500/15 text-red-600"
                              : "bg-amber-500/15 text-amber-600"
                        }`}
                      >
                        {statusLabel[d.status] ?? d.status}
                      </span>
                    </td>
                    <td className="p-2 text-muted">{d.chunk_count}</td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => reindex(d.id)}
                          disabled={busy}
                          className="text-brand-blue hover:underline disabled:opacity-50"
                        >
                          بازایندکس
                        </button>
                        <button
                          onClick={() => remove(d.id)}
                          disabled={busy}
                          className="text-red-500 hover:underline disabled:opacity-50"
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
