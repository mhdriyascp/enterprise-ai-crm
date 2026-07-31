import { z } from 'zod';

import { EmailSchema } from '@crm/common';

import { COMPANY_SIZES, CUSTOMER_STATUSES } from '../../domain/customer';

// =============================================================================
// Customer Service — Request DTO schemas (zod).
// =============================================================================

export const CreateCustomerSchema = z.object({
  name: z.string().min(1).max(200),
  email: EmailSchema.optional(),
  phone: z.string().max(40).optional(),
  website: z.string().url().max(255).optional(),
  industry: z.string().max(120).optional(),
  size: z.enum(COMPANY_SIZES).optional(),
  revenue: z.number().nonnegative().optional(),
  currency: z.string().length(3).optional(),
  status: z.enum(CUSTOMER_STATUSES).optional(),
  ownerId: z.string().uuid().optional(),
  tags: z.array(z.string().min(1).max(60)).max(50).optional(),
  customFields: z.record(z.unknown()).optional(),
});

export const UpdateCustomerSchema = CreateCustomerSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided.' },
);

export const IdParamSchema = z.object({ id: z.string().uuid() });

export const ListCustomersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(255).optional(),
  status: z.enum(CUSTOMER_STATUSES).optional(),
  ownerId: z.string().uuid().optional(),
});

export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof UpdateCustomerSchema>;
export type ListCustomersQuery = z.infer<typeof ListCustomersQuerySchema>;
