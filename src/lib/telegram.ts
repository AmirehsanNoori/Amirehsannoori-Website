import "server-only";

// =============================================================================
// Minimal Telegram Bot API client. No SDK — a handful of REST calls over fetch
// is simpler than a dependency for this surface area.
// =============================================================================

function apiUrl(method: string): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set.");
  return `https://api.telegram.org/bot${token}/${method}`;
}

export async function sendMessage(
  chatId: number | string,
  text: string,
  opts?: { replyMarkup?: unknown }
): Promise<void> {
  // Telegram messages cap at 4096 chars; split long assistant replies.
  const chunks = splitMessage(text, 4000);
  for (const chunk of chunks) {
    const res = await fetch(apiUrl("sendMessage"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: chunk,
        reply_markup: opts?.replyMarkup,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Telegram sendMessage failed: ${res.status} ${body}`);
    }
  }
}

export async function sendChatAction(
  chatId: number | string,
  action: "typing" = "typing"
): Promise<void> {
  await fetch(apiUrl("sendChatAction"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, action }),
  }).catch(() => {});
}

export async function setWebhook(url: string, secretToken: string): Promise<void> {
  const res = await fetch(apiUrl("setWebhook"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, secret_token: secretToken }),
  });
  if (!res.ok) throw new Error(`setWebhook failed: ${res.status}`);
}

function splitMessage(text: string, max: number): string[] {
  if (text.length <= max) return [text || "…"];
  const chunks: string[] = [];
  let rest = text;
  while (rest.length > max) {
    chunks.push(rest.slice(0, max));
    rest = rest.slice(max);
  }
  if (rest) chunks.push(rest);
  return chunks;
}

export interface TelegramUpdate {
  message?: {
    chat: { id: number };
    from?: { id: number; first_name?: string; username?: string };
    text?: string;
  };
}
