import { requireAdmin } from "../_auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/admin/guard";

export const runtime = "nodejs";

// GET /api/admin/leads?status=&source= — list leads (site form + chatbot).
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const source = searchParams.get("source");

  const supabase = createAdminClient();
  let query = supabase
    .from("leads")
    .select("id, name, email, phone, message, locale, source, status, conversation_id, created_at")
    .order("created_at", { ascending: false })
    .limit(300);

  if (status) query = query.eq("status", status);
  if (source) query = query.ilike("source", `%${source}%`);

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ leads: data });
}

// PATCH /api/admin/leads — update a lead's follow-up status.
export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  const body = await request.json().catch(() => null);
  if (!body?.id || !body?.status) {
    return Response.json({ error: "bad body" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("leads")
    .update({ status: body.status })
    .eq("id", body.id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  await logAudit(auth.admin, "lead.status", body.id, { status: body.status });
  return Response.json({ ok: true });
}
