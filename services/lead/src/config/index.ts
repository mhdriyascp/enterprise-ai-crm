import { z } from 'zod';

import {
  BaseServiceConfigSchema,
  DatabaseConfigSchema,
  EventBusConfigSchema,
  JwtConfigSchema,
  parseConfig,
} from '@crm/config';

// =============================================================================
// Lead Service — Configuration
// =============================================================================

const LeadConfigSchema = BaseServiceConfigSchema.merge(DatabaseConfigSchema)
  .merge(JwtConfigSchema)
  .merge(EventBusConfigSchema)
  .extend({
    CORS_ORIGINS: z
      .string()
      .default('*')
      .transform((v) => (v === '*' ? true : v.split(',').map((s) => s.trim()))),
    RATE_LIMIT_MAX: z.coerce.number().int().default(1000),
    RATE_LIMIT_WINDOW: z.string().default('1 minute'),
  });

export type LeadConfig = z.infer<typeof LeadConfigSchema>;

let cachedConfig: LeadConfig | null = null;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): LeadConfig {
  if (cachedConfig) return cachedConfig;
  cachedConfig = parseConfig(LeadConfigSchema, env);
  return cachedConfig;
}
