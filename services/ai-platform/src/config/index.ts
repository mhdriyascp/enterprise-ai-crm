import { z } from 'zod';

import {
  BaseServiceConfigSchema,
  DatabaseConfigSchema,
  EventBusConfigSchema,
  JwtConfigSchema,
  parseConfig,
} from '@crm/config';

// =============================================================================
// AI Platform — Configuration
// =============================================================================

const AiPlatformConfigSchema = BaseServiceConfigSchema.merge(DatabaseConfigSchema)
  .merge(JwtConfigSchema)
  .merge(EventBusConfigSchema)
  .extend({
    CORS_ORIGINS: z
      .string()
      .default('*')
      .transform((v) => (v === '*' ? true : v.split(',').map((s) => s.trim()))),
    RATE_LIMIT_MAX: z.coerce.number().int().default(1000),
    RATE_LIMIT_WINDOW: z.string().default('1 minute'),

    // LLM provider
    LLM_PROVIDER: z.enum(['mock', 'openai']).default('mock'),
    LLM_DEFAULT_MODEL: z.string().default('gpt-4o-mini'),
    LLM_BASE_URL: z.string().default('https://api.openai.com/v1'),
    LLM_API_KEY: z.string().optional(),
    LLM_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.2),
    LLM_MAX_TOKENS: z.coerce.number().int().positive().default(1024),

    // Embeddings provider
    EMBEDDING_PROVIDER: z.enum(['mock', 'openai']).default('mock'),
    EMBEDDING_MODEL: z.string().default('text-embedding-3-small'),
    EMBEDDING_DIMENSIONS: z.coerce.number().int().positive().default(256),
    EMBEDDING_BASE_URL: z.string().default('https://api.openai.com/v1'),
    EMBEDDING_API_KEY: z.string().optional(),

    // Vector store
    VECTOR_STORE: z.enum(['memory', 'qdrant']).default('memory'),
    QDRANT_URL: z.string().default('http://localhost:6333'),
    QDRANT_API_KEY: z.string().optional(),

    // RAG
    RAG_CHUNK_SIZE: z.coerce.number().int().positive().default(1000),
    RAG_CHUNK_OVERLAP: z.coerce.number().int().min(0).default(150),
    RAG_TOP_K: z.coerce.number().int().positive().default(5),
  });

export type AiPlatformConfig = z.infer<typeof AiPlatformConfigSchema>;

let cachedConfig: AiPlatformConfig | null = null;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AiPlatformConfig {
  if (cachedConfig) return cachedConfig;
  cachedConfig = parseConfig(AiPlatformConfigSchema, env);
  return cachedConfig;
}
