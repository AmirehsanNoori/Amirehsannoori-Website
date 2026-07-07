import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ChatCompletionTool } from "./openrouter";
import type { Channel } from "./types";

// =============================================================================
// Tools (function calling). Two tools per the brief:
//   capture_lead    — save an interested visitor into the shared `leads` table
//   handoff_to_human — flag the conversation for a human operator
// Definitions are sent to the model; execution happens server-side here.
// =============================================================================

export const toolDefinitions: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "capture_lead",
      description:
        "ثبت اطلاعات تماس کاربرِ علاقه‌مند برای پیگیری/رزرو مشاوره. فقط وقتی صدا بزن که کاربر تمایل داشت و حداقل نام و یک راه تماس (ایمیل یا تلفن) داد.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "نام کاربر" },
          email: { type: "string", description: "ایمیل کاربر (اگر داد)" },
          phone: { type: "string", description: "شمارهٔ تماس کاربر (اگر داد)" },
          message: {
            type: "string",
            description: "خلاصهٔ نیاز/درخواست کاربر به فارسی",
          },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "handoff_to_human",
      description:
        "ارجاع گفتگو به اپراتور انسانی. وقتی صدا بزن که سؤال خارج از حوزهٔ خدمات است، کاربر صراحتاً انسان خواست، یا از پاسخ‌دادن ناتوان بودی.",
      parameters: {
        type: "object",
        properties: {
          reason: {
            type: "string",
            description: "دلیل ارجاع (کوتاه، فارسی)",
          },
        },
        required: ["reason"],
      },
    },
  },
];

export interface ToolContext {
  conversationId: string;
  channel: Channel;
  locale: string;
}

/** Execute a tool call by name. Returns a short result string for the model. */
export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<string> {
  const supabase = createAdminClient();

  if (name === "capture_lead") {
    const { error } = await supabase.from("leads").insert({
      name: (args.name as string) ?? null,
      email: (args.email as string) ?? null,
      phone: (args.phone as string) ?? null,
      message: (args.message as string) ?? null,
      locale: ctx.locale,
      source: `chatbot_${ctx.channel}`,
      conversation_id: ctx.conversationId,
    });
    if (error) return `خطا در ثبت لید: ${error.message}`;
    return "لید با موفقیت ثبت شد. به کاربر اطمینان بده که تیم به‌زودی تماس می‌گیرد.";
  }

  if (name === "handoff_to_human") {
    const { error } = await supabase
      .from("conversations")
      .update({ status: "needs_human" })
      .eq("id", ctx.conversationId);
    if (error) return `خطا در ارجاع: ${error.message}`;
    return "گفتگو برای اپراتور انسانی علامت‌گذاری شد. به کاربر بگو یک همکار پیگیری می‌کند.";
  }

  return `ابزار ناشناخته: ${name}`;
}
