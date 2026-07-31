import type { FastifyInstance, preHandlerHookHandler } from 'fastify';

import { buildPaginatedResult } from '@crm/common';

import type { CustomerService } from '../../application/services/customer.service';
import { requirePrincipal } from '../middleware/authenticate';
import {
  CreateCustomerSchema,
  IdParamSchema,
  ListCustomersQuerySchema,
  UpdateCustomerSchema,
} from '../dtos';

// =============================================================================
// Customer routes — /api/v1/customers
// =============================================================================

export function registerCustomerRoutes(
  app: FastifyInstance,
  service: CustomerService,
  authenticate: preHandlerHookHandler,
): void {
  const tags = ['Customers'];
  const security = [{ bearerAuth: [] }];

  app.post(
    '/',
    { preHandler: [authenticate], schema: { tags, summary: 'Create a customer', security } },
    async (request, reply) => {
      const principal = requirePrincipal(request);
      const body = CreateCustomerSchema.parse(request.body);
      const customer = await service.create({ tenantId: principal.tenantId }, body);
      reply.status(201).send({ data: customer });
    },
  );

  app.get(
    '/',
    { preHandler: [authenticate], schema: { tags, summary: 'List customers', security } },
    async (request, reply) => {
      const principal = requirePrincipal(request);
      const query = ListCustomersQuerySchema.parse(request.query);
      const { data, total } = await service.list({ tenantId: principal.tenantId }, query);
      reply.send(buildPaginatedResult(data, total, query.page, query.limit, request.id));
    },
  );

  app.get(
    '/:id',
    { preHandler: [authenticate], schema: { tags, summary: 'Get a customer', security } },
    async (request, reply) => {
      const principal = requirePrincipal(request);
      const { id } = IdParamSchema.parse(request.params);
      reply.send({ data: await service.findById({ tenantId: principal.tenantId }, id) });
    },
  );

  app.patch(
    '/:id',
    { preHandler: [authenticate], schema: { tags, summary: 'Update a customer', security } },
    async (request, reply) => {
      const principal = requirePrincipal(request);
      const { id } = IdParamSchema.parse(request.params);
      const body = UpdateCustomerSchema.parse(request.body);
      reply.send({ data: await service.update({ tenantId: principal.tenantId }, id, body) });
    },
  );

  app.delete(
    '/:id',
    { preHandler: [authenticate], schema: { tags, summary: 'Soft-delete a customer', security } },
    async (request, reply) => {
      const principal = requirePrincipal(request);
      const { id } = IdParamSchema.parse(request.params);
      await service.softDelete({ tenantId: principal.tenantId }, id);
      reply.status(204).send();
    },
  );
}
