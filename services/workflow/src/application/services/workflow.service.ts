import type {
  Approval,
  Prisma,
  PrismaClient,
  WorkflowDefinition,
  WorkflowRun,
} from '@prisma/client';

import { ConflictError, NotFoundError } from '@crm/common';
import { EventTopics, NoopEventPublisher, type EventPublisher } from '@crm/events';

import type { StepResult, WorkflowStep } from '../../domain/workflow';
import type {
  CreateWorkflowInput,
  DecideApprovalInput,
  ListApprovalsQuery,
  ListRunsQuery,
  ListWorkflowsQuery,
  TriggerRunInput,
  UpdateWorkflowInput,
} from '../../interface/dtos';

// =============================================================================
// Workflow Service — tenant-scoped management of workflow definitions plus a
// deterministic, offline execution engine for runs and human approvals.
//
// Every operation is constrained to the caller's tenant and ignores
// soft-deleted definitions.
// =============================================================================

export interface TenantContext {
  tenantId: string;
  userId?: string;
}

function parseSteps(steps: Prisma.JsonValue): WorkflowStep[] {
  return Array.isArray(steps) ? (steps as unknown as WorkflowStep[]) : [];
}

export class WorkflowService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly events: EventPublisher = new NoopEventPublisher(),
  ) {}

  // ---------------------------------------------------------------------------
  // Definitions
  // ---------------------------------------------------------------------------

  async create(ctx: TenantContext, input: CreateWorkflowInput): Promise<WorkflowDefinition> {
    return this.prisma.workflowDefinition.create({
      data: {
        tenantId: ctx.tenantId,
        name: input.name,
        description: input.description,
        trigger: input.trigger ?? 'manual',
        triggerConfig: (input.triggerConfig ?? {}) as Prisma.InputJsonValue,
        steps: (input.steps ?? []) as unknown as Prisma.InputJsonValue,
        status: input.status ?? 'draft',
        ownerId: input.ownerId,
      },
    });
  }

  async list(
    ctx: TenantContext,
    query: ListWorkflowsQuery,
  ): Promise<{ data: WorkflowDefinition[]; total: number }> {
    const where: Prisma.WorkflowDefinitionWhereInput = {
      tenantId: ctx.tenantId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.trigger ? { trigger: query.trigger } : {}),
      ...(query.search
        ? { name: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.workflowDefinition.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.workflowDefinition.count({ where }),
    ]);

    return { data, total };
  }

  async findById(ctx: TenantContext, id: string): Promise<WorkflowDefinition> {
    const workflow = await this.prisma.workflowDefinition.findFirst({
      where: { id, tenantId: ctx.tenantId, deletedAt: null },
    });
    if (!workflow) throw new NotFoundError('Workflow', id);
    return workflow;
  }

  async update(
    ctx: TenantContext,
    id: string,
    input: UpdateWorkflowInput,
  ): Promise<WorkflowDefinition> {
    await this.findById(ctx, id);
    return this.prisma.workflowDefinition.update({
      where: { id },
      data: {
        ...input,
        triggerConfig: input.triggerConfig as Prisma.InputJsonValue | undefined,
        steps: input.steps as unknown as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async softDelete(ctx: TenantContext, id: string): Promise<void> {
    await this.findById(ctx, id);
    await this.prisma.workflowDefinition.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ---------------------------------------------------------------------------
  // Runs
  // ---------------------------------------------------------------------------

  async triggerRun(
    ctx: TenantContext,
    workflowId: string,
    input: TriggerRunInput,
  ): Promise<WorkflowRun> {
    const workflow = await this.findById(ctx, workflowId);
    if (workflow.status === 'inactive') {
      throw new ConflictError('Cannot run an inactive workflow.');
    }

    const run = await this.prisma.workflowRun.create({
      data: {
        tenantId: ctx.tenantId,
        workflowId,
        status: 'running',
        input: (input?.input ?? {}) as Prisma.InputJsonValue,
        triggeredBy: ctx.userId,
        startedAt: new Date(),
      },
    });

    await this.events.publish(
      EventTopics.WORKFLOW_STARTED,
      { workflowId, workflowType: workflow.trigger },
      { tenantId: ctx.tenantId, userId: ctx.userId },
    );

    return this.execute(ctx, run, parseSteps(workflow.steps), 0);
  }

  async listRuns(
    ctx: TenantContext,
    query: ListRunsQuery,
  ): Promise<{ data: WorkflowRun[]; total: number }> {
    const where: Prisma.WorkflowRunWhereInput = {
      tenantId: ctx.tenantId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.workflowId ? { workflowId: query.workflowId } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.workflowRun.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.workflowRun.count({ where }),
    ]);

    return { data, total };
  }

  async findRunById(ctx: TenantContext, runId: string): Promise<WorkflowRun> {
    const run = await this.prisma.workflowRun.findFirst({
      where: { id: runId, tenantId: ctx.tenantId },
    });
    if (!run) throw new NotFoundError('WorkflowRun', runId);
    return run;
  }

  async cancelRun(ctx: TenantContext, runId: string): Promise<WorkflowRun> {
    const run = await this.findRunById(ctx, runId);
    if (run.status === 'completed' || run.status === 'failed' || run.status === 'cancelled') {
      throw new ConflictError(`Run is already ${run.status}.`);
    }
    return this.prisma.workflowRun.update({
      where: { id: runId },
      data: { status: 'cancelled', completedAt: new Date() },
    });
  }

  // ---------------------------------------------------------------------------
  // Approvals
  // ---------------------------------------------------------------------------

  async listApprovals(
    ctx: TenantContext,
    query: ListApprovalsQuery,
  ): Promise<{ data: Approval[]; total: number }> {
    const where: Prisma.ApprovalWhereInput = {
      tenantId: ctx.tenantId,
      ...(query.status ? { status: query.status } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.approval.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.approval.count({ where }),
    ]);

    return { data, total };
  }

  async decideApproval(
    ctx: TenantContext,
    approvalId: string,
    input: DecideApprovalInput,
  ): Promise<Approval> {
    const approval = await this.prisma.approval.findFirst({
      where: { id: approvalId, tenantId: ctx.tenantId },
    });
    if (!approval) throw new NotFoundError('Approval', approvalId);
    if (approval.status !== 'pending') {
      throw new ConflictError(`Approval is already ${approval.status}.`);
    }

    const decided = await this.prisma.approval.update({
      where: { id: approvalId },
      data: {
        status: input.decision,
        decidedBy: ctx.userId,
        comment: input.comment,
        decidedAt: new Date(),
      },
    });

    await this.events.publish(
      EventTopics.APPROVAL_COMPLETED,
      { approvalId, runId: approval.runId, decision: input.decision },
      { tenantId: ctx.tenantId, userId: ctx.userId },
    );

    const run = await this.findRunById(ctx, approval.runId);

    if (input.decision === 'rejected') {
      await this.fail(ctx, run, `Approval rejected at step "${approval.stepName}".`);
      return decided;
    }

    // Approved — resume the run at the step following the approval gate.
    const workflow = await this.prisma.workflowDefinition.findUnique({
      where: { id: run.workflowId },
    });
    const steps = workflow ? parseSteps(workflow.steps) : [];
    await this.prisma.workflowRun.update({
      where: { id: run.id },
      data: { status: 'running' },
    });
    await this.execute(ctx, run, steps, approval.stepIndex + 1);

    return decided;
  }

  // ---------------------------------------------------------------------------
  // Execution engine
  // ---------------------------------------------------------------------------

  /**
   * Execute a run's steps sequentially starting at `startIndex`. Pauses at the
   * first `approval` step by raising an Approval and returning the run in
   * `waiting_approval`. Completes the run once all steps have executed.
   */
  private async execute(
    ctx: TenantContext,
    run: WorkflowRun,
    steps: WorkflowStep[],
    startIndex: number,
  ): Promise<WorkflowRun> {
    const results: StepResult[] = Array.isArray(run.stepResults)
      ? (run.stepResults as unknown as StepResult[])
      : [];

    try {
      for (let i = startIndex; i < steps.length; i += 1) {
        const step = steps[i];

        if (step.type === 'approval') {
          results.push({
            stepId: step.id,
            name: step.name,
            type: step.type,
            status: 'waiting',
            at: new Date().toISOString(),
          });
          await this.prisma.approval.create({
            data: {
              tenantId: ctx.tenantId,
              runId: run.id,
              stepIndex: i,
              stepName: step.name,
            },
          });
          const paused = await this.prisma.workflowRun.update({
            where: { id: run.id },
            data: {
              status: 'waiting_approval',
              currentStep: i,
              stepResults: results as unknown as Prisma.InputJsonValue,
            },
          });
          await this.events.publish(
            EventTopics.APPROVAL_REQUESTED,
            { runId: run.id, stepName: step.name },
            { tenantId: ctx.tenantId, userId: ctx.userId },
          );
          return paused;
        }

        results.push({
          stepId: step.id,
          name: step.name,
          type: step.type,
          status: 'completed',
          output: step.config,
          at: new Date().toISOString(),
        });
      }

      const completed = await this.prisma.workflowRun.update({
        where: { id: run.id },
        data: {
          status: 'completed',
          currentStep: steps.length,
          stepResults: results as unknown as Prisma.InputJsonValue,
          output: { steps: results.length } as Prisma.InputJsonValue,
          completedAt: new Date(),
        },
      });

      const workflow = await this.prisma.workflowDefinition.findUnique({
        where: { id: run.workflowId },
      });
      await this.events.publish(
        EventTopics.WORKFLOW_COMPLETED,
        { workflowId: run.workflowId, workflowType: workflow?.trigger ?? 'manual' },
        { tenantId: ctx.tenantId, userId: ctx.userId },
      );

      return completed;
    } catch (error) {
      return this.fail(ctx, run, error instanceof Error ? error.message : 'Execution failed.');
    }
  }

  private async fail(ctx: TenantContext, run: WorkflowRun, message: string): Promise<WorkflowRun> {
    const failed = await this.prisma.workflowRun.update({
      where: { id: run.id },
      data: { status: 'failed', error: message, completedAt: new Date() },
    });
    await this.events.publish(
      EventTopics.WORKFLOW_FAILED,
      { workflowId: run.workflowId, error: message },
      { tenantId: ctx.tenantId, userId: ctx.userId },
    );
    return failed;
  }
}
