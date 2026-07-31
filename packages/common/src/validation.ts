import { z } from 'zod';

// =============================================================================
// Common Validation Schemas
// =============================================================================

export const UUIDSchema = z.string().uuid();

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().max(255).optional(),
});

export const DateRangeSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
});

export const EmailSchema = z.string().email().max(255).toLowerCase();

export const PhoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{6,14}$/, 'Invalid phone number format')
  .optional();

export const URLSchema = z.string().url().max(2048).optional();

/**
 * Validate and parse data with a Zod schema.
 * Returns parsed data or throws a ValidationError.
 */
export function validate<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
): z.infer<T> {
  const result = schema.safeParse(data);

  if (!result.success) {
    const details = result.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    throw new Error(
      `Validation failed: ${details.map((d) => `${d.field}: ${d.message}`).join(', ')}`,
    );
  }

  return result.data as z.infer<T>;
}
