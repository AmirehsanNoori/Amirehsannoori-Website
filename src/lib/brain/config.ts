import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { EmbeddingConfig, ModelConfig, Channel } from "./types";

// =============================================================================
// Config loading. Everything the brain does is driven by DB rows so it can be
// changed from the admin panel without a redeploy: the active embedding/retrieval
// settings, the per-channel generation model, and the active system prompt.
// =============================================================================

export async function getEmbeddingConfig(): Promise<EmbeddingConfig> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("embedding_config")
    .select("*")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`embedding_config: ${error.message}`);
  if (!data) throw new Error("No active embedding_config row found.");

  return {
    provider: data.provider,
    model: data.model,
    dimensions: data.dimensions,
    chunkSize: data.chunk_size,
    chunkOverlap: data.chunk_overlap,
    chunkStrategy: data.chunk_strategy,
    topK: data.top_k,
    similarityThreshold: Number(data.similarity_threshold),
    rerankerEnabled: data.reranker_enabled,
    rerankerModel: data.reranker_model,
  };
}

export async function getModelConfig(channel: Channel): Promise<ModelConfig> {
  const supabase = createAdminClient();
  // Prefer the channel-specific row; fall back to the 'default' row.
  const { data, error } = await supabase
    .from("model_config")
    .select("*")
    .in("channel", [channel, "default"]);

  if (error) throw new Error(`model_config: ${error.message}`);
  const row =
    data?.find((r) => r.channel === channel) ??
    data?.find((r) => r.channel === "default");
  if (!row) throw new Error("No model_config row found.");

  return {
    channel: row.channel,
    provider: row.provider,
    activeModel: applySchedule(row),
    temperature: Number(row.temperature),
    maxTokens: row.max_tokens,
    topP: Number(row.top_p),
    fallbackProvider: row.fallback_provider,
    fallbackModel: row.fallback_model,
  };
}

/**
 * Optional day/time model scheduling. schedule is a JSON array of
 * { days: number[] (0=Sun), from: "HH:MM", to: "HH:MM", model: string }.
 * First match wins; otherwise the row's active_model is used.
 */
function applySchedule(row: {
  active_model: string;
  schedule: unknown;
}): string {
  if (!Array.isArray(row.schedule)) return row.active_model;
  const now = new Date();
  const day = now.getDay();
  const hm = now.toTimeString().slice(0, 5); // "HH:MM"
  for (const s of row.schedule as Array<{
    days?: number[];
    from?: string;
    to?: string;
    model?: string;
  }>) {
    if (!s.model) continue;
    if (s.days && !s.days.includes(day)) continue;
    if (s.from && hm < s.from) continue;
    if (s.to && hm > s.to) continue;
    return s.model;
  }
  return row.active_model;
}

export async function getActiveSystemPrompt(): Promise<string> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("prompt_versions")
    .select("content")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`prompt_versions: ${error.message}`);
  return data?.content ?? "You are a helpful assistant.";
}
