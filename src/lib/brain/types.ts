// =============================================================================
// Core brain — shared types. Channel-agnostic: the widget, full-page /consultant
// and Telegram all speak these types to the orchestrator.
// =============================================================================

export type Channel = "web" | "widget" | "telegram";

export type Role = "user" | "assistant" | "system" | "tool";

export interface ChatMessage {
  role: Role;
  content: string;
}

/** A knowledge-base chunk returned from similarity search. */
export interface RetrievedChunk {
  id: string;
  documentId: string;
  content: string;
  similarity: number;
  chunkIndex: number;
  title: string;
}

/** A source shown to the user under an answer. */
export interface Citation {
  documentId: string;
  title: string;
  similarity: number;
}

/** Input to the single orchestrator entry point. */
export interface BrainRequest {
  channel: Channel;
  /** Raw channel identity (telegram chat_id, or a web session id). */
  externalUserId: string;
  userMessage: string;
  locale?: string;
  /** Optional display name (telegram/profile). */
  userName?: string;
}

/** A streamed event emitted by the orchestrator. */
export type BrainEvent =
  | { type: "token"; value: string }
  | { type: "citations"; value: Citation[] }
  | { type: "tool"; name: string; status: "called" | "done"; value?: unknown }
  | { type: "done"; conversationId: string; messageId: string }
  | { type: "error"; message: string };

/** Effective config resolved from the DB for a single turn. */
export interface EmbeddingConfig {
  provider: string;
  model: string;
  dimensions: number;
  chunkSize: number;
  chunkOverlap: number;
  chunkStrategy: string;
  topK: number;
  similarityThreshold: number;
  rerankerEnabled: boolean;
  rerankerModel: string | null;
}

export interface ModelConfig {
  channel: string;
  provider: string;
  activeModel: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  fallbackProvider: string | null;
  fallbackModel: string | null;
}
