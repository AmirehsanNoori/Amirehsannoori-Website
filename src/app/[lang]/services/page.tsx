import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "@/lib/i18n";

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = dict.services;
  const base = `/${lang}`;

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      {/* Header */}
      <div className="max-w-2xl">
        <p className="brand-gradient-text font-heading text-xs font-semibold uppercase tracking-widest">
          {t.title}
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{t.title}</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted">{t.intro}</p>
      </div>

      {/* Tiers */}
      <div className="mt-14 grid gap-6 sm:grid-cols-2">
        {/* Discovery — free */}
        <div className="flex flex-col rounded-xl border border-border bg-surface p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">{t.tiers[0].name}</h2>
              <p className="mt-1 text-sm text-muted">{t.tiers[0].duration}</p>
            </div>
            <span className="shrink-0 rounded-full border border-border bg-background px-3 py-0.5 text-xs font-semibold text-foreground">
              {dict.book.free}
            </span>
          </div>
          <p className="mt-5 flex-1 text-sm leading-relaxed text-muted">{t.tiers[0].body}</p>
          <Link
            href={`${base}/book`}
            className="mt-8 inline-flex h-11 items-center justify-center rounded-md border border-border bg-background px-6 text-sm font-medium text-foreground transition-colors hover:border-foreground/40 hover:bg-background"
          >
            {t.tiers[0].cta} →
          </Link>
        </div>

        {/* Strategy — paid, featured */}
        <div className="relative flex flex-col overflow-hidden rounded-xl border border-foreground/20 bg-foreground p-8 text-background dark:border-foreground/10">
          {/* Subtle grid on dark card */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage:
                "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
            aria-hidden="true"
          />
          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">{t.tiers[1].name}</h2>
                <p className="mt-1 text-sm opacity-60">{t.tiers[1].duration}</p>
              </div>
              <span className="brand-gradient shrink-0 rounded-full px-3 py-0.5 text-xs font-semibold text-white">
                60 min
              </span>
            </div>
            <p className="mt-5 flex-1 text-sm leading-relaxed opacity-70">{t.tiers[1].body}</p>
            <Link
              href={`${base}/book`}
              className="mt-8 inline-flex h-11 items-center justify-center rounded-md bg-white px-6 text-sm font-semibold text-foreground transition-opacity hover:opacity-90"
            >
              {t.tiers[1].cta} →
            </Link>
          </div>
        </div>
      </div>

      <p className="mt-8 text-xs text-muted">{t.note}</p>
    </section>
  );
}
