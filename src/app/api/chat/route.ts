import { runChat } from "@/lib/brain/orchestrator";
import type { Channel } from "@/lib/brain/types";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

// =============================================================================
// POST /api/chat — the shared streaming endpoint for the web (full-page) and
// widget channels. Both call the same orchestrator; this route only handles
// transport (SSE-style newline-delimited JSON events over a text stream) and
// widget domain allow-listing.
//
// Body: { channel: "web" | "widget", sessionId, message, locale? }
// =============================================================================

function sse(event: object): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.sessionId || !body?.message || typeof body.message !== "string") {
    return Response.json({ error: "sessionId و message لازم است." }, { status: 400 });
  }

  const channel: Channel = body.channel === "widget" ? "widget" : "web";

  if (channel === "widget") {
    const allowed = await isAllowedOrigin(request.headers.get("origin"));
    if (!allowed) {
      return Response.json({ error: "دامنه مجاز نیست." }, { status: 403 });
    }
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const ev of runChat({
          channel,
          externalUserId: String(body.sessionId),
          userMessage: body.message,
          locale: body.locale ?? "fa",
          userName: body.userName,
        })) {
          controller.enqueue(encoder.encode(sse(ev)));
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            sse({
              type: "error",
              message: err instanceof Error ? err.message : "خطای ناشناخته",
            })
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

async function isAllowedOrigin(origin: string | null): Promise<boolean> {
  if (!origin) return true; // same-origin requests (no Origin header) — allow
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("widget_config")
    .select("allowed_domains, is_enabled")
    .limit(1)
    .maybeSingle();

  if (!data?.is_enabled) return false;
  if (!data.allowed_domains || data.allowed_domains.length === 0) return true; // empty = allow all (dev)

  try {
    const host = new URL(origin).host;
    return data.allowed_domains.some((d: string) => host === d || host.endsWith(`.${d}`));
  } catch {
    return false;
  }
}
