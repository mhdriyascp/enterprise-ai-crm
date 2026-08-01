import { z } from 'zod';

// =============================================================================
// Mobile API — Request DTO schemas (zod).
// =============================================================================

export const SyncQuerySchema = z.object({
  // ISO-8601 timestamp; only records updated at/after this are returned.
  since: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const RegisterDeviceSchema = z.object({
  // Push provider token (FCM registration token or APNs device token).
  token: z.string().min(1).max(4096),
  platform: z.enum(['ios', 'android']),
  appVersion: z.string().max(50).optional(),
});

export type SyncQuery = z.infer<typeof SyncQuerySchema>;
export type RegisterDeviceInput = z.infer<typeof RegisterDeviceSchema>;
