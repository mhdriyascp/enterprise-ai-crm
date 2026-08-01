import { z } from 'zod';

import {
  APPROVAL_STATUSES,
  WORKFLOW_DEFINITION_STATUSES,
  WORKFLOW_RUN_STATUSES,
  WORKFLOW_STEP_TYPES,
  WORKFLOW_TRIGGERS,
} from '../../domain/workflow';

// =============================================================================
// Workflow Service — Request DTO schemas (zod).
// =============================================================================

export const WorkflowStepSchema = z.object({
  id: z.string().min(1).max(120),
  name: z.string().min(1).max(200),
  type: z.enum(WORKFLOW_STEP_TYPES),
  config: z.record(z.unknown()).optional(),
});

export const CreateWorkflowSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  trigger: z.enum(WORKFLOW_TRIGGERS).optional(),
  triggerConfig: z.record(z.unknown()).optional(),
  steps: z.array(WorkflowStepSchema).max(100).optional(),
  status: z.enum(WORKFLOW_DEFINITION_STATUSES).optional(),
  ownerId: z.string().uuid().optional(),
});

export const UpdateWorkflowSchema = CreateWorkflowSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided.' },
);

export const IdParamSchema = z.object({ id: z.string().uuid() });

export const RunParamSchema = z.object({ runId: z.string().uuid() });

export const ApprovalIdParamSchema = z.object({ approvalId: z.string().uuid() });

export const ListWorkflowsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(255).optional(),
  status: z.enum(WORKFLOW_DEFINITION_STATUSES).optional(),
  trigger: z.enum(WORKFLOW_TRIGGERS).optional(),
});

export const ListRunsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(WORKFLOW_RUN_STATUSES).optional(),
  workflowId: z.string().uuid().optional(),
});

export const ListApprovalsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(APPROVAL_STATUSES).optional(),
});

export const TriggerRunSchema = z
  .object({
    input: z.record(z.unknown()).optional(),
  })
  .optional()
  .default({});

export const DecideApprovalSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  comment: z.string().max(2000).optional(),
});

export type CreateWorkflowInput = z.infer<typeof CreateWorkflowSchema>;
export type UpdateWorkflowInput = z.infer<typeof UpdateWorkflowSchema>;
export type ListWorkflowsQuery = z.infer<typeof ListWorkflowsQuerySchema>;
export type ListRunsQuery = z.infer<typeof ListRunsQuerySchema>;
export type ListApprovalsQuery = z.infer<typeof ListApprovalsQuerySchema>;
export type TriggerRunInput = z.infer<typeof TriggerRunSchema>;
export type DecideApprovalInput = z.infer<typeof DecideApprovalSchema>;
