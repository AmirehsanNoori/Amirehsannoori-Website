import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "@/lib/i18n";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = dict.about;

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      {/* Header row */}
      <div className="grid gap-16 md:grid-cols-[1fr_auto] md:items-start">
        <div className="max-w-2xl">
          <p className="brand-gradient-text font-heading text-xs font-semibold uppercase tracking-widest">
            {t.title}
          </p>

          {/* Lead */}
          <p className="mt-6 text-3xl font-bold leading-snug tracking-tight sm:text-4xl">
            {t.lead}
          </p>

          {/* Body with left accent */}
          <div className="relative mt-8">
            <div className="brand-gradient absolute start-0 top-0 bottom-0 w-px" />
            <p className="ps-5 text-base leading-loose text-muted">{t.body}</p>
          </div>
        </div>

        {/* Monogram block */}
        <div
          className="hidden md:flex h-40 w-40 items-center justify-center rounded-2xl border border-border bg-surface"
          aria-hidden="true"
        >
          <span className="brand-gradient-text font-heading text-6xl font-bold leading-none select-none">
            AN
          </span>
        </div>
      </div>

      {/* Values */}
      <div className="mt-16 border-t border-border pt-12">
        <p className="font-heading text-xs font-semibold uppercase tracking-widest text-muted">
          {lang === "fa" ? "اصول" : "Principles"}
        </p>
        <ul className="mt-6 grid gap-4 sm:grid-cols-3">
          {t.values.map((value, i) => (
            <li
              key={value}
              className="flex items-start gap-4 rounded-xl border border-border p-6 transition-colors hover:bg-surface"
            >
              <span className="brand-gradient-text font-heading text-2xl font-bold leading-none">
                0{i + 1}
              </span>
              <span className="mt-0.5 text-sm font-medium leading-snug">{value}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
