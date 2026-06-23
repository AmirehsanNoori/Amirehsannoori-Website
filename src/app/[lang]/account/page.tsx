import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getDictionary, hasLocale, type Locale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/SignOutButton";

function formatScheduledAt(iso: string | null, lang: Locale): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(lang === "fa" ? "fa-IR-u-ca-persian" : "en-US", {
    timeZone: "Asia/Tehran",
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPrice(amount: number | null, lang: Locale): string {
  if (!amount || amount === 0) return lang === "fa" ? "رایگان" : "Free";
  if (lang === "fa") return `${(amount / 10).toLocaleString("fa-IR")} تومان`;
  return `$${Math.round(amount / 50000)} USD`;
}

type StatusKey =
  | "status_pending"
  | "status_paid"
  | "status_confirmed"
  | "status_cancelled"
  | "status_completed";

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

  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      "id, status, scheduled_at, amount, session_types(name_fa, name_en, duration_minutes)"
    )
    .eq("user_id", user.id)
    .order("scheduled_at", { ascending: false });

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

      <div className="mt-10">
        <h2 className="text-lg font-semibold">{t.bookings}</h2>

        {!bookings || bookings.length === 0 ? (
          <div className="mt-4 rounded-lg border border-border p-8 text-center">
            <p className="text-sm text-muted">{t.noBookings}</p>
            <Link
              href={`/${lang}/book`}
              className="mt-4 inline-flex h-10 items-center rounded-md bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              {t.bookCta}
            </Link>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {bookings.map((b) => {
              const st = b.session_types as unknown as {
                name_fa: string;
                name_en: string;
                duration_minutes: number;
              } | null;
              const statusKey = `status_${b.status}` as StatusKey;
              return (
                <li key={b.id} className="rounded-lg border border-border p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">
                        {st ? (lang === "fa" ? st.name_fa : st.name_en) : "—"}
                        {st && (
                          <span className="ms-2 text-sm text-muted">
                            · {st.duration_minutes}{" "}
                            {lang === "fa" ? "دقیقه" : "min"}
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-sm text-muted" dir="ltr">
                        {formatScheduledAt(b.scheduled_at, lang as Locale)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium">
                        {t[statusKey] ?? b.status}
                      </span>
                      <span className="text-xs text-muted">
                        {formatPrice(b.amount, lang as Locale)}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
