import type { FastifyInstance, FastifyRequest, preHandlerHookHandler } from 'fastify';

import { buildPaginatedResult } from '@crm/common';

import type {
  IntegrationService,
  TenantContext,
} from '../../application/services/integration.service';
import { requirePrincipal } from '../middleware/authenticate';
import {
  CreateIntegrationSchema,
  IdParamSchema,
  ListEventsQuerySchema,
  ListIntegrationsQuerySchema,
  UpdateIntegrationSchema,
  WebhookSchema,
} from '../dtos';

// =============================================================================
// Integration routes — /api/v1/integrations
// =============================================================================

function ctxOf(request: FastifyRequest): TenantContext {
  const principal = requirePrincipal(request);
  return { tenantId: principal.tenantId, userId: principal.userId };
}

export function registerIntegrationRoutes(
  app: FastifyInstance,
  service: IntegrationService,
  authenticate: preHandlerHookHandler,
): void {
  const tags = ['Integrations'];
  const security = [{ bearerAuth: [] }];
  const guard = { preHandler: [authenticate] };

  app.post(
    '/',
    { ...guard, schema: { tags, summary: 'Create an integration', security } },
    async (request, reply) => {
      const body = CreateIntegrationSchema.parse(request.body);
      reply.status(201).send({ data: await service.create(ctxOf(request), body) });
    },
  );

  app.get(
    '/',
    { ...guard, schema: { tags, summary: 'List integrations', security } },
    async (request, reply) => {
      const query = ListIntegrationsQuerySchema.parse(request.query);
      const { data, total } = await service.list(ctxOf(request), query);
      reply.send(buildPaginatedResult(data, total, query.page, query.limit, request.id));
    },
  );

  app.get(
    '/:id',
    { ...guard, schema: { tags, summary: 'Get an integration', security } },
    async (request, reply) => {
      const { id } = IdParamSchema.parse(request.params);
      reply.send({ data: await service.findById(ctxOf(request), id) });
    },
  );

  app.patch(
    '/:id',
    { ...guard, schema: { tags, summary: 'Update an integration', security } },
    async (request, reply) => {
      const { id } = IdParamSchema.parse(request.params);
      const body = UpdateIntegrationSchema.parse(request.body);
      reply.send({ data: await service.update(ctxOf(request), id, body) });
    },
  );

  app.delete(
    '/:id',
    { ...guard, schema: { tags, summary: 'Soft-delete an integration', security } },
    async (request, reply) => {
      const { id } = IdParamSchema.parse(request.params);
      await service.softDelete(ctxOf(request), id);
      reply.status(204).send();
    },
  );

  // --- Lifecycle actions ---------------------------------------------------
  app.post(
    '/:id/connect',
    { ...guard, schema: { tags, summary: 'Connect an integration', security } },
    async (request, reply) => {
      const { id } = IdParamSchema.parse(request.params);
      reply.send({ data: await service.connect(ctxOf(request), id) });
    },
  );

  app.post(
    '/:id/disconnect',
    { ...guard, schema: { tags, summary: 'Disconnect an integration', security } },
    async (request, reply) => {
      const { id } = IdParamSchema.parse(request.params);
      reply.send({ data: await service.disconnect(ctxOf(request), id) });
    },
  );

  app.post(
    '/:id/test',
    { ...guard, schema: { tags, summary: 'Test an integration connection', security } },
    async (request, reply) => {
      const { id } = IdParamSchema.parse(request.params);
      reply.send({ data: await service.test(ctxOf(request), id) });
    },
  );

  app.post(
    '/:id/sync',
    { ...guard, schema: { tags, summary: 'Trigger a sync', security } },
    async (request, reply) => {
      const { id } = IdParamSchema.parse(request.params);
      reply.status(202).send({ data: await service.sync(ctxOf(request), id) });
    },
  );

  app.post(
    '/:id/webhook',
    { ...guard, schema: { tags, summary: 'Record an inbound webhook', security } },
    async (request, reply) => {
      const { id } = IdParamSchema.parse(request.params);
      const body = WebhookSchema.parse(request.body ?? {});
      reply.status(202).send({ data: await service.recordWebhook(ctxOf(request), id, body) });
    },
  );

  app.get(
    '/:id/events',
    { ...guard, schema: { tags, summary: 'List integration activity events', security } },
    async (request, reply) => {
      const { id } = IdParamSchema.parse(request.params);
      const query = ListEventsQuerySchema.parse(request.query);
      const { data, total } = await service.listEvents(ctxOf(request), id, query);
      reply.send(buildPaginatedResult(data, total, query.page, query.limit, request.id));
    },
  );
}
