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
      {/* Header */}
      <div className="max-w-2xl">
        <p className="brand-gradient-text font-heading text-xs font-semibold uppercase tracking-widest">
          {lang === "fa" ? "پروژه‌ها" : "Projects"}
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{t.title}</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted">{t.intro}</p>
      </div>

      {/* Project cards */}
      <div className="mt-14 grid gap-6 sm:grid-cols-2">
        {t.projects.map((project, i) => (
          <article
            key={project.name}
            className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-background transition-colors hover:bg-surface"
          >
            {/* Top accent bar */}
            <div className="brand-gradient h-px w-full" />

            <div className="flex flex-1 flex-col p-8">
              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-border px-2.5 py-0.5 text-xs font-medium text-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Title */}
              <h2 className="mt-5 text-2xl font-bold tracking-tight">{project.name}</h2>

              {/* Outcome callout */}
              <p className="mt-3 text-sm font-semibold text-brand-blue">
                → {project.outcome}
              </p>

              {/* Body */}
              <p className="mt-4 flex-1 text-sm leading-relaxed text-muted">{project.body}</p>

              {/* Index number */}
              <p className="mt-8 font-heading text-5xl font-bold leading-none text-border">
                0{i + 1}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
