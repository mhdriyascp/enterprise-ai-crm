import { z } from 'zod';

import {
  BaseServiceConfigSchema,
  DatabaseConfigSchema,
  JwtConfigSchema,
  parseConfig,
} from '@crm/config';

// =============================================================================
// Opportunity Service — Configuration
// =============================================================================

const OpportunityConfigSchema = BaseServiceConfigSchema.merge(DatabaseConfigSchema)
  .merge(JwtConfigSchema)
  .extend({
    CORS_ORIGINS: z
      .string()
      .default('*')
      .transform((v) => (v === '*' ? true : v.split(',').map((s) => s.trim()))),
    RATE_LIMIT_MAX: z.coerce.number().int().default(1000),
    RATE_LIMIT_WINDOW: z.string().default('1 minute'),
  });

export type OpportunityConfig = z.infer<typeof OpportunityConfigSchema>;

let cachedConfig: OpportunityConfig | null = null;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): OpportunityConfig {
  if (cachedConfig) return cachedConfig;
  cachedConfig = parseConfig(OpportunityConfigSchema, env);
  return cachedConfig;
}
