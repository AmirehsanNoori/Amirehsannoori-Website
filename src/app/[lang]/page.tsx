import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "@/lib/i18n";

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = dict.home;
  const base = `/${lang}`;

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Blueprint grid */}
        <div className="bg-grid absolute inset-0 opacity-50 dark:opacity-30" aria-hidden="true" />
        {/* Radial fade over grid */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% -10%, transparent 60%, var(--color-background) 100%)",
          }}
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-24 sm:px-6 sm:pb-32 sm:pt-36">
          {/* Kicker pill */}
          <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5">
            <span className="brand-gradient h-1.5 w-1.5 rounded-full" aria-hidden="true" />
            <span className="font-heading text-xs font-semibold uppercase tracking-widest text-muted">
              {t.kicker}
            </span>
          </div>

          {/* Title */}
          <h1 className="animate-fade-up delay-100 mt-6 max-w-3xl text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
            {t.title}
          </h1>

          {/* Subtitle */}
          <p className="animate-fade-up delay-200 mt-6 max-w-xl text-lg leading-relaxed text-muted">
            {t.subtitle}
          </p>

          {/* CTAs */}
          <div className="animate-fade-up delay-300 mt-10 flex flex-wrap gap-3">
            <Link
              href={`${base}/book`}
              className="inline-flex h-12 items-center gap-2 rounded-md bg-foreground px-7 text-sm font-semibold text-background shadow-sm transition-opacity hover:opacity-85"
            >
              {t.ctaPrimary}
            </Link>
            <Link
              href={`${base}/work`}
              className="inline-flex h-12 items-center rounded-md border border-border px-7 text-sm font-medium text-foreground transition-colors hover:border-foreground/40 hover:bg-surface"
            >
              {t.ctaSecondary} →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Value statement ──────────────────────────────────────────── */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="grid gap-10 md:grid-cols-2 md:gap-20 md:items-center">
            <div>
              <h2 className="text-2xl font-bold leading-snug sm:text-3xl">
                {t.valueTitle}
              </h2>
            </div>
            <div>
              <p className="text-base leading-relaxed text-muted">{t.valueBody}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pillars ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="grid gap-px border border-border bg-border sm:grid-cols-3">
          {t.pillars.map((p, i) => (
            <div
              key={p.title}
              className="group flex flex-col bg-background p-8 transition-colors hover:bg-surface"
            >
              <span className="brand-gradient-text font-heading text-3xl font-bold leading-none">
                0{i + 1}
              </span>
              <h3 className="mt-5 text-lg font-semibold">{p.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{p.body}</p>
              <div className="brand-gradient mt-8 h-px w-0 transition-all duration-500 group-hover:w-full" />
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA strip ────────────────────────────────────────────────── */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="brand-gradient-text font-heading text-sm font-semibold uppercase tracking-widest">
                {dict.nav.book}
              </p>
              <p className="mt-2 text-2xl font-bold sm:text-3xl">{dict.services.tiers[0].name}</p>
              <p className="mt-1 text-sm text-muted">{dict.services.tiers[0].duration}</p>
            </div>
            <Link
              href={`${base}/book`}
              className="inline-flex h-12 shrink-0 items-center gap-2 rounded-md bg-foreground px-8 text-sm font-semibold text-background transition-opacity hover:opacity-85"
            >
              {dict.services.tiers[0].cta} →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
