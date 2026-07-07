"use client";

import { useEffect, useState } from "react";

// =============================================================================
// Embedding/retrieval config + per-channel generation model. Model catalogue is
// grouped by provider; slugs are OpenRouter namespaced ids (switching model = a
// single slug change). Changing the embedding model warns about re-indexing.
// =============================================================================

// OpenRouter model catalogue (readable label → slug). Verify exact slugs against
// the live OpenRouter catalogue; these follow its namespaced convention.
const MODELS: { group: string; items: { label: string; slug: string }[] }[] = [
  {
    group: "Anthropic (Claude)",
    items: [{ label: "Claude Haiku 4.5", slug: "anthropic/claude-haiku-4.5" }],
  },
  {
    group: "Google (Gemini)",
    items: [
      { label: "Gemini 2.5 Flash", slug: "google/gemini-2.5-flash" },
      { label: "Gemini 2.0 Flash", slug: "google/gemini-2.0-flash-001" },
    ],
  },
  {
    group: "OpenAI",
    items: [{ label: "GPT-4o mini", slug: "openai/gpt-4o-mini" }],
  },
  {
    group: "چندزبانه ارزان",
    items: [{ label: "Qwen 2.5 72B", slug: "qwen/qwen-2.5-72b-instruct" }],
  },
];

const EMBEDDING_MODELS = [
  { label: "Cohere multilingual v3 (۱۰۲۴)", provider: "cohere", model: "embed-multilingual-v3.0", dims: 1024 },
  { label: "OpenAI 3-large (۳۰۷۲)", provider: "openai", model: "text-embedding-3-large", dims: 3072 },
  { label: "OpenAI 3-small (۱۵۳۶)", provider: "openai", model: "text-embedding-3-small", dims: 1536 },
  { label: "Voyage multilingual-2 (۱۰۲۴)", provider: "voyage", model: "voyage-multilingual-2", dims: 1024 },
];

interface EmbeddingCfg {
  id: string;
  provider: string;
  model: string;
  dimensions: number;
  chunk_size: number;
  chunk_overlap: number;
  chunk_strategy: string;
  top_k: number;
  similarity_threshold: number;
  reranker_enabled: boolean;
  reranker_model: string | null;
}
interface ModelCfg {
  channel: string;
  active_model: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  fallback_provider: string | null;
  fallback_model: string | null;
}

export function SettingsForms() {
  const [embedding, setEmbedding] = useState<EmbeddingCfg | null>(null);
  const [models, setModels] = useState<ModelCfg[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/admin/config")
      .then((r) => r.json())
      .then((d) => {
        setEmbedding(d.embedding);
        setModels(d.models ?? []);
      });
  }, []);

  async function saveEmbedding() {
    if (!embedding) return;
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/admin/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embedding }),
    });
    setMsg(res.ok ? "تنظیمات Embedding ذخیره شد." : "خطا در ذخیره.");
    setBusy(false);
  }

  async function saveModel(m: ModelCfg) {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/admin/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: m }),
    });
    setMsg(res.ok ? `مدل کانال «${m.channel}» ذخیره شد.` : "خطا در ذخیره.");
    setBusy(false);
  }

  const dimsMismatch =
    embedding && embedding.dimensions !== 1024;

  return (
    <div className="mt-6 space-y-6">
      {msg && (
        <div className="rounded-lg border border-brand-blue/40 bg-brand-blue/10 px-4 py-2 text-sm">
          {msg}
        </div>
      )}

      {/* Model per channel */}
      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="font-semibold">مدل تولید پاسخ (به‌تفکیک کانال)</h2>
        <div className="mt-4 space-y-4">
          {models.map((m, idx) => (
            <div key={m.channel} className="rounded-lg border border-border bg-background p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium">
                  {m.channel === "default"
                    ? "پیش‌فرض"
                    : m.channel === "web"
                      ? "صفحه چت"
                      : m.channel === "widget"
                        ? "ویجت"
                        : "تلگرام"}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-1 block text-xs text-muted">مدل</span>
                  <select
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                    value={m.active_model}
                    onChange={(e) => {
                      const next = [...models];
                      next[idx] = { ...m, active_model: e.target.value };
                      setModels(next);
                    }}
                  >
                    {MODELS.map((g) => (
                      <optgroup key={g.group} label={g.group}>
                        {g.items.map((it) => (
                          <option key={it.slug} value={it.slug}>
                            {it.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-xs text-muted">Temperature</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                    value={m.temperature}
                    onChange={(e) => {
                      const next = [...models];
                      next[idx] = { ...m, temperature: Number(e.target.value) };
                      setModels(next);
                    }}
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-xs text-muted">Max tokens</span>
                  <input
                    type="number"
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                    value={m.max_tokens}
                    onChange={(e) => {
                      const next = [...models];
                      next[idx] = { ...m, max_tokens: Number(e.target.value) };
                      setModels(next);
                    }}
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-xs text-muted">مدل fallback (اختیاری)</span>
                  <input
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                    dir="ltr"
                    placeholder="google/gemini-2.5-flash"
                    value={m.fallback_model ?? ""}
                    onChange={(e) => {
                      const next = [...models];
                      next[idx] = { ...m, fallback_model: e.target.value };
                      setModels(next);
                    }}
                  />
                </label>
              </div>
              <button
                onClick={() => saveModel(m)}
                disabled={busy}
                className="mt-3 rounded-lg bg-brand-blue px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                ذخیره
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Embedding */}
      {embedding && (
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="font-semibold">Embedding و بازیابی</h2>

          {dimsMismatch && (
            <div className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm text-amber-700 dark:text-amber-400">
              ⚠ بُعد انتخابی با ستون بردار پایگاه‌داده (۱۰۲۴) یکی نیست. تغییر مدل با بُعد
              متفاوت نیازمند مهاجرت ستون و بازسازی کامل ایندکس است.
            </div>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-xs text-muted">مدل Embedding</span>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={`${embedding.provider}|${embedding.model}`}
                onChange={(e) => {
                  const [provider, model] = e.target.value.split("|");
                  const found = EMBEDDING_MODELS.find(
                    (x) => x.provider === provider && x.model === model
                  );
                  setEmbedding({
                    ...embedding,
                    provider,
                    model,
                    dimensions: found?.dims ?? embedding.dimensions,
                  });
                }}
              >
                {EMBEDDING_MODELS.map((x) => (
                  <option key={x.model} value={`${x.provider}|${x.model}`}>
                    {x.label}
                  </option>
                ))}
              </select>
            </label>
            <Field
              label="Chunk size (توکن)"
              value={embedding.chunk_size}
              onChange={(v) => setEmbedding({ ...embedding, chunk_size: v })}
            />
            <Field
              label="Chunk overlap (توکن)"
              value={embedding.chunk_overlap}
              onChange={(v) => setEmbedding({ ...embedding, chunk_overlap: v })}
            />
            <Field
              label="top_k"
              value={embedding.top_k}
              onChange={(v) => setEmbedding({ ...embedding, top_k: v })}
            />
            <Field
              label="آستانه شباهت (۰ تا ۱)"
              step="0.05"
              value={embedding.similarity_threshold}
              onChange={(v) => setEmbedding({ ...embedding, similarity_threshold: v })}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={embedding.reranker_enabled}
                onChange={(e) =>
                  setEmbedding({ ...embedding, reranker_enabled: e.target.checked })
                }
              />
              فعال‌سازی reranker (Cohere)
            </label>
          </div>
          <button
            onClick={saveEmbedding}
            disabled={busy}
            className="mt-4 rounded-lg bg-brand-blue px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            ذخیره تنظیمات
          </button>
        </section>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: string;
}) {
  return (
    <label className="text-sm">
      <span className="mb-1 block text-xs text-muted">{label}</span>
      <input
        type="number"
        step={step}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
