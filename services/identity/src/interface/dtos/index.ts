import { z } from 'zod';

import { EmailSchema } from '@crm/common';

// =============================================================================
// Request/response DTO schemas (zod) for the Identity service.
// =============================================================================

const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(128);

const SlugSchema = z
  .string()
  .min(2)
  .max(63)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with dashes.');

export const RegisterSchema = z.object({
  tenantName: z.string().min(2).max(120),
  tenantSlug: SlugSchema,
  email: EmailSchema,
  password: PasswordSchema,
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
});

export const LoginSchema = z.object({
  tenantSlug: SlugSchema,
  email: EmailSchema,
  password: z.string().min(1).max(128),
});

export const RefreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const CreateTenantSchema = z.object({
  name: z.string().min(2).max(120),
  slug: SlugSchema,
  plan: z.enum(['free', 'starter', 'professional', 'enterprise']).optional(),
});

export const UpdateTenantSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  plan: z.enum(['free', 'starter', 'professional', 'enterprise']).optional(),
  status: z.enum(['active', 'suspended', 'cancelled']).optional(),
});

export const CreateUserSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  organizationId: z.string().uuid().optional(),
  roleIds: z.array(z.string().uuid()).optional(),
});

export const UpdateUserSchema = z.object({
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().min(1).max(80).optional(),
  status: z.enum(['active', 'inactive', 'pending', 'suspended']).optional(),
  organizationId: z.string().uuid().nullable().optional(),
});

export const SetUserRolesSchema = z.object({
  roleIds: z.array(z.string().uuid()),
});

export const CreateRoleSchema = z.object({
  name: z.string().min(2).max(60),
  description: z.string().max(255).optional(),
  permissionIds: z.array(z.string().uuid()).optional(),
});

export const UpdateRoleSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  description: z.string().max(255).optional(),
});

export const SetRolePermissionsSchema = z.object({
  permissionIds: z.array(z.string().uuid()),
});

export const CreateApiKeySchema = z.object({
  name: z.string().min(2).max(120),
  scopes: z.array(z.string().min(1)).optional(),
  expiresAt: z.string().datetime().optional(),
});

export const IdParamSchema = z.object({ id: z.string().uuid() });

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(255).optional(),
});

export const AuditQuerySchema = PaginationQuerySchema.extend({
  resource: z.string().max(60).optional(),
  action: z.string().max(60).optional(),
});
