import { requireAdmin } from "../_auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// GET /api/admin/conversations?channel=&status=&q= — inbox list.
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  const { searchParams } = new URL(request.url);
  const channel = searchParams.get("channel");
  const status = searchParams.get("status");
  const q = searchParams.get("q")?.trim();

  const supabase = createAdminClient();
  let query = supabase
    .from("conversations")
    .select(
      "id, channel, external_user_id, status, summary, locale, started_at, updated_at, unified_users(name)"
    )
    .order("updated_at", { ascending: false })
    .limit(100);

  if (channel) query = query.eq("channel", channel);
  if (status) query = query.eq("status", status);
  if (q) query = query.ilike("external_user_id", `%${q}%`);

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ conversations: data });
}
