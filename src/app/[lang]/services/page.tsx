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

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t.title}</h1>
      <p className="mt-4 max-w-2xl text-muted">{t.intro}</p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {t.tiers.map((tier) => (
          <div
            key={tier.name}
            className="flex flex-col rounded-lg border border-border p-8"
          >
            <h2 className="text-xl font-semibold">{tier.name}</h2>
            <p className="brand-gradient-text mt-1 text-sm font-semibold">
              {tier.duration}
            </p>
            <p className="mt-4 flex-1 text-sm text-muted">{tier.body}</p>
            <button
              type="button"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              {tier.cta}
            </button>
          </div>
        ))}
      </div>

      <p className="mt-8 text-sm text-muted">{t.note}</p>
    </section>
  );
}
