import { setWebhook } from "@/lib/telegram";

export const runtime = "nodejs";

// =============================================================================
// One-off / re-runnable Telegram webhook registration. Telegram's API is
// unreachable from some networks (ISP-level blocking), so this runs from
// Vercel's servers instead of requiring a direct call to api.telegram.org from
// wherever the operator happens to be. Protected by TELEGRAM_WEBHOOK_SECRET
// itself (not the admin session) since it's meant to be triggerable without a
// browser login — knowing the secret is exactly the bar that matters here.
// =============================================================================

export async function POST(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json({ error: "TELEGRAM_WEBHOOK_SECRET is not set." }, { status: 500 });
  }
  const header = request.headers.get("x-setup-secret");
  if (header !== secret) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const webhookUrl = `${url.protocol}//${url.host}/api/telegram/webhook`;

  try {
    await setWebhook(webhookUrl, secret);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "setWebhook failed" },
      { status: 500 }
    );
  }

  const infoRes = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getWebhookInfo`
  );
  const info = await infoRes.json();

  return Response.json({ ok: true, webhookUrl, info });
}
