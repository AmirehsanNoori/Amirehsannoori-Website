import { requireAdmin } from "../../_auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// GET /api/admin/leads/export — CSV download of all leads (UTF-8 BOM so Excel
// renders Persian correctly). Values are sanitised against CSV-injection
// (a leading =, +, -, @ is neutralised) since this file may be opened in Excel.
function csvCell(value: unknown): string {
  let s = value == null ? "" : String(value);
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  if (/[",\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET() {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("leads")
    .select("created_at, name, email, phone, message, locale, source, status")
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const header = ["تاریخ", "نام", "ایمیل", "تلفن", "پیام", "زبان", "منبع", "وضعیت"];
  const rows = (data ?? []).map((l) => [
    l.created_at,
    l.name,
    l.email,
    l.phone,
    l.message,
    l.locale,
    l.source,
    l.status,
  ]);
  const csv =
    "﻿" +
    [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
