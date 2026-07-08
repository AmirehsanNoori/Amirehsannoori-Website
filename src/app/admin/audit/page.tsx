import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const actionLabel: Record<string, string> = {
  "document.create": "افزودن سند",
  "document.reindex": "بازایندکس سند",
  "document.delete": "حذف سند",
  "conversation.status": "تغییر وضعیت گفتگو",
  "lead.status": "تغییر وضعیت لید",
  "prompt.update": "ویرایش پرسونا",
  "config.update": "ویرایش تنظیمات",
  "team.add": "افزودن عضو پنل",
  "team.remove": "حذف عضو پنل",
};

export default async function AuditPage() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("audit_log")
    .select("id, admin_email, action, target, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div>
      <h1 className="text-2xl font-bold">لاگ فعالیت</h1>
      <p className="mt-1 text-sm text-muted">آخرین ۲۰۰ اقدام اعضای پنل مدیریت.</p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-right text-sm">
          <thead className="text-xs text-muted">
            <tr className="border-b border-border">
              <th className="p-3 font-medium">اقدام</th>
              <th className="p-3 font-medium">توسط</th>
              <th className="p-3 font-medium">هدف</th>
              <th className="p-3 font-medium">زمان</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((row) => (
              <tr key={row.id} className="border-b border-border/50 last:border-0">
                <td className="p-3">{actionLabel[row.action] ?? row.action}</td>
                <td className="p-3 text-muted" dir="ltr">
                  {row.admin_email}
                </td>
                <td className="p-3 text-xs text-muted">{row.target?.slice(0, 8) ?? "—"}</td>
                <td className="p-3 text-xs text-muted" dir="ltr">
                  {new Date(row.created_at).toLocaleString("fa-IR")}
                </td>
              </tr>
            ))}
            {(data ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-sm text-muted">
                  فعالیتی ثبت نشده.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
