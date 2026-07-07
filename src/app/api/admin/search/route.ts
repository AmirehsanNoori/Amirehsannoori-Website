import { requireAdmin } from "../_auth";
import { retrieve } from "@/lib/brain/retrieve";

export const runtime = "nodejs";

// POST /api/admin/search — test retrieval against the knowledge base.
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  const { query } = await request.json().catch(() => ({ query: "" }));
  if (!query || typeof query !== "string") {
    return Response.json({ error: "query لازم است." }, { status: 400 });
  }

  try {
    const chunks = await retrieve(query);
    return Response.json({ chunks });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "خطای جست‌وجو" },
      { status: 500 }
    );
  }
}
