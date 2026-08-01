import type { FastifyInstance, preHandlerHookHandler } from 'fastify';

import { buildPaginatedResult } from '@crm/common';

import type { Container } from '../../infrastructure/http/container';
import { requirePermissions } from '../middleware/authorize';
import {
  CreateTenantSchema,
  IdParamSchema,
  PaginationQuerySchema,
  UpdateTenantSchema,
} from '../dtos';

// =============================================================================
// Tenant management routes — /api/v1/tenants
// =============================================================================

export function registerTenantRoutes(
  app: FastifyInstance,
  c: Container,
  authenticate: preHandlerHookHandler,
): void {
  const tag = ['Tenants'];
  const security = [{ bearerAuth: [] }];

  app.post(
    '/',
    {
      preHandler: [authenticate, requirePermissions('tenant:create')],
      schema: { tags: tag, summary: 'Create a tenant', security },
    },
    async (request, reply) => {
      const body = CreateTenantSchema.parse(request.body);
      const tenant = await c.tenants.create(body);
      await c.audit.record({
        tenantId: tenant.id,
        actorId: request.principal?.userId ?? null,
        action: 'tenant.create',
        resource: 'tenant',
        resourceId: tenant.id,
        ipAddress: request.ip,
      });
      reply.status(201).send({ data: tenant });
    },
  );

  app.get(
    '/',
    {
      preHandler: [authenticate, requirePermissions('tenant:read')],
      schema: { tags: tag, summary: 'List tenants', security },
    },
    async (request, reply) => {
      const query = PaginationQuerySchema.parse(request.query);
      const { data, total } = await c.tenants.list(query);
      reply.send(buildPaginatedResult(data, total, query.page, query.limit, request.id));
    },
  );

  app.get(
    '/:id',
    {
      preHandler: [authenticate, requirePermissions('tenant:read')],
      schema: { tags: tag, summary: 'Get a tenant', security },
    },
    async (request, reply) => {
      const { id } = IdParamSchema.parse(request.params);
      reply.send({ data: await c.tenants.findById(id) });
    },
  );

  app.patch(
    '/:id',
    {
      preHandler: [authenticate, requirePermissions('tenant:update')],
      schema: { tags: tag, summary: 'Update a tenant', security },
    },
    async (request, reply) => {
      const { id } = IdParamSchema.parse(request.params);
      const body = UpdateTenantSchema.parse(request.body);
      const tenant = await c.tenants.update(id, body);
      await c.audit.record({
        tenantId: id,
        actorId: request.principal?.userId ?? null,
        action: 'tenant.update',
        resource: 'tenant',
        resourceId: id,
        ipAddress: request.ip,
      });
      reply.send({ data: tenant });
    },
  );

  app.delete(
    '/:id',
    {
      preHandler: [authenticate, requirePermissions('tenant:delete')],
      schema: { tags: tag, summary: 'Soft-delete a tenant', security },
    },
    async (request, reply) => {
      const { id } = IdParamSchema.parse(request.params);
      await c.tenants.softDelete(id);
      await c.audit.record({
        tenantId: id,
        actorId: request.principal?.userId ?? null,
        action: 'tenant.delete',
        resource: 'tenant',
        resourceId: id,
        ipAddress: request.ip,
      });
      reply.status(204).send();
    },
  );
}
