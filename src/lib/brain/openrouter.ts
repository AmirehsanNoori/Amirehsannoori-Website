import "server-only";
import OpenAI from "openai";

// =============================================================================
// OpenRouter client. One key, one base URL, OpenAI-compatible. Every generation
// model (Claude, Gemini, GPT, Qwen, ...) is reached by its namespaced slug, so
// switching models is a single string change in model_config — never a code or
// key change. Streaming is used everywhere.
// =============================================================================

let client: OpenAI | null = null;

export function getOpenRouter(): OpenAI {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not set.");
  }
  client ??= new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      // Optional attribution headers recommended by OpenRouter.
      "HTTP-Referer": "https://amirehsannoori.ir",
      "X-Title": "AEN Assistant",
    },
  });
  return client;
}

export type ChatCompletionMessage =
  OpenAI.Chat.Completions.ChatCompletionMessageParam;
export type ChatCompletionTool = OpenAI.Chat.Completions.ChatCompletionTool;
