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
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t.title}</h1>
      <p className="mt-6 text-xl font-medium">{t.lead}</p>
      <p className="mt-6 leading-relaxed text-muted">{t.body}</p>

      <ul className="mt-10 grid gap-3 sm:grid-cols-3">
        {t.values.map((value) => (
          <li
            key={value}
            className="rounded-md border border-border px-4 py-3 text-sm font-medium"
          >
            {value}
          </li>
        ))}
      </ul>
    </section>
  );
}
