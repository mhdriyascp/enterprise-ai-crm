import { z } from 'zod';

import {
  BaseServiceConfigSchema,
  DatabaseConfigSchema,
  JwtConfigSchema,
  parseConfig,
} from '@crm/config';

// =============================================================================
// Identity Service — Configuration
// =============================================================================

const IdentityConfigSchema = BaseServiceConfigSchema.merge(DatabaseConfigSchema)
  .merge(JwtConfigSchema)
  .extend({
    // Number of bcrypt salt rounds used for password hashing.
    BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
    // Comma-separated list of allowed CORS origins ("*" allows all).
    CORS_ORIGINS: z
      .string()
      .default('*')
      .transform((v) => (v === '*' ? true : v.split(',').map((s) => s.trim()))),
    // Max authentication attempts per window before rate limiting kicks in.
    AUTH_RATE_LIMIT_MAX: z.coerce.number().int().default(10),
    AUTH_RATE_LIMIT_WINDOW: z.string().default('1 minute'),
  });

export type IdentityConfig = z.infer<typeof IdentityConfigSchema>;

let cachedConfig: IdentityConfig | null = null;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): IdentityConfig {
  if (cachedConfig) return cachedConfig;
  cachedConfig = parseConfig(IdentityConfigSchema, env);
  return cachedConfig;
}
