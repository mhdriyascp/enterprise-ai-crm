import { z } from 'zod';

import {
  INTEGRATION_EVENT_TYPES,
  INTEGRATION_PROVIDERS,
  INTEGRATION_STATUSES,
} from '../../domain/integration';

// =============================================================================
// Integration Service — Request DTO schemas (zod).
// =============================================================================

export const CreateIntegrationSchema = z.object({
  provider: z.enum(INTEGRATION_PROVIDERS),
  name: z.string().min(1).max(200),
  config: z.record(z.unknown()).optional(),
  credentialsRef: z.string().max(500).optional(),
  ownerId: z.string().uuid().optional(),
});

export const UpdateIntegrationSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    config: z.record(z.unknown()).optional(),
    credentialsRef: z.string().max(500).optional(),
    ownerId: z.string().uuid().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided.',
  });

export const IdParamSchema = z.object({ id: z.string().uuid() });

export const ListIntegrationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(255).optional(),
  status: z.enum(INTEGRATION_STATUSES).optional(),
  provider: z.enum(INTEGRATION_PROVIDERS).optional(),
});

export const ListEventsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(INTEGRATION_EVENT_TYPES).optional(),
});

export const WebhookSchema = z.object({
  payload: z.record(z.unknown()).default({}),
});

export type CreateIntegrationInput = z.infer<typeof CreateIntegrationSchema>;
export type UpdateIntegrationInput = z.infer<typeof UpdateIntegrationSchema>;
export type ListIntegrationsQuery = z.infer<typeof ListIntegrationsQuerySchema>;
export type ListEventsQuery = z.infer<typeof ListEventsQuerySchema>;
export type WebhookInput = z.infer<typeof WebhookSchema>;
