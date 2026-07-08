import { requireAdmin } from "../_auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/admin/guard";

export const runtime = "nodejs";

const VALID_ROLES = ["owner", "admin", "editor", "operator", "viewer"];

// GET /api/admin/team — list admin panel members.
export async function GET() {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("admin_users")
    .select("id, email, role, created_at")
    .order("created_at", { ascending: true });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ members: data, currentEmail: auth.admin.email });
}

// POST /api/admin/team — invite a member by email (owner-only).
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  if (auth.admin.role !== "owner") {
    return Response.json({ error: "فقط مالک می‌تواند عضو اضافه کند." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const role = String(body?.role ?? "viewer");
  if (!email || !email.includes("@") || !VALID_ROLES.includes(role)) {
    return Response.json({ error: "ایمیل یا نقش نامعتبر" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("admin_users").insert({ email, role });
  if (error) return Response.json({ error: error.message }, { status: 500 });

  await logAudit(auth.admin, "team.add", email, { role });
  return Response.json({ ok: true }, { status: 201 });
}

// DELETE /api/admin/team?id= — remove a member (owner-only, cannot remove self).
export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  if (auth.admin.role !== "owner") {
    return Response.json({ error: "فقط مالک می‌تواند عضو حذف کند." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return Response.json({ error: "id لازم است" }, { status: 400 });
  if (id === auth.admin.id) {
    return Response.json({ error: "نمی‌توانید خودتان را حذف کنید." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("admin_users").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  await logAudit(auth.admin, "team.remove", id);
  return Response.json({ ok: true });
}
