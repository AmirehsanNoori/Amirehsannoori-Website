import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "@/lib/i18n";
import { ContactForm } from "@/components/ContactForm";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = dict.contact;

  return (
    <section className="mx-auto max-w-xl px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t.title}</h1>
      <p className="mt-4 text-muted">{t.intro}</p>
      <ContactForm lang={lang} t={t} />
    </section>
  );
}
