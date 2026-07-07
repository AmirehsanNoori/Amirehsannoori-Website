import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// POST /api/feedback — 👍/👎 on an assistant message. Public (no auth): the
// chat widget/page call this anonymously; messageId scopes it narrowly.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.messageId || (body.rating !== 1 && body.rating !== -1)) {
    return Response.json({ error: "bad body" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("feedback").insert({
    message_id: body.messageId,
    rating: body.rating,
    comment: body.comment ?? null,
  });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true }, { status: 201 });
}
