// =============================================================================
// LLM provider abstraction.
//
// The AI Platform never talks to a model vendor directly; it depends on this
// interface. A deterministic `mock` provider keeps the platform fully
// functional offline (and in tests), while the `openai` provider integrates
// with any OpenAI-compatible chat-completions endpoint.
// =============================================================================

export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface CompletionRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface CompletionResult {
  content: string;
  model: string;
  tokensUsed: number;
}

export interface LlmProvider {
  readonly name: string;
  readonly defaultModel: string;
  complete(request: CompletionRequest): Promise<CompletionResult>;
}

/** Rough token estimate used by offline providers and cost accounting. */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  // ~4 characters per token is a common heuristic for English text.
  return Math.max(1, Math.ceil(text.length / 4));
}
