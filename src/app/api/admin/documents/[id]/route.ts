import { requireAdmin } from "../../_auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/admin/guard";

export const runtime = "nodejs";

// DELETE /api/admin/documents/[id] — remove a document (chunks cascade).
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  const { id } = await ctx.params;
  const supabase = createAdminClient();
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  await logAudit(auth.admin, "document.delete", id);
  return Response.json({ ok: true });
}
