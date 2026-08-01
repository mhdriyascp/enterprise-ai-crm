import { z } from 'zod';

import {
  BaseServiceConfigSchema,
  DatabaseConfigSchema,
  JwtConfigSchema,
  parseConfig,
} from '@crm/config';

// =============================================================================
// Organization Service — Configuration
// =============================================================================

const OrganizationConfigSchema = BaseServiceConfigSchema.merge(DatabaseConfigSchema)
  .merge(JwtConfigSchema)
  .extend({
    CORS_ORIGINS: z
      .string()
      .default('*')
      .transform((v) => (v === '*' ? true : v.split(',').map((s) => s.trim()))),
    RATE_LIMIT_MAX: z.coerce.number().int().default(1000),
    RATE_LIMIT_WINDOW: z.string().default('1 minute'),
  });

export type OrganizationConfig = z.infer<typeof OrganizationConfigSchema>;

let cachedConfig: OrganizationConfig | null = null;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): OrganizationConfig {
  if (cachedConfig) return cachedConfig;
  cachedConfig = parseConfig(OrganizationConfigSchema, env);
  return cachedConfig;
}
