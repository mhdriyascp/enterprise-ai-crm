import { z } from 'zod';

import {
  BaseServiceConfigSchema,
  DatabaseConfigSchema,
  EventBusConfigSchema,
  JwtConfigSchema,
  parseConfig,
} from '@crm/config';

// =============================================================================
// Integration Service — Configuration
// =============================================================================

const IntegrationConfigSchema = BaseServiceConfigSchema.merge(DatabaseConfigSchema)
  .merge(JwtConfigSchema)
  .merge(EventBusConfigSchema)
  .extend({
    // Comma-separated list of allowed CORS origins ("*" allows all).
    CORS_ORIGINS: z
      .string()
      .default('*')
      .transform((v) => (v === '*' ? true : v.split(',').map((s) => s.trim()))),
    // Default requests-per-minute rate limit applied inside the service.
    RATE_LIMIT_MAX: z.coerce.number().int().default(1000),
    RATE_LIMIT_WINDOW: z.string().default('1 minute'),
  });

export type IntegrationConfig = z.infer<typeof IntegrationConfigSchema>;

let cachedConfig: IntegrationConfig | null = null;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): IntegrationConfig {
  if (cachedConfig) return cachedConfig;
  cachedConfig = parseConfig(IntegrationConfigSchema, env);
  return cachedConfig;
}
