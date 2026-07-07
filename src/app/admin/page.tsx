import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

// Minimal dashboard: knowledge-base + conversation counts. Full analytics
// (token cost, conversion, satisfaction) lands in Phase 3.

async function count(table: string): Promise<number> {
  const supabase = createAdminClient();
  const { count } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true });
  return count ?? 0;
}

export default async function AdminHome() {
  const [docs, chunks, conversations, leads] = await Promise.all([
    count("documents"),
    count("chunks"),
    count("conversations"),
    count("leads"),
  ]);

  const stats = [
    { label: "اسناد دانش", value: docs, href: "/admin/knowledge" },
    { label: "قطعه‌ها (chunks)", value: chunks, href: "/admin/knowledge" },
    { label: "گفتگوها", value: conversations, href: "/admin/conversations" },
    { label: "لیدها", value: leads, href: "/admin/leads" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">داشبورد</h1>
      <p className="mt-1 text-sm text-muted">نمای کلی دستیار هوش مصنوعی</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-xl border border-border bg-surface p-5 transition-colors hover:border-brand-blue"
          >
            <div className="text-3xl font-bold">{s.value.toLocaleString("fa-IR")}</div>
            <div className="mt-1 text-sm text-muted">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold">شروع سریع</h2>
        <ol className="mt-3 list-inside list-decimal space-y-2 text-sm text-muted">
          <li>در «پایگاه دانش» چند سند (PDF/متن/URL) آپلود کنید تا ایندکس شوند.</li>
          <li>در «مدل و Embedding» مدل پاسخ و تنظیمات بازیابی را تنظیم کنید.</li>
          <li>در «پرسونا» لحن و قوانین دستیار را ویرایش کنید.</li>
          <li>
            صفحهٔ چت را در{" "}
            <Link href="/fa/consultant" className="text-brand-blue hover:underline">
              /fa/consultant
            </Link>{" "}
            امتحان کنید.
          </li>
        </ol>
      </div>
    </div>
  );
}
