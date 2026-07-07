import { runChat } from "@/lib/brain/orchestrator";
import { resetConversation } from "@/lib/brain/memory";
import { sendMessage, sendChatAction, type TelegramUpdate } from "@/lib/telegram";

export const runtime = "nodejs";
export const maxDuration = 60;

// =============================================================================
// POST /api/telegram/webhook — Telegram channel. Commands (/start, /help,
// /reset), per-chat rate limiting, and a buffered (non-token-streaming) reply
// via the shared orchestrator — Telegram's Bot API doesn't support partial
// token streaming the way SSE does, so we send one complete message per turn.
//
// Security: Telegram signs webhook calls with the secret configured via
// setWebhook(secret_token=...), delivered back as this header on every call.
// =============================================================================

// In-memory per-instance rate limit (MVP-scale; resets on cold start). One
// message per chat every 1.5s to absorb accidental double-taps/rapid retries.
const lastMessageAt = new Map<number, number>();
const MIN_INTERVAL_MS = 1500;

function rateLimited(chatId: number): boolean {
  const now = Date.now();
  const last = lastMessageAt.get(chatId) ?? 0;
  if (now - last < MIN_INTERVAL_MS) return true;
  lastMessageAt.set(chatId, now);
  return false;
}

export async function POST(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret) {
    const header = request.headers.get("x-telegram-bot-api-secret-token");
    if (header !== secret) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const update = (await request.json().catch(() => null)) as TelegramUpdate | null;
  const msg = update?.message;
  if (!msg?.chat?.id || !msg.text) {
    return Response.json({ ok: true }); // ignore non-text updates (photos, stickers, ...)
  }

  const chatId = msg.chat.id;
  const text = msg.text.trim();
  const userName = msg.from?.first_name ?? msg.from?.username;

  if (rateLimited(chatId)) {
    return Response.json({ ok: true });
  }

  try {
    if (text === "/start") {
      await sendMessage(
        chatId,
        "سلام! من دستیار هوش مصنوعی امیراحسان نوری‌ام. سؤال خودتون رو بپرسید تا کمکتون کنم.\n\nدستورها: /reset برای شروع گفتگوی تازه، /help برای راهنما."
      );
      return Response.json({ ok: true });
    }

    if (text === "/help") {
      await sendMessage(
        chatId,
        "کافیه سؤالتون رو تایپ کنید. اگر بخواید می‌تونم درخواست مشاوره‌تون رو هم ثبت کنم.\n\n/reset — شروع گفتگوی تازه"
      );
      return Response.json({ ok: true });
    }

    if (text === "/reset") {
      await resetConversation("telegram", String(chatId));
      await sendMessage(chatId, "گفتگو از نو شروع شد. سؤال بعدی‌تون رو بپرسید.");
      return Response.json({ ok: true });
    }

    await sendChatAction(chatId, "typing");

    let finalText = "";
    for await (const ev of runChat({
      channel: "telegram",
      externalUserId: String(chatId),
      userMessage: text,
      userName,
      locale: "fa",
    })) {
      if (ev.type === "token") finalText += ev.value;
      if (ev.type === "error") finalText = finalText || `متأسفانه خطایی پیش آمد: ${ev.message}`;
    }

    await sendMessage(chatId, finalText || "متوجه نشدم؛ می‌تونید سؤالتون رو دوباره بپرسید؟");
  } catch (err) {
    await sendMessage(
      chatId,
      "متأسفانه خطایی پیش آمد. لطفاً کمی بعد دوباره امتحان کنید."
    ).catch(() => {});
    console.error("telegram webhook error:", err);
  }

  return Response.json({ ok: true });
}
