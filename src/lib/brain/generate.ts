import "server-only";
import { getOpenRouter, type ChatCompletionMessage } from "./openrouter";
import { toolDefinitions, executeTool, type ToolContext } from "./tools";
import type { ModelConfig } from "./types";

// =============================================================================
// Generation. Streams tokens from OpenRouter, transparently handling one or
// more rounds of tool calls, and falling back to a secondary model on error.
// =============================================================================

export type GenEvent =
  | { type: "token"; value: string }
  | { type: "tool"; name: string; status: "called" | "done" }
  | { type: "usage"; tokensIn: number; tokensOut: number }
  | { type: "final"; text: string };

const MAX_TOOL_ROUNDS = 3;

interface AccTool {
  id: string;
  name: string;
  args: string;
}

export async function* runGeneration(params: {
  model: ModelConfig;
  messages: ChatCompletionMessage[];
  toolCtx: ToolContext;
}): AsyncGenerator<GenEvent> {
  const openrouter = getOpenRouter();
  const messages = [...params.messages];
  let finalText = "";
  let tokensIn = 0;
  let tokensOut = 0;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    let stream;
    try {
      stream = await openrouter.chat.completions.create({
        model: params.model.activeModel,
        messages,
        tools: toolDefinitions,
        temperature: params.model.temperature,
        max_tokens: params.model.maxTokens,
        top_p: params.model.topP,
        stream: true,
        stream_options: { include_usage: true },
      });
    } catch (err) {
      if (params.model.fallbackModel) {
        stream = await openrouter.chat.completions.create({
          model: params.model.fallbackModel,
          messages,
          tools: toolDefinitions,
          temperature: params.model.temperature,
          max_tokens: params.model.maxTokens,
          stream: true,
          stream_options: { include_usage: true },
        });
      } else {
        throw err;
      }
    }

    let roundContent = "";
    const toolAcc = new Map<number, AccTool>();
    let finishReason: string | null = null;

    for await (const part of stream) {
      const choice = part.choices?.[0];
      if (part.usage) {
        tokensIn = part.usage.prompt_tokens ?? tokensIn;
        tokensOut = part.usage.completion_tokens ?? tokensOut;
      }
      if (!choice) continue;

      const delta = choice.delta;
      if (delta?.content) {
        roundContent += delta.content;
        yield { type: "token", value: delta.content };
      }
      if (delta?.tool_calls) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index ?? 0;
          const acc = toolAcc.get(idx) ?? { id: "", name: "", args: "" };
          if (tc.id) acc.id = tc.id;
          if (tc.function?.name) acc.name = tc.function.name;
          if (tc.function?.arguments) acc.args += tc.function.arguments;
          toolAcc.set(idx, acc);
        }
      }
      if (choice.finish_reason) finishReason = choice.finish_reason;
    }

    finalText += roundContent;

    // No tool calls → we're done.
    if (finishReason !== "tool_calls" || toolAcc.size === 0) {
      break;
    }

    // Record the assistant's tool-call turn, then execute each tool.
    const calls = [...toolAcc.values()];
    messages.push({
      role: "assistant",
      content: roundContent || null,
      tool_calls: calls.map((c) => ({
        id: c.id,
        type: "function",
        function: { name: c.name, arguments: c.args || "{}" },
      })),
    });

    for (const c of calls) {
      yield { type: "tool", name: c.name, status: "called" };
      let args: Record<string, unknown> = {};
      try {
        args = c.args ? JSON.parse(c.args) : {};
      } catch {
        args = {};
      }
      const result = await executeTool(c.name, args, params.toolCtx);
      messages.push({
        role: "tool",
        tool_call_id: c.id,
        content: result,
      });
      yield { type: "tool", name: c.name, status: "done" };
    }
    // loop again so the model can produce its final answer using tool results
  }

  yield { type: "usage", tokensIn, tokensOut };
  yield { type: "final", text: finalText };
}
