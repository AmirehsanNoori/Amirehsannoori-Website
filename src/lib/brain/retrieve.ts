import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmbeddingConfig } from "./config";
import { embedOne, rerank } from "./embeddings";
import type { RetrievedChunk, EmbeddingConfig } from "./types";

// =============================================================================
// Retrieval: embed the user's question as a query, run pgvector similarity
// search via the match_chunks RPC, then optionally rerank the candidates.
// =============================================================================

export async function retrieve(
  query: string,
  opts?: { cfg?: EmbeddingConfig; filterTags?: string[] }
): Promise<RetrievedChunk[]> {
  const cfg = opts?.cfg ?? (await getEmbeddingConfig());
  const supabase = createAdminClient();

  const queryEmbedding = await embedOne(query, cfg, "query");

  // Over-fetch when reranking so the reranker has candidates to reorder.
  const matchCount = cfg.rerankerEnabled ? Math.max(cfg.topK * 3, cfg.topK) : cfg.topK;

  const { data, error } = await supabase.rpc("match_chunks", {
    query_embedding: queryEmbedding,
    match_count: matchCount,
    similarity_threshold: cfg.similarityThreshold,
    filter_tags: opts?.filterTags ?? null,
  });

  if (error) throw new Error(`match_chunks: ${error.message}`);

  let chunks: RetrievedChunk[] = (data ?? []).map(
    (r: {
      id: string;
      document_id: string;
      content: string;
      similarity: number;
      chunk_index: number;
      title: string;
    }) => ({
      id: r.id,
      documentId: r.document_id,
      content: r.content,
      similarity: r.similarity,
      chunkIndex: r.chunk_index,
      title: r.title,
    })
  );

  if (cfg.rerankerEnabled && chunks.length > 0) {
    const ranked = await rerank(
      query,
      chunks.map((c) => c.content),
      cfg,
      cfg.topK
    );
    chunks = ranked.map((r) => chunks[r.index]).filter(Boolean).slice(0, cfg.topK);
  }

  return chunks;
}
