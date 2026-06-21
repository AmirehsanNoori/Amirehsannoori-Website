import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "@/lib/i18n";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = dict.contact;
  const base = `/${lang}`;

  return (
    <section className="mx-auto max-w-xl px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t.title}</h1>
      <p className="mt-4 text-muted">{t.intro}</p>

      {/* Static form for now — wired to backend in a later phase */}
      <form className="mt-10 space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="name">
            {t.name}
          </label>
          <input
            id="name"
            name="name"
            type="text"
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
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand-blue"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-11 items-center rounded-md bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          {t.submit}
        </button>
      </form>

      <p className="mt-8 text-sm text-muted">
        {t.or}{" "}
        <Link href={`${base}/services`} className="text-brand-blue underline">
          {dict.nav.book}
        </Link>
      </p>
    </section>
  );
}
