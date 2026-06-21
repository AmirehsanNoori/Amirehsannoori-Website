import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "@/lib/i18n";

export default async function WorkPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = dict.work;

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t.title}</h1>
      <p className="mt-4 max-w-2xl text-muted">{t.intro}</p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {t.projects.map((project) => (
          <article
            key={project.name}
            className="rounded-lg border border-border p-8"
          >
            <div className="brand-gradient mb-6 h-1 w-12 rounded-full" />
            <h2 className="text-xl font-semibold">{project.name}</h2>
            <p className="mt-3 text-sm text-muted">{project.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
