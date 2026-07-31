import type { FastifyInstance, preHandlerHookHandler } from 'fastify';

import { buildPaginatedResult } from '@crm/common';

import type { WorkflowService, TenantContext } from '../../application/services/workflow.service';
import { requirePrincipal } from '../middleware/authenticate';
import {
  ApprovalIdParamSchema,
  CreateWorkflowSchema,
  DecideApprovalSchema,
  IdParamSchema,
  ListApprovalsQuerySchema,
  ListRunsQuerySchema,
  ListWorkflowsQuerySchema,
  RunParamSchema,
  TriggerRunSchema,
  UpdateWorkflowSchema,
} from '../dtos';
import type { FastifyRequest } from 'fastify';

// =============================================================================
// Workflow routes — /api/v1/workflows, /runs and /approvals
// =============================================================================

function ctxOf(request: FastifyRequest): TenantContext {
  const principal = requirePrincipal(request);
  return { tenantId: principal.tenantId, userId: principal.userId };
}

export function registerWorkflowRoutes(
  app: FastifyInstance,
  service: WorkflowService,
  authenticate: preHandlerHookHandler,
): void {
  const tags = ['Workflows'];
  const security = [{ bearerAuth: [] }];
  const guard = { preHandler: [authenticate] };

  // --- Definitions ---------------------------------------------------------
  app.post(
    '/workflows',
    { ...guard, schema: { tags, summary: 'Create a workflow definition', security } },
    async (request, reply) => {
      const body = CreateWorkflowSchema.parse(request.body);
      const workflow = await service.create(ctxOf(request), body);
      reply.status(201).send({ data: workflow });
    },
  );

  app.get(
    '/workflows',
    { ...guard, schema: { tags, summary: 'List workflow definitions', security } },
    async (request, reply) => {
      const query = ListWorkflowsQuerySchema.parse(request.query);
      const { data, total } = await service.list(ctxOf(request), query);
      reply.send(buildPaginatedResult(data, total, query.page, query.limit, request.id));
    },
  );

  app.get(
    '/workflows/:id',
    { ...guard, schema: { tags, summary: 'Get a workflow definition', security } },
    async (request, reply) => {
      const { id } = IdParamSchema.parse(request.params);
      reply.send({ data: await service.findById(ctxOf(request), id) });
    },
  );

  app.patch(
    '/workflows/:id',
    { ...guard, schema: { tags, summary: 'Update a workflow definition', security } },
    async (request, reply) => {
      const { id } = IdParamSchema.parse(request.params);
      const body = UpdateWorkflowSchema.parse(request.body);
      reply.send({ data: await service.update(ctxOf(request), id, body) });
    },
  );

  app.delete(
    '/workflows/:id',
    { ...guard, schema: { tags, summary: 'Soft-delete a workflow definition', security } },
    async (request, reply) => {
      const { id } = IdParamSchema.parse(request.params);
      await service.softDelete(ctxOf(request), id);
      reply.status(204).send();
    },
  );

  // --- Runs ----------------------------------------------------------------
  app.post(
    '/workflows/:id/runs',
    { ...guard, schema: { tags: ['Runs'], summary: 'Trigger a workflow run', security } },
    async (request, reply) => {
      const { id } = IdParamSchema.parse(request.params);
      const body = TriggerRunSchema.parse(request.body);
      const run = await service.triggerRun(ctxOf(request), id, body);
      reply.status(202).send({ data: run });
    },
  );

  app.get(
    '/runs',
    { ...guard, schema: { tags: ['Runs'], summary: 'List workflow runs', security } },
    async (request, reply) => {
      const query = ListRunsQuerySchema.parse(request.query);
      const { data, total } = await service.listRuns(ctxOf(request), query);
      reply.send(buildPaginatedResult(data, total, query.page, query.limit, request.id));
    },
  );

  app.get(
    '/runs/:runId',
    { ...guard, schema: { tags: ['Runs'], summary: 'Get a workflow run', security } },
    async (request, reply) => {
      const { runId } = RunParamSchema.parse(request.params);
      reply.send({ data: await service.findRunById(ctxOf(request), runId) });
    },
  );

  app.post(
    '/runs/:runId/cancel',
    { ...guard, schema: { tags: ['Runs'], summary: 'Cancel a workflow run', security } },
    async (request, reply) => {
      const { runId } = RunParamSchema.parse(request.params);
      reply.send({ data: await service.cancelRun(ctxOf(request), runId) });
    },
  );

  // --- Approvals -----------------------------------------------------------
  app.get(
    '/approvals',
    { ...guard, schema: { tags: ['Approvals'], summary: 'List approvals', security } },
    async (request, reply) => {
      const query = ListApprovalsQuerySchema.parse(request.query);
      const { data, total } = await service.listApprovals(ctxOf(request), query);
      reply.send(buildPaginatedResult(data, total, query.page, query.limit, request.id));
    },
  );

  app.post(
    '/approvals/:approvalId/decision',
    { ...guard, schema: { tags: ['Approvals'], summary: 'Approve or reject a pending approval', security } },
    async (request, reply) => {
      const { approvalId } = ApprovalIdParamSchema.parse(request.params);
      const body = DecideApprovalSchema.parse(request.body);
      reply.send({ data: await service.decideApproval(ctxOf(request), approvalId, body) });
    },
  );
}
