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
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-20 sm:px-6 sm:pt-28">
        <p className="brand-gradient-text font-heading text-sm font-semibold uppercase tracking-widest">
          {t.kicker}
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          {t.title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted">{t.subtitle}</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href={`${base}/services`}
            className="inline-flex h-11 items-center rounded-md bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            {t.ctaPrimary}
          </Link>
          <Link
            href={`${base}/work`}
            className="inline-flex h-11 items-center rounded-md border border-border px-6 text-sm font-medium text-foreground transition-colors hover:bg-surface"
          >
            {t.ctaSecondary}
          </Link>
        </div>
      </section>

      {/* Value */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="max-w-2xl text-2xl font-semibold sm:text-3xl">
            {t.valueTitle}
          </h2>
          <p className="mt-4 max-w-2xl text-muted">{t.valueBody}</p>
        </div>
      </section>

      {/* Pillars */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-3">
          {t.pillars.map((p, i) => (
            <div
              key={p.title}
              className="rounded-lg border border-border p-6"
            >
              <span className="brand-gradient-text font-heading text-2xl font-bold">
                0{i + 1}
              </span>
              <h3 className="mt-3 text-lg font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm text-muted">{p.body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
