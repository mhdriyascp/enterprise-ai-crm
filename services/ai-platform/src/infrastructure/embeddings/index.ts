import type { Logger } from '@crm/logging';

import type { AiPlatformConfig } from '../../config';
import { MockEmbeddingProvider } from './mock-embedder';
import { OpenAiEmbeddingProvider } from './openai-embedder';
import type { EmbeddingProvider } from './provider';

export * from './provider';

// =============================================================================
// Embedding provider factory.
// =============================================================================

export function createEmbeddingProvider(
  config: AiPlatformConfig,
  logger?: Logger,
): EmbeddingProvider {
  if (config.EMBEDDING_PROVIDER === 'openai') {
    if (!config.EMBEDDING_API_KEY) {
      logger?.warn(
        'EMBEDDING_PROVIDER=openai but EMBEDDING_API_KEY is missing; using mock embedder',
      );
      return new MockEmbeddingProvider(config.EMBEDDING_MODEL, config.EMBEDDING_DIMENSIONS);
    }
    return new OpenAiEmbeddingProvider({
      baseUrl: config.EMBEDDING_BASE_URL,
      apiKey: config.EMBEDDING_API_KEY,
      model: config.EMBEDDING_MODEL,
      dimensions: config.EMBEDDING_DIMENSIONS,
    });
  }
  return new MockEmbeddingProvider(config.EMBEDDING_MODEL, config.EMBEDDING_DIMENSIONS);
}
