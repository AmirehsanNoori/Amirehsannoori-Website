import { requireAdmin } from "../../../_auth";
import { processDocument } from "@/lib/brain/kb";
import { logAudit } from "@/lib/admin/guard";

export const runtime = "nodejs";
export const maxDuration = 60;

// POST /api/admin/documents/[id]/reindex — re-chunk + re-embed a document.
export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  const { id } = await ctx.params;
  try {
    await processDocument(id);
    await logAudit(auth.admin, "document.reindex", id);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "خطای بازپردازش" },
      { status: 500 }
    );
  }
}
