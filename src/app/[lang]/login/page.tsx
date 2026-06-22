"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import faDict from "@/dictionaries/fa.json";
import enDict from "@/dictionaries/en.json";

type Step = "email" | "code";

export default function LoginPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const t = (lang === "en" ? enDict : faDict).auth;
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (error) {
      setError(error.message || t.genericError);
      return;
    }
    setStep("code");
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "email",
    });
    setLoading(false);
    if (error) {
      setError(error.message || t.genericError);
      return;
    }
    router.push(`/${lang}/account`);
    router.refresh();
  }

  async function signInWithGoogle() {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/${lang}/account`,
      },
    });
    if (error) setError(error.message || t.genericError);
  }

  return (
    <section className="mx-auto flex max-w-md flex-col px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="text-3xl font-bold tracking-tight">{t.loginTitle}</h1>
      <p className="mt-3 text-muted">{t.loginSubtitle}</p>

      {error && (
        <p className="mt-6 rounded-md border border-border bg-surface px-4 py-3 text-sm text-brand-purple">
          {error}
        </p>
      )}

      {step === "email" ? (
        <form onSubmit={sendCode} className="mt-8 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="email">
              {t.email}
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.emailPlaceholder}
              className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-brand-blue"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 w-full items-center justify-center rounded-md bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading ? t.sending : t.sendCode}
          </button>

          <div className="flex items-center gap-3 py-2">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted">{t.or}</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <button
            type="button"
            onClick={signInWithGoogle}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-border px-6 text-sm font-medium transition-colors hover:bg-surface"
          >
            <GoogleIcon />
            {t.google}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="mt-8 space-y-4">
          <p className="text-sm text-muted">
            {t.codeSentTo} <span dir="ltr" className="font-medium text-foreground">{email}</span>
          </p>
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="code">
              {t.code}
            </label>
            <input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              dir="ltr"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              className="h-11 w-full rounded-md border border-border bg-background px-3 text-center text-lg tracking-[0.4em] outline-none focus:border-brand-blue"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 w-full items-center justify-center rounded-md bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading ? t.verifying : t.verify}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setCode("");
              setError(null);
            }}
            className="block w-full text-center text-sm text-muted hover:text-foreground"
          >
            {t.changeEmail}
          </button>
        </form>
      )}
    </section>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}
