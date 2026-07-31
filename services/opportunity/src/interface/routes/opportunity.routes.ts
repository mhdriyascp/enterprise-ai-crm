import type { FastifyInstance, preHandlerHookHandler } from 'fastify';

import { buildPaginatedResult } from '@crm/common';

import type { OpportunityService } from '../../application/services/opportunity.service';
import { requirePrincipal } from '../middleware/authenticate';
import {
  CreateOpportunitySchema,
  IdParamSchema,
  ListOpportunitiesQuerySchema,
  UpdateOpportunitySchema,
} from '../dtos';

// =============================================================================
// Opportunity routes — /api/v1/opportunities
// =============================================================================

export function registerOpportunityRoutes(
  app: FastifyInstance,
  service: OpportunityService,
  authenticate: preHandlerHookHandler,
): void {
  const tags = ['Opportunities'];
  const security = [{ bearerAuth: [] }];

  app.post(
    '/',
    { preHandler: [authenticate], schema: { tags, summary: 'Create a opportunity', security } },
    async (request, reply) => {
      const principal = requirePrincipal(request);
      const body = CreateOpportunitySchema.parse(request.body);
      const opportunity = await service.create({ tenantId: principal.tenantId }, body);
      reply.status(201).send({ data: opportunity });
    },
  );

  app.get(
    '/',
    { preHandler: [authenticate], schema: { tags, summary: 'List opportunities', security } },
    async (request, reply) => {
      const principal = requirePrincipal(request);
      const query = ListOpportunitiesQuerySchema.parse(request.query);
      const { data, total } = await service.list({ tenantId: principal.tenantId }, query);
      reply.send(buildPaginatedResult(data, total, query.page, query.limit, request.id));
    },
  );

  app.get(
    '/:id',
    { preHandler: [authenticate], schema: { tags, summary: 'Get a opportunity', security } },
    async (request, reply) => {
      const principal = requirePrincipal(request);
      const { id } = IdParamSchema.parse(request.params);
      reply.send({ data: await service.findById({ tenantId: principal.tenantId }, id) });
    },
  );

  app.patch(
    '/:id',
    { preHandler: [authenticate], schema: { tags, summary: 'Update a opportunity', security } },
    async (request, reply) => {
      const principal = requirePrincipal(request);
      const { id } = IdParamSchema.parse(request.params);
      const body = UpdateOpportunitySchema.parse(request.body);
      reply.send({ data: await service.update({ tenantId: principal.tenantId }, id, body) });
    },
  );

  app.delete(
    '/:id',
    { preHandler: [authenticate], schema: { tags, summary: 'Soft-delete a opportunity', security } },
    async (request, reply) => {
      const principal = requirePrincipal(request);
      const { id } = IdParamSchema.parse(request.params);
      await service.softDelete({ tenantId: principal.tenantId }, id);
      reply.status(204).send();
    },
  );
}
