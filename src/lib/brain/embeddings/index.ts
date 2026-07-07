import "server-only";
import type { EmbeddingConfig } from "../types";
import { embedCohere, rerankCohere } from "./cohere";

// =============================================================================
// Embedding provider abstraction. Default is Cohere; OpenAI / Google / Voyage
// are wired as stubs so the admin panel can list them, but only providers with
// a matching 1024-dim column are usable without a re-index migration.
// input_type: "document" when storing chunks, "query" when searching.
// =============================================================================

export type InputType = "document" | "query";

export async function embed(
  texts: string[],
  cfg: EmbeddingConfig,
  inputType: InputType
): Promise<number[][]> {
  switch (cfg.provider) {
    case "cohere":
      return embedCohere(
        texts,
        cfg.model,
        inputType === "document" ? "search_document" : "search_query"
      );
    case "openai":
    case "google":
    case "voyage":
      throw new Error(
        `Embedding provider "${cfg.provider}" is not yet implemented. ` +
          `Use Cohere, or add the adapter in src/lib/brain/embeddings/.`
      );
    default:
      throw new Error(`Unknown embedding provider: ${cfg.provider}`);
  }
}

export async function embedOne(
  text: string,
  cfg: EmbeddingConfig,
  inputType: InputType
): Promise<number[]> {
  const [vec] = await embed([text], cfg, inputType);
  return vec;
}

/** Optional reranking of retrieved candidates (Cohere rerank only for now). */
export async function rerank(
  query: string,
  documents: string[],
  cfg: EmbeddingConfig,
  topN: number
): Promise<Array<{ index: number; relevanceScore: number }>> {
  if (cfg.provider === "cohere" && cfg.rerankerModel) {
    return rerankCohere(query, documents, cfg.rerankerModel, topN);
  }
  // No reranker available → identity order.
  return documents.map((_, index) => ({ index, relevanceScore: 0 }));
}
