import type { FastifyInstance, preHandlerHookHandler } from 'fastify';

import { buildPaginatedResult } from '@crm/common';

import type { OrganizationService } from '../../application/services/organization.service';
import { requirePrincipal } from '../middleware/authenticate';
import {
  CreateOrganizationSchema,
  IdParamSchema,
  ListOrganizationsQuerySchema,
  UpdateOrganizationSchema,
} from '../dtos';

// =============================================================================
// Organization routes — /api/v1/organizations
// =============================================================================

export function registerOrganizationRoutes(
  app: FastifyInstance,
  service: OrganizationService,
  authenticate: preHandlerHookHandler,
): void {
  const tags = ['Organizations'];
  const security = [{ bearerAuth: [] }];

  app.post(
    '/',
    { preHandler: [authenticate], schema: { tags, summary: 'Create a organization', security } },
    async (request, reply) => {
      const principal = requirePrincipal(request);
      const body = CreateOrganizationSchema.parse(request.body);
      const organization = await service.create({ tenantId: principal.tenantId }, body);
      reply.status(201).send({ data: organization });
    },
  );

  app.get(
    '/',
    { preHandler: [authenticate], schema: { tags, summary: 'List organizations', security } },
    async (request, reply) => {
      const principal = requirePrincipal(request);
      const query = ListOrganizationsQuerySchema.parse(request.query);
      const { data, total } = await service.list({ tenantId: principal.tenantId }, query);
      reply.send(buildPaginatedResult(data, total, query.page, query.limit, request.id));
    },
  );

  app.get(
    '/:id',
    { preHandler: [authenticate], schema: { tags, summary: 'Get a organization', security } },
    async (request, reply) => {
      const principal = requirePrincipal(request);
      const { id } = IdParamSchema.parse(request.params);
      reply.send({ data: await service.findById({ tenantId: principal.tenantId }, id) });
    },
  );

  app.patch(
    '/:id',
    { preHandler: [authenticate], schema: { tags, summary: 'Update a organization', security } },
    async (request, reply) => {
      const principal = requirePrincipal(request);
      const { id } = IdParamSchema.parse(request.params);
      const body = UpdateOrganizationSchema.parse(request.body);
      reply.send({ data: await service.update({ tenantId: principal.tenantId }, id, body) });
    },
  );

  app.delete(
    '/:id',
    { preHandler: [authenticate], schema: { tags, summary: 'Soft-delete a organization', security } },
    async (request, reply) => {
      const principal = requirePrincipal(request);
      const { id } = IdParamSchema.parse(request.params);
      await service.softDelete({ tenantId: principal.tenantId }, id);
      reply.status(204).send();
    },
  );
}
