import { z } from 'zod';

import { EmailSchema } from '@crm/common';

import { CONTACT_STATUSES } from '../../domain/contact';

// =============================================================================
// Contact Service — Request DTO schemas (zod).
// =============================================================================

export const CreateContactSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  customerId: z.string().uuid().optional(),
  email: EmailSchema.optional(),
  phone: z.string().max(40).optional(),
  title: z.string().max(120).optional(),
  department: z.string().max(120).optional(),
  isPrimary: z.boolean().optional(),
  status: z.enum(CONTACT_STATUSES).optional(),
  ownerId: z.string().uuid().optional(),
  tags: z.array(z.string().min(1).max(60)).max(50).optional(),
  customFields: z.record(z.unknown()).optional(),
});

export const UpdateContactSchema = CreateContactSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided.' },
);

export const IdParamSchema = z.object({ id: z.string().uuid() });

export const ListContactsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(255).optional(),
  status: z.enum(CONTACT_STATUSES).optional(),
  customerId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional(),
});

export type CreateContactInput = z.infer<typeof CreateContactSchema>;
export type UpdateContactInput = z.infer<typeof UpdateContactSchema>;
export type ListContactsQuery = z.infer<typeof ListContactsQuerySchema>;
