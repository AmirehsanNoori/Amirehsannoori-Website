import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/SignOutButton";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = dict.auth;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/${lang}/login`);

  return (
    <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="text-3xl font-bold tracking-tight">{t.account}</h1>

      <div className="mt-8 rounded-lg border border-border p-6">
        <p className="text-sm text-muted">{t.signedInAs}</p>
        <p dir="ltr" className="mt-1 font-medium text-foreground ltr:text-left rtl:text-right">
          {user.email}
        </p>
        <div className="mt-6">
          <SignOutButton lang={lang} label={t.signOut} />
        </div>
      </div>

      {/* Bookings & receipts will appear here in a later phase. */}
    </section>
  );
}
