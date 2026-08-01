import type { FastifyInstance, preHandlerHookHandler } from 'fastify';

import { UnauthorizedError, buildPaginatedResult } from '@crm/common';

import type { Container } from '../../infrastructure/http/container';
import { requirePermissions } from '../middleware/authorize';
import {
  CreateUserSchema,
  IdParamSchema,
  PaginationQuerySchema,
  SetUserRolesSchema,
  UpdateUserSchema,
} from '../dtos';

// =============================================================================
// User management routes — /api/v1/users (scoped to the caller's tenant)
// =============================================================================

export function registerUserRoutes(
  app: FastifyInstance,
  c: Container,
  authenticate: preHandlerHookHandler,
): void {
  const tag = ['Users'];
  const security = [{ bearerAuth: [] }];

  const tenantOf = (request: { principal?: { tenantId: string } }): string => {
    const tenantId = request.principal?.tenantId;
    if (!tenantId) throw new UnauthorizedError();
    return tenantId;
  };

  app.post(
    '/',
    {
      preHandler: [authenticate, requirePermissions('user:create')],
      schema: { tags: tag, summary: 'Create a user', security },
    },
    async (request, reply) => {
      const tenantId = tenantOf(request);
      const body = CreateUserSchema.parse(request.body);
      const user = await c.users.create({ tenantId, ...body });
      await c.audit.record({
        tenantId,
        actorId: request.principal?.userId ?? null,
        action: 'user.create',
        resource: 'user',
        resourceId: user.id,
        ipAddress: request.ip,
      });
      reply.status(201).send({ data: user });
    },
  );

  app.get(
    '/',
    {
      preHandler: [authenticate, requirePermissions('user:read')],
      schema: { tags: tag, summary: 'List users', security },
    },
    async (request, reply) => {
      const tenantId = tenantOf(request);
      const query = PaginationQuerySchema.parse(request.query);
      const { data, total } = await c.users.list(tenantId, query);
      reply.send(buildPaginatedResult(data, total, query.page, query.limit, request.id));
    },
  );

  app.get(
    '/:id',
    {
      preHandler: [authenticate, requirePermissions('user:read')],
      schema: { tags: tag, summary: 'Get a user', security },
    },
    async (request, reply) => {
      const tenantId = tenantOf(request);
      const { id } = IdParamSchema.parse(request.params);
      reply.send({ data: await c.users.findById(tenantId, id) });
    },
  );

  app.patch(
    '/:id',
    {
      preHandler: [authenticate, requirePermissions('user:update')],
      schema: { tags: tag, summary: 'Update a user', security },
    },
    async (request, reply) => {
      const tenantId = tenantOf(request);
      const { id } = IdParamSchema.parse(request.params);
      const body = UpdateUserSchema.parse(request.body);
      const user = await c.users.update(tenantId, id, body);
      await c.audit.record({
        tenantId,
        actorId: request.principal?.userId ?? null,
        action: 'user.update',
        resource: 'user',
        resourceId: id,
        ipAddress: request.ip,
      });
      reply.send({ data: user });
    },
  );

  app.put(
    '/:id/roles',
    {
      preHandler: [authenticate, requirePermissions('user:update', 'role:read')],
      schema: { tags: tag, summary: "Replace a user's roles", security },
    },
    async (request, reply) => {
      const tenantId = tenantOf(request);
      const { id } = IdParamSchema.parse(request.params);
      const body = SetUserRolesSchema.parse(request.body);
      const user = await c.users.setRoles(tenantId, id, body.roleIds);
      await c.audit.record({
        tenantId,
        actorId: request.principal?.userId ?? null,
        action: 'user.roles.set',
        resource: 'user',
        resourceId: id,
        ipAddress: request.ip,
        metadata: { roleIds: body.roleIds },
      });
      reply.send({ data: user });
    },
  );

  app.delete(
    '/:id',
    {
      preHandler: [authenticate, requirePermissions('user:delete')],
      schema: { tags: tag, summary: 'Deactivate a user', security },
    },
    async (request, reply) => {
      const tenantId = tenantOf(request);
      const { id } = IdParamSchema.parse(request.params);
      await c.users.softDelete(tenantId, id);
      await c.audit.record({
        tenantId,
        actorId: request.principal?.userId ?? null,
        action: 'user.delete',
        resource: 'user',
        resourceId: id,
        ipAddress: request.ip,
      });
      reply.status(204).send();
    },
  );
}
