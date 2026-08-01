import { describe, expect, it } from 'vitest';

import {
  CreateWorkflowSchema,
  DecideApprovalSchema,
  ListRunsQuerySchema,
  UpdateWorkflowSchema,
} from '../../src/interface/dtos';

// =============================================================================
// Workflow DTO validation tests (pure — no database required).
// =============================================================================

describe('CreateWorkflowSchema', () => {
  it('accepts a minimal valid payload', () => {
    expect(CreateWorkflowSchema.safeParse({ name: 'Onboarding' }).success).toBe(true);
  });

  it('accepts steps of supported types', () => {
    const result = CreateWorkflowSchema.safeParse({
      name: 'Deal review',
      steps: [
        { id: 's1', name: 'Notify', type: 'notification' },
        { id: 's2', name: 'Manager approval', type: 'approval' },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty name', () => {
    expect(CreateWorkflowSchema.safeParse({ name: '' }).success).toBe(false);
  });

  it('rejects an unknown step type', () => {
    const result = CreateWorkflowSchema.safeParse({
      name: 'Bad',
      steps: [{ id: 's1', name: 'x', type: 'teleport' }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid trigger', () => {
    expect(CreateWorkflowSchema.safeParse({ name: 'x', trigger: 'cron' }).success).toBe(false);
  });
});

describe('UpdateWorkflowSchema', () => {
  it('requires at least one field', () => {
    expect(UpdateWorkflowSchema.safeParse({}).success).toBe(false);
  });

  it('accepts a partial update', () => {
    expect(UpdateWorkflowSchema.safeParse({ status: 'active' }).success).toBe(true);
  });
});

describe('DecideApprovalSchema', () => {
  it('accepts approved/rejected decisions', () => {
    expect(DecideApprovalSchema.safeParse({ decision: 'approved' }).success).toBe(true);
    expect(DecideApprovalSchema.safeParse({ decision: 'rejected' }).success).toBe(true);
  });

  it('rejects an unknown decision', () => {
    expect(DecideApprovalSchema.safeParse({ decision: 'maybe' }).success).toBe(false);
  });
});

describe('ListRunsQuerySchema', () => {
  it('applies default pagination', () => {
    const result = ListRunsQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('caps the limit at 100', () => {
    expect(ListRunsQuerySchema.safeParse({ limit: '500' }).success).toBe(false);
  });
});
