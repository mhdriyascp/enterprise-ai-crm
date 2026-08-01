import { z } from 'zod';

import { EmailSchema } from '@crm/common';

import { LEAD_SOURCES, LEAD_STATUSES } from '../../domain/lead';

// =============================================================================
// Lead Service — Request DTO schemas (zod).
// =============================================================================

export const CreateLeadSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: EmailSchema.optional(),
  phone: z.string().max(40).optional(),
  company: z.string().max(200).optional(),
  title: z.string().max(120).optional(),
  source: z.enum(LEAD_SOURCES).optional(),
  status: z.enum(LEAD_STATUSES).optional(),
  score: z.number().int().min(0).max(100).optional(),
  ownerId: z.string().uuid().optional(),
  tags: z.array(z.string().min(1).max(60)).max(50).optional(),
  notes: z.string().max(5000).optional(),
  customFields: z.record(z.unknown()).optional(),
});

export const UpdateLeadSchema = CreateLeadSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided.' },
);

export const IdParamSchema = z.object({ id: z.string().uuid() });

export const ListLeadsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(255).optional(),
  status: z.enum(LEAD_STATUSES).optional(),
  source: z.enum(LEAD_SOURCES).optional(),
  ownerId: z.string().uuid().optional(),
});

export type CreateLeadInput = z.infer<typeof CreateLeadSchema>;
export type UpdateLeadInput = z.infer<typeof UpdateLeadSchema>;
export type ListLeadsQuery = z.infer<typeof ListLeadsQuerySchema>;
