import { z } from 'zod';

import { BaseServiceConfigSchema, JwtConfigSchema, parseConfig } from '@crm/config';

// =============================================================================
// Mobile API (BFF) — Configuration
//
// The mobile API is a backend-for-frontend: it holds no database of its own and
// instead aggregates and slims down responses from the upstream services,
// reached through the Kong API gateway.
// =============================================================================

const MobileApiConfigSchema = BaseServiceConfigSchema.merge(JwtConfigSchema).extend({
  // Base URL of the upstream API gateway (Kong) used for aggregation.
  UPSTREAM_GATEWAY_URL: z.string().url().default('http://localhost:8000'),
  // Timeout (ms) applied to each upstream call.
  UPSTREAM_TIMEOUT_MS: z.coerce.number().int().default(5000),
  // Default page size for mobile list responses (kept small for bandwidth).
  MOBILE_PAGE_SIZE: z.coerce.number().int().min(1).max(100).default(20),
  // Comma-separated list of allowed CORS origins ("*" allows all).
  CORS_ORIGINS: z
    .string()
    .default('*')
    .transform((v) => (v === '*' ? true : v.split(',').map((s) => s.trim()))),
  RATE_LIMIT_MAX: z.coerce.number().int().default(600),
  RATE_LIMIT_WINDOW: z.string().default('1 minute'),
});

export type MobileApiConfig = z.infer<typeof MobileApiConfigSchema>;

let cachedConfig: MobileApiConfig | null = null;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): MobileApiConfig {
  if (cachedConfig) return cachedConfig;
  cachedConfig = parseConfig(MobileApiConfigSchema, env);
  return cachedConfig;
}
