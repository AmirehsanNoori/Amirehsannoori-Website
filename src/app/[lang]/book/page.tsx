import { notFound } from "next/navigation";
import { getDictionary, hasLocale, type Locale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { BookingFlow } from "./BookingFlow";

export default async function BookPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const dict = await getDictionary(lang);
  const supabase = await createClient();

  const [{ data: sessionTypes }, { data: authData }] = await Promise.all([
    supabase
      .from("session_types")
      .select(
        "id, slug, name_fa, name_en, duration_minutes, price_irr, price_usd, is_free"
      )
      .eq("is_active", true)
      .order("sort_order"),
    supabase.auth.getUser(),
  ]);

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        {dict.book.title}
      </h1>
      <p className="mt-4 text-muted">{dict.book.subtitle}</p>

      <BookingFlow
        lang={lang as Locale}
        t={dict.book}
        sessionTypes={sessionTypes ?? []}
        userId={authData.user?.id ?? null}
        userEmail={authData.user?.email ?? null}
      />
    </section>
  );
}
