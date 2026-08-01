import type { EmbeddingRequest, EmbeddingResponse } from '@crm/types';

import type { EmbeddingProvider } from '../../infrastructure/embeddings';
import type { ChatMessage, CompletionResult, LlmProvider } from '../../infrastructure/llm';
import { ModelRouter } from './model-router';

// =============================================================================
// AI Gateway — the single entry point for raw model interactions (embeddings,
// completions, chat). Agents and the RAG pipeline are built on top of it.
// =============================================================================

export class AiGateway {
  constructor(
    private readonly llm: LlmProvider,
    private readonly embedder: EmbeddingProvider,
    private readonly router: ModelRouter,
  ) {}

  /** Generate embeddings for one or more texts. */
  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const texts = Array.isArray(request.text) ? request.text : [request.text];
    const result = await this.embedder.embed(texts);
    return {
      embeddings: result.vectors,
      model: request.model ?? result.model,
      tokensUsed: result.tokensUsed,
    };
  }

  /** Single-turn or multi-turn chat completion. */
  async complete(
    messages: ChatMessage[],
    options: { model?: string; temperature?: number; maxTokens?: number } = {},
  ): Promise<CompletionResult> {
    const route = this.router.routeDefault();
    return this.llm.complete({
      messages,
      model: options.model ?? route.model,
      temperature: options.temperature ?? route.temperature,
      maxTokens: options.maxTokens,
    });
  }

  get embeddingDimensions(): number {
    return this.embedder.dimensions;
  }

  get modelRouter(): ModelRouter {
    return this.router;
  }

  get llmProvider(): LlmProvider {
    return this.llm;
  }

  get embeddingProvider(): EmbeddingProvider {
    return this.embedder;
  }
}
