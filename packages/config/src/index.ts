import { z } from 'zod';

// =============================================================================
// @crm/config — Shared Configuration Schemas
// =============================================================================

// Base service configuration
export const BaseServiceConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  SERVICE_NAME: z.string(),
  SERVICE_VERSION: z.string().default('0.1.0'),
});

// Database configuration
export const DatabaseConfigSchema = z.object({
  DATABASE_URL: z.string().url(),
  DATABASE_POOL_MIN: z.coerce.number().default(2),
  DATABASE_POOL_MAX: z.coerce.number().default(10),
});

// Redis configuration
export const RedisConfigSchema = z.object({
  REDIS_URL: z.string().url(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().default(0),
});

// Kafka configuration
export const KafkaConfigSchema = z.object({
  KAFKA_BROKERS: z.string().transform((v) => v.split(',')),
  KAFKA_CLIENT_ID: z.string(),
  KAFKA_GROUP_ID: z.string(),
  KAFKA_SASL_USERNAME: z.string().optional(),
  KAFKA_SASL_PASSWORD: z.string().optional(),
});

// Event bus configuration — lightweight, optional Kafka publishing for
// domain services. Distinct from KafkaConfigSchema (which also requires a
// consumer group). Publishing is opt-in via EVENTS_ENABLED.
export const EventBusConfigSchema = z.object({
  EVENTS_ENABLED: z
    .string()
    .default('false')
    .transform((v) => v === 'true' || v === '1'),
  KAFKA_BROKERS: z
    .string()
    .default('localhost:9092')
    .transform((v) => v.split(',').map((s) => s.trim())),
  KAFKA_CLIENT_ID: z.string().default('crm-service'),
});

// JWT configuration
export const JwtConfigSchema = z.object({
  JWT_SECRET: z.string().min(32),
  JWT_PUBLIC_KEY: z.string().optional(),
  JWT_ISSUER: z.string().url(),
  JWT_ACCESS_TOKEN_TTL: z.coerce.number().default(900), // 15 minutes
  JWT_REFRESH_TOKEN_TTL: z.coerce.number().default(604800), // 7 days
});

// OTEL configuration
export const OtelConfigSchema = z.object({
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
  OTEL_TRACES_SAMPLER: z.string().default('always_on'),
});

// Full service configuration type
export type BaseServiceConfig = z.infer<typeof BaseServiceConfigSchema>;
export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;
export type RedisConfig = z.infer<typeof RedisConfigSchema>;
export type KafkaConfig = z.infer<typeof KafkaConfigSchema>;
export type EventBusConfig = z.infer<typeof EventBusConfigSchema>;
export type JwtConfig = z.infer<typeof JwtConfigSchema>;
export type OtelConfig = z.infer<typeof OtelConfigSchema>;

/**
 * Parse and validate configuration from environment variables.
 * Throws a descriptive error if required variables are missing.
 */
export function parseConfig<T extends z.ZodTypeAny>(
  schema: T,
  env: NodeJS.ProcessEnv = process.env,
): z.infer<T> {
  const result = schema.safeParse(env);

  if (!result.success) {
    const errors = result.error.errors
      .map((e) => `  ${e.path.join('.')}: ${e.message}`)
      .join('\n');

    throw new Error(`Configuration validation failed:\n${errors}`);
  }

  return result.data as z.infer<T>;
}
