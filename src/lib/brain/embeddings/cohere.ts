import "server-only";
import { CohereClient } from "cohere-ai";

// =============================================================================
// Cohere embeddings (default). embed-multilingual-v3.0 → 1024 dims, strong on
// Persian. input_type distinguishes stored documents from search queries, which
// materially improves retrieval quality on v3 models.
// =============================================================================

let client: CohereClient | null = null;
function getClient(): CohereClient {
  if (!process.env.COHERE_API_KEY) {
    throw new Error("COHERE_API_KEY is not set.");
  }
  client ??= new CohereClient({ token: process.env.COHERE_API_KEY });
  return client;
}

export async function embedCohere(
  texts: string[],
  model: string,
  inputType: "search_document" | "search_query"
): Promise<number[][]> {
  if (texts.length === 0) return [];
  const res = await getClient().embed({
    texts,
    model,
    inputType,
    embeddingTypes: ["float"],
  });
  // The SDK returns either number[][] or { float: number[][] } depending on request.
  const embeddings = res.embeddings;
  if (Array.isArray(embeddings)) return embeddings as number[][];
  const floats = (embeddings as { float?: number[][] }).float;
  if (!floats) throw new Error("Cohere embed: no float embeddings returned.");
  return floats;
}

export async function rerankCohere(
  query: string,
  documents: string[],
  model: string,
  topN: number
): Promise<Array<{ index: number; relevanceScore: number }>> {
  if (documents.length === 0) return [];
  const res = await getClient().rerank({
    query,
    documents,
    model,
    topN,
  });
  return res.results.map((r) => ({
    index: r.index,
    relevanceScore: r.relevanceScore,
  }));
}
