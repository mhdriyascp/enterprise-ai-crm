import { z } from 'zod';

import {
  BaseServiceConfigSchema,
  DatabaseConfigSchema,
  JwtConfigSchema,
  parseConfig,
} from '@crm/config';

// =============================================================================
// Contact Service — Configuration
// =============================================================================

const ContactConfigSchema = BaseServiceConfigSchema.merge(DatabaseConfigSchema)
  .merge(JwtConfigSchema)
  .extend({
    CORS_ORIGINS: z
      .string()
      .default('*')
      .transform((v) => (v === '*' ? true : v.split(',').map((s) => s.trim()))),
    RATE_LIMIT_MAX: z.coerce.number().int().default(1000),
    RATE_LIMIT_WINDOW: z.string().default('1 minute'),
  });

export type ContactConfig = z.infer<typeof ContactConfigSchema>;

let cachedConfig: ContactConfig | null = null;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ContactConfig {
  if (cachedConfig) return cachedConfig;
  cachedConfig = parseConfig(ContactConfigSchema, env);
  return cachedConfig;
}
