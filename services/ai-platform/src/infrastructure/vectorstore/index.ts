import type { Logger } from '@crm/logging';

import type { AiPlatformConfig } from '../../config';
import { MemoryVectorStore } from './memory-store';
import { QdrantVectorStore } from './qdrant-store';
import type { VectorStore } from './vector-store';

export * from './vector-store';

// =============================================================================
// Vector store factory.
// =============================================================================

export function createVectorStore(config: AiPlatformConfig, logger?: Logger): VectorStore {
  if (config.VECTOR_STORE === 'qdrant') {
    return new QdrantVectorStore({
      url: config.QDRANT_URL,
      apiKey: config.QDRANT_API_KEY,
      logger,
    });
  }
  return new MemoryVectorStore();
}
