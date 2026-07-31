import { z } from 'zod';

import { COMPANY_SIZES, ORGANIZATION_STATUSES } from '../../domain/organization';

// =============================================================================
// Organization Service — Request DTO schemas (zod).
// =============================================================================

const SlugSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens.');

export const CreateOrganizationSchema = z.object({
  name: z.string().min(1).max(200),
  slug: SlugSchema,
  description: z.string().max(5000).optional(),
  website: z.string().url().max(255).optional(),
  industry: z.string().max(120).optional(),
  size: z.enum(COMPANY_SIZES).optional(),
  status: z.enum(ORGANIZATION_STATUSES).optional(),
  parentId: z.string().uuid().optional(),
  tags: z.array(z.string().min(1).max(60)).max(50).optional(),
  customFields: z.record(z.unknown()).optional(),
});

export const UpdateOrganizationSchema = CreateOrganizationSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided.' },
);

export const IdParamSchema = z.object({ id: z.string().uuid() });

export const ListOrganizationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(255).optional(),
  status: z.enum(ORGANIZATION_STATUSES).optional(),
  parentId: z.string().uuid().optional(),
});

export type CreateOrganizationInput = z.infer<typeof CreateOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof UpdateOrganizationSchema>;
export type ListOrganizationsQuery = z.infer<typeof ListOrganizationsQuerySchema>;
