import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Vazirmatn } from "next/font/google";
import "../globals.css";
import { getAdminUser } from "@/lib/admin/guard";
import { ThemeScript } from "@/components/ThemeScript";

// Admin is its own root layout (chrome-free, fa/RTL, dark by default) — separate
// from the marketing site so it never shows the public header/footer.

const vazir = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-vazir",
  display: "swap",
});

export const metadata: Metadata = {
  title: "پنل مدیریت — دستیار AEN",
  robots: { index: false, follow: false },
};

const nav = [
  { href: "/admin", label: "داشبورد" },
  { href: "/admin/conversations", label: "گفتگوها" },
  { href: "/admin/leads", label: "لیدها" },
  { href: "/admin/knowledge", label: "پایگاه دانش" },
  { href: "/admin/feedback", label: "بازخورد" },
  { href: "/admin/settings", label: "مدل و Embedding" },
  { href: "/admin/persona", label: "پرسونا" },
  { href: "/admin/channels", label: "کانال‌ها" },
  { href: "/admin/team", label: "اعضای پنل" },
  { href: "/admin/audit", label: "لاگ فعالیت" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdminUser();
  if (!admin) redirect("/fa/login?next=/admin");

  return (
    <html lang="fa" dir="rtl" className={vazir.variable} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-dvh bg-background font-fa text-foreground" style={{ fontFamily: "var(--font-fa)" }}>
        <div className="flex min-h-dvh">
          {/* Sidebar */}
          <aside className="hidden w-60 shrink-0 border-l border-border bg-surface p-4 md:block">
            <Link href="/admin" className="mb-6 flex items-center gap-2">
              <span className="brand-gradient inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white">
                AEN
              </span>
              <span className="text-sm font-semibold">پنل دستیار</span>
            </Link>
            <nav className="flex flex-col gap-1">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-background hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-6 border-t border-border pt-4 text-xs text-muted">
              <p className="truncate">{admin.email}</p>
              <p className="mt-1 opacity-70">نقش: {admin.role}</p>
              <Link href="/fa" className="mt-3 inline-block text-brand-blue hover:underline">
                ← بازگشت به سایت
              </Link>
            </div>
          </aside>

          {/* Main */}
          <main className="flex-1 overflow-x-hidden p-5 sm:p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
