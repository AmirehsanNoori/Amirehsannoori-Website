import "server-only";
import type { RetrievedChunk } from "./types";

// =============================================================================
// Guardrails. Lightweight, deterministic checks that wrap the LLM: keep answers
// grounded in retrieved context, and never promise guarantees. The heavy lifting
// is done by the system prompt (persona); these are safety nets.
// =============================================================================

/** Fallback text when nothing relevant was retrieved. */
export const NO_CONTEXT_FALLBACK =
  "پاسخ دقیق این سؤال در دانش من نیست. اگر مایل باشید می‌توانم درخواست مشاورهٔ شما را ثبت کنم تا امیراحسان مستقیم پاسخ دهد.";

/**
 * Build the grounding block appended to the system prompt. When there is no
 * context we tell the model to say it doesn't know and offer to capture a lead,
 * rather than hallucinate.
 */
export function buildContextBlock(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) {
    return (
      "هیچ منبع مرتبطی برای این پرسش یافت نشد. بر پایهٔ دانش عمومیِ خدمات پاسخ نده؛ " +
      "صادقانه بگو نمی‌دانی و پیشنهاد ثبت درخواست مشاوره بده."
    );
  }
  const sources = chunks
    .map(
      (c, i) =>
        `[منبع ${i + 1} — ${c.title}]\n${c.content}`
    )
    .join("\n\n---\n\n");
  return (
    "فقط بر پایهٔ «منابع» زیر پاسخ بده. اگر منابع کافی نبود، صادقانه بگو نمی‌دانی.\n\n" +
    `منابع:\n${sources}`
  );
}
