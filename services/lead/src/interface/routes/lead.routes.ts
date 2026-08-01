import type { FastifyInstance, preHandlerHookHandler } from 'fastify';

import { buildPaginatedResult } from '@crm/common';

import type { LeadService } from '../../application/services/lead.service';
import { requirePrincipal } from '../middleware/authenticate';
import {
  CreateLeadSchema,
  IdParamSchema,
  ListLeadsQuerySchema,
  UpdateLeadSchema,
} from '../dtos';

// =============================================================================
// Lead routes — /api/v1/leads
// =============================================================================

export function registerLeadRoutes(
  app: FastifyInstance,
  service: LeadService,
  authenticate: preHandlerHookHandler,
): void {
  const tags = ['Leads'];
  const security = [{ bearerAuth: [] }];

  app.post(
    '/',
    { preHandler: [authenticate], schema: { tags, summary: 'Create a lead', security } },
    async (request, reply) => {
      const principal = requirePrincipal(request);
      const body = CreateLeadSchema.parse(request.body);
      const lead = await service.create({ tenantId: principal.tenantId, userId: principal.userId }, body);
      reply.status(201).send({ data: lead });
    },
  );

  app.get(
    '/',
    { preHandler: [authenticate], schema: { tags, summary: 'List leads', security } },
    async (request, reply) => {
      const principal = requirePrincipal(request);
      const query = ListLeadsQuerySchema.parse(request.query);
      const { data, total } = await service.list({ tenantId: principal.tenantId, userId: principal.userId }, query);
      reply.send(buildPaginatedResult(data, total, query.page, query.limit, request.id));
    },
  );

  app.get(
    '/:id',
    { preHandler: [authenticate], schema: { tags, summary: 'Get a lead', security } },
    async (request, reply) => {
      const principal = requirePrincipal(request);
      const { id } = IdParamSchema.parse(request.params);
      reply.send({ data: await service.findById({ tenantId: principal.tenantId, userId: principal.userId }, id) });
    },
  );

  app.patch(
    '/:id',
    { preHandler: [authenticate], schema: { tags, summary: 'Update a lead', security } },
    async (request, reply) => {
      const principal = requirePrincipal(request);
      const { id } = IdParamSchema.parse(request.params);
      const body = UpdateLeadSchema.parse(request.body);
      reply.send({ data: await service.update({ tenantId: principal.tenantId, userId: principal.userId }, id, body) });
    },
  );

  app.delete(
    '/:id',
    { preHandler: [authenticate], schema: { tags, summary: 'Soft-delete a lead', security } },
    async (request, reply) => {
      const principal = requirePrincipal(request);
      const { id } = IdParamSchema.parse(request.params);
      await service.softDelete({ tenantId: principal.tenantId, userId: principal.userId }, id);
      reply.status(204).send();
    },
  );
}
