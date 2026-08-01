import type { FastifyInstance, preHandlerHookHandler } from 'fastify';

import { UnauthorizedError, buildPaginatedResult } from '@crm/common';

import type { Container } from '../../infrastructure/http/container';
import { requirePermissions } from '../middleware/authorize';
import {
  CreateRoleSchema,
  IdParamSchema,
  PaginationQuerySchema,
  SetRolePermissionsSchema,
  UpdateRoleSchema,
} from '../dtos';

// =============================================================================
// Role management routes — /api/v1/roles (scoped to the caller's tenant)
// =============================================================================

export function registerRoleRoutes(
  app: FastifyInstance,
  c: Container,
  authenticate: preHandlerHookHandler,
): void {
  const tag = ['Roles'];
  const security = [{ bearerAuth: [] }];

  const tenantOf = (request: { principal?: { tenantId: string } }): string => {
    const tenantId = request.principal?.tenantId;
    if (!tenantId) throw new UnauthorizedError();
    return tenantId;
  };

  app.post(
    '/',
    {
      preHandler: [authenticate, requirePermissions('role:create')],
      schema: { tags: tag, summary: 'Create a role', security },
    },
    async (request, reply) => {
      const tenantId = tenantOf(request);
      const body = CreateRoleSchema.parse(request.body);
      const role = await c.roles.create(tenantId, body);
      await c.audit.record({
        tenantId,
        actorId: request.principal?.userId ?? null,
        action: 'role.create',
        resource: 'role',
        resourceId: role.id,
        ipAddress: request.ip,
      });
      reply.status(201).send({ data: role });
    },
  );

  app.get(
    '/',
    {
      preHandler: [authenticate, requirePermissions('role:read')],
      schema: { tags: tag, summary: 'List roles', security },
    },
    async (request, reply) => {
      const tenantId = tenantOf(request);
      const query = PaginationQuerySchema.parse(request.query);
      const { data, total } = await c.roles.list(tenantId, query);
      reply.send(buildPaginatedResult(data, total, query.page, query.limit, request.id));
    },
  );

  app.get(
    '/:id',
    {
      preHandler: [authenticate, requirePermissions('role:read')],
      schema: { tags: tag, summary: 'Get a role', security },
    },
    async (request, reply) => {
      const tenantId = tenantOf(request);
      const { id } = IdParamSchema.parse(request.params);
      reply.send({ data: await c.roles.findById(tenantId, id) });
    },
  );

  app.patch(
    '/:id',
    {
      preHandler: [authenticate, requirePermissions('role:update')],
      schema: { tags: tag, summary: 'Update a role', security },
    },
    async (request, reply) => {
      const tenantId = tenantOf(request);
      const { id } = IdParamSchema.parse(request.params);
      const body = UpdateRoleSchema.parse(request.body);
      const role = await c.roles.update(tenantId, id, body);
      await c.audit.record({
        tenantId,
        actorId: request.principal?.userId ?? null,
        action: 'role.update',
        resource: 'role',
        resourceId: id,
        ipAddress: request.ip,
      });
      reply.send({ data: role });
    },
  );

  app.put(
    '/:id/permissions',
    {
      preHandler: [authenticate, requirePermissions('role:update', 'permission:read')],
      schema: { tags: tag, summary: "Replace a role's permissions", security },
    },
    async (request, reply) => {
      const tenantId = tenantOf(request);
      const { id } = IdParamSchema.parse(request.params);
      const body = SetRolePermissionsSchema.parse(request.body);
      const role = await c.roles.setPermissions(tenantId, id, body.permissionIds);
      await c.audit.record({
        tenantId,
        actorId: request.principal?.userId ?? null,
        action: 'role.permissions.set',
        resource: 'role',
        resourceId: id,
        ipAddress: request.ip,
        metadata: { permissionIds: body.permissionIds },
      });
      reply.send({ data: role });
    },
  );

  app.delete(
    '/:id',
    {
      preHandler: [authenticate, requirePermissions('role:delete')],
      schema: { tags: tag, summary: 'Delete a role', security },
    },
    async (request, reply) => {
      const tenantId = tenantOf(request);
      const { id } = IdParamSchema.parse(request.params);
      await c.roles.delete(tenantId, id);
      await c.audit.record({
        tenantId,
        actorId: request.principal?.userId ?? null,
        action: 'role.delete',
        resource: 'role',
        resourceId: id,
        ipAddress: request.ip,
      });
      reply.status(204).send();
    },
  );
}
