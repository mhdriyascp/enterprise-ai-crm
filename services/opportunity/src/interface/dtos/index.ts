import { z } from 'zod';

import { OPPORTUNITY_STAGES } from '../../domain/opportunity';

// =============================================================================
// Opportunity Service — Request DTO schemas (zod).
// =============================================================================

export const CreateOpportunitySchema = z.object({
  name: z.string().min(1).max(200),
  customerId: z.string().uuid(),
  contactId: z.string().uuid().optional(),
  stage: z.enum(OPPORTUNITY_STAGES).optional(),
  amount: z.number().min(0).optional(),
  currency: z.string().length(3).optional(),
  probability: z.number().int().min(0).max(100).optional(),
  expectedCloseDate: z.string().datetime().optional(),
  actualCloseDate: z.string().datetime().optional(),
  ownerId: z.string().uuid().optional(),
  tags: z.array(z.string().min(1).max(60)).max(50).optional(),
  notes: z.string().max(5000).optional(),
  customFields: z.record(z.unknown()).optional(),
});

export const UpdateOpportunitySchema = CreateOpportunitySchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided.' },
);

export const IdParamSchema = z.object({ id: z.string().uuid() });

export const ListOpportunitiesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(255).optional(),
  stage: z.enum(OPPORTUNITY_STAGES).optional(),
  customerId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional(),
});

export type CreateOpportunityInput = z.infer<typeof CreateOpportunitySchema>;
export type UpdateOpportunityInput = z.infer<typeof UpdateOpportunitySchema>;
export type ListOpportunitiesQuery = z.infer<typeof ListOpportunitiesQuerySchema>;
