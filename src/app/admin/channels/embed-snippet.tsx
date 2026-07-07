"use client";

import { useState } from "react";

export function EmbedSnippet() {
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "https://amirehsannoori.ir";
  const snippet = `<script src="${origin}/api/widget/loader.js" data-position="bottom-right" async></script>`;

  function copy() {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="mt-6 rounded-xl border border-border bg-surface p-5">
      <h2 className="font-semibold">ویجت وب</h2>
      <p className="mt-1 text-sm text-muted">
        این تگ را قبل از <code>&lt;/body&gt;</code> هر سایتی بچسبانید تا حباب گفتگو اضافه شود.
      </p>
      <pre className="mt-3 overflow-x-auto rounded-lg border border-border bg-background p-3 text-xs" dir="ltr">
        {snippet}
      </pre>
      <button
        onClick={copy}
        className="mt-3 rounded-lg bg-brand-blue px-4 py-1.5 text-sm font-semibold text-white"
      >
        {copied ? "کپی شد ✓" : "کپی کد"}
      </button>
      <p className="mt-4 text-xs text-muted">
        برای محدودسازی به دامنه‌های خاص، جدول <code>widget_config.allowed_domains</code> را در
        Supabase تنظیم کنید (خالی = مجاز برای همه، مناسب حالت توسعه).
      </p>
    </section>
  );
}
