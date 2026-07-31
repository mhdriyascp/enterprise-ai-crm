// =============================================================================
// Workflow Service — Domain enums, constants and step contracts.
// These mirror the Prisma enums, providing a single source of truth for
// validation and the execution engine.
// =============================================================================

export const WORKFLOW_TRIGGERS = ['manual', 'event', 'schedule'] as const;
export type WorkflowTrigger = (typeof WORKFLOW_TRIGGERS)[number];

export const WORKFLOW_DEFINITION_STATUSES = ['draft', 'active', 'inactive'] as const;
export type WorkflowDefinitionStatus = (typeof WORKFLOW_DEFINITION_STATUSES)[number];

export const WORKFLOW_RUN_STATUSES = [
  'pending',
  'running',
  'waiting_approval',
  'completed',
  'failed',
  'cancelled',
] as const;
export type WorkflowRunStatus = (typeof WORKFLOW_RUN_STATUSES)[number];

export const APPROVAL_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

// Supported step types executed by the workflow engine.
// - action / notification: executed inline (recorded as completed).
// - approval: pauses the run until a human resolves the raised Approval.
export const WORKFLOW_STEP_TYPES = ['action', 'notification', 'approval'] as const;
export type WorkflowStepType = (typeof WORKFLOW_STEP_TYPES)[number];

/** A single, ordered step within a workflow definition. */
export interface WorkflowStep {
  id: string;
  name: string;
  type: WorkflowStepType;
  config?: Record<string, unknown>;
}

/** The outcome of executing a step, recorded on the run. */
export interface StepResult {
  stepId: string;
  name: string;
  type: WorkflowStepType;
  status: 'completed' | 'waiting' | 'skipped';
  output?: Record<string, unknown>;
  at: string;
}
