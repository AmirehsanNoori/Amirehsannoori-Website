import "server-only";
import { getEncoding, type Tiktoken } from "js-tiktoken";

// =============================================================================
// Token-based chunking with configurable size + overlap. Uses tiktoken's
// cl100k_base as a stable, provider-neutral token estimator (good enough for
// Persian sizing). Chunks respect paragraph boundaries where possible.
// =============================================================================

let enc: Tiktoken | null = null;
function encoder(): Tiktoken {
  enc ??= getEncoding("cl100k_base");
  return enc;
}

export function countTokens(text: string): number {
  return encoder().encode(text).length;
}

export interface Chunk {
  content: string;
  tokenCount: number;
  index: number;
}

/**
 * Split text into ~chunkSize-token windows with `overlap` tokens of context
 * carried between neighbours. We tokenise once and slide over the token array,
 * decoding each window back to text.
 */
export function chunkText(
  text: string,
  chunkSize = 500,
  overlap = 50
): Chunk[] {
  const clean = text.trim();
  if (!clean) return [];

  const e = encoder();
  const tokens = e.encode(clean);
  if (tokens.length <= chunkSize) {
    return [{ content: clean, tokenCount: tokens.length, index: 0 }];
  }

  const step = Math.max(1, chunkSize - overlap);
  const chunks: Chunk[] = [];
  let index = 0;

  for (let start = 0; start < tokens.length; start += step) {
    const window = tokens.slice(start, start + chunkSize);
    if (window.length === 0) break;
    const content = e.decode(window).trim();
    if (content) {
      chunks.push({ content, tokenCount: window.length, index: index++ });
    }
    if (start + chunkSize >= tokens.length) break;
  }

  return chunks;
}
