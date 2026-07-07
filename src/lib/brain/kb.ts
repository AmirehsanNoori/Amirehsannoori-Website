import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmbeddingConfig } from "./config";
import { extractSource, type SourceType } from "./ingest";
import { chunkText } from "./chunk";
import { embed } from "./embeddings";

// =============================================================================
// Knowledge-base pipeline: extract → chunk → embed → store. Drives a document
// row through pending → processing → ready (or error). Called by the admin
// document API and by re-index. Embeds in batches to respect provider limits.
// =============================================================================

const EMBED_BATCH = 96; // Cohere embed accepts up to 96 texts per call

export async function processDocument(documentId: string): Promise<void> {
  const supabase = createAdminClient();

  const { data: doc, error: docErr } = await supabase
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .single();
  if (docErr || !doc) throw new Error(`document not found: ${documentId}`);

  await supabase
    .from("documents")
    .update({ status: "processing", error: null })
    .eq("id", documentId);

  try {
    const cfg = await getEmbeddingConfig();

    // 1. Extract text. For pdf/word the extracted text was stashed on the row
    //    at upload time (base64 → handled by the API); here we re-extract from
    //    stored raw text or URL. Uploaded binaries pass text via metadata.
    let text = doc.raw_text as string | undefined;
    if (!text) {
      const extracted = await extractSource({
        sourceType: doc.source_type as SourceType,
        text: doc.raw_text ?? undefined,
        url: doc.source_url ?? undefined,
      });
      text = extracted.text;
    }
    if (!text || text.trim().length === 0) {
      throw new Error("متن قابل‌استخراجی یافت نشد.");
    }

    // 2. Chunk
    const chunks = chunkText(text, cfg.chunkSize, cfg.chunkOverlap);
    if (chunks.length === 0) throw new Error("قطعه‌بندی متن نتیجه‌ای نداشت.");

    // 3. Remove any previous chunks (re-index safe)
    await supabase.from("chunks").delete().eq("document_id", documentId);

    // 4. Embed in batches and insert
    for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
      const batch = chunks.slice(i, i + EMBED_BATCH);
      const vectors = await embed(
        batch.map((c) => c.content),
        cfg,
        "document"
      );
      const rows = batch.map((c, j) => ({
        document_id: documentId,
        content: c.content,
        embedding: vectors[j],
        token_count: c.tokenCount,
        chunk_index: c.index,
      }));
      const { error: insErr } = await supabase.from("chunks").insert(rows);
      if (insErr) throw new Error(`insert chunks: ${insErr.message}`);
    }

    await supabase
      .from("documents")
      .update({
        status: "ready",
        chunk_count: chunks.length,
        char_count: text.length,
      })
      .eq("id", documentId);
  } catch (err) {
    await supabase
      .from("documents")
      .update({
        status: "error",
        error: err instanceof Error ? err.message : "خطای پردازش",
      })
      .eq("id", documentId);
    throw err;
  }
}
