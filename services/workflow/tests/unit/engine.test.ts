import { describe, expect, it } from 'vitest';

import { EventTopics, type EventPublisher, type PublishOptions } from '@crm/events';

import { WorkflowService } from '../../src/application/services/workflow.service';

// =============================================================================
// Workflow engine tests — exercised against an in-memory fake Prisma so the
// execution engine, events and approval gates can be verified offline.
// =============================================================================

class RecordingPublisher implements EventPublisher {
  public readonly published: Array<{ topic: string; data: unknown; options: PublishOptions }> = [];

  async publish<T>(topic: string, data: T, options: PublishOptions): Promise<void> {
    this.published.push({ topic, data, options });
  }

  topics(): string[] {
    return this.published.map((e) => e.topic);
  }
}

function createFakePrisma(steps: unknown[]) {
  let defCounter = 0;
  let runCounter = 0;
  let approvalCounter = 0;
  const defs = new Map<string, Record<string, unknown>>();
  const runs = new Map<string, Record<string, unknown>>();
  const approvals = new Map<string, Record<string, unknown>>();

  const workflowDefinition = {
    create: async ({ data }: { data: Record<string, unknown> }) => {
      const id = `def-${++defCounter}`;
      const row = { id, trigger: 'manual', status: 'draft', ...data, steps };
      defs.set(id, row);
      return row;
    },
    findFirst: async ({ where }: { where: { id: string } }) => defs.get(where.id) ?? null,
    findUnique: async ({ where }: { where: { id: string } }) => defs.get(where.id) ?? null,
  };

  const workflowRun = {
    create: async ({ data }: { data: Record<string, unknown> }) => {
      const id = `run-${++runCounter}`;
      const row = { id, stepResults: [], currentStep: 0, ...data };
      runs.set(id, row);
      return row;
    },
    findFirst: async ({ where }: { where: { id: string } }) => runs.get(where.id) ?? null,
    update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      const row = { ...runs.get(where.id), ...data };
      runs.set(where.id, row);
      return row;
    },
  };

  const approval = {
    create: async ({ data }: { data: Record<string, unknown> }) => {
      const id = `apr-${++approvalCounter}`;
      const row = { id, status: 'pending', ...data };
      approvals.set(id, row);
      return row;
    },
    findFirst: async ({ where }: { where: { id: string } }) => approvals.get(where.id) ?? null,
    findMany: async () => [...approvals.values()],
    count: async () => approvals.size,
    update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      const row = { ...approvals.get(where.id), ...data };
      approvals.set(where.id, row);
      return row;
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { workflowDefinition, workflowRun, approval } as any;
}

const ctx = { tenantId: 'tenant-1', userId: 'user-1' };

describe('WorkflowService execution engine', () => {
  it('completes a run with only inline steps', async () => {
    const publisher = new RecordingPublisher();
    const prisma = createFakePrisma([
      { id: 's1', name: 'Send email', type: 'notification' },
      { id: 's2', name: 'Update CRM', type: 'action' },
    ]);
    const service = new WorkflowService(prisma, publisher);
    const def = await service.create(ctx, { name: 'Onboarding' });

    const run = await service.triggerRun(ctx, def.id, { input: {} });

    expect(run.status).toBe('completed');
    expect(publisher.topics()).toContain(EventTopics.WORKFLOW_STARTED);
    expect(publisher.topics()).toContain(EventTopics.WORKFLOW_COMPLETED);
  });

  it('pauses at an approval step and resumes on approval', async () => {
    const publisher = new RecordingPublisher();
    const prisma = createFakePrisma([
      { id: 's1', name: 'Notify', type: 'notification' },
      { id: 's2', name: 'Manager approval', type: 'approval' },
      { id: 's3', name: 'Finalize', type: 'action' },
    ]);
    const service = new WorkflowService(prisma, publisher);
    const def = await service.create(ctx, { name: 'Deal review' });

    const run = await service.triggerRun(ctx, def.id, {});
    expect(run.status).toBe('waiting_approval');
    expect(publisher.topics()).toContain(EventTopics.APPROVAL_REQUESTED);

    const { data: pending } = await service.listApprovals(ctx, { page: 1, limit: 20 });
    expect(pending).toHaveLength(1);

    await service.decideApproval(ctx, pending[0].id, { decision: 'approved' });

    const resumed = await service.findRunById(ctx, run.id);
    expect(resumed.status).toBe('completed');
    expect(publisher.topics()).toContain(EventTopics.APPROVAL_COMPLETED);
  });

  it('fails a run when an approval is rejected', async () => {
    const publisher = new RecordingPublisher();
    const prisma = createFakePrisma([
      { id: 's1', name: 'Manager approval', type: 'approval' },
    ]);
    const service = new WorkflowService(prisma, publisher);
    const def = await service.create(ctx, { name: 'Refund' });

    const run = await service.triggerRun(ctx, def.id, {});
    const { data: pending } = await service.listApprovals(ctx, { page: 1, limit: 20 });

    await service.decideApproval(ctx, pending[0].id, { decision: 'rejected' });

    const rejected = await service.findRunById(ctx, run.id);
    expect(rejected.status).toBe('failed');
    expect(publisher.topics()).toContain(EventTopics.WORKFLOW_FAILED);
  });
});
