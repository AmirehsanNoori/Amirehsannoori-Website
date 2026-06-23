"use client";

import { useState } from "react";
import Link from "next/link";

type ContactDict = {
  name: string;
  email: string;
  message: string;
  submit: string;
  sending: string;
  sent: string;
  sentBody: string;
  error: string;
  or: string;
};

export function ContactForm({ lang, t }: { lang: string; t: ContactDict }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          email: fd.get("email"),
          message: fd.get("message"),
          locale: lang,
        }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="mt-10 rounded-lg border border-border bg-surface p-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M4 10l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="mt-4 text-lg font-semibold">{t.sent}</p>
        <p className="mt-2 text-sm text-muted">{t.sentBody}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 space-y-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium" htmlFor="name">
          {t.name}
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-brand-blue"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium" htmlFor="email">
          {t.email}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-brand-blue"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium" htmlFor="message">
          {t.message}
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          className="w-full resize-none rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand-blue"
        />
      </div>

      {status === "error" && (
        <p className="rounded border border-border bg-surface px-4 py-3 text-sm text-brand-purple">
          {t.error}
        </p>
      )}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={status === "sending"}
          className="h-11 rounded-md bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {status === "sending" ? t.sending : t.submit}
        </button>
        <Link
          href={`/${lang}/book`}
          className="text-sm text-muted underline-offset-4 hover:text-foreground hover:underline"
        >
          {t.or}
        </Link>
      </div>
    </form>
  );
}
