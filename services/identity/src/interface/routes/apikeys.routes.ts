import type { FastifyInstance, preHandlerHookHandler } from 'fastify';

import { UnauthorizedError, buildPaginatedResult } from '@crm/common';

import type { Container } from '../../infrastructure/http/container';
import { requirePermissions } from '../middleware/authorize';
import { CreateApiKeySchema, IdParamSchema, PaginationQuerySchema } from '../dtos';

// =============================================================================
// API key routes — /api/v1/api-keys (scoped to the caller's tenant)
// =============================================================================

export function registerApiKeyRoutes(
  app: FastifyInstance,
  c: Container,
  authenticate: preHandlerHookHandler,
): void {
  const tag = ['API Keys'];
  const security = [{ bearerAuth: [] }];

  const tenantOf = (request: { principal?: { tenantId: string } }): string => {
    const tenantId = request.principal?.tenantId;
    if (!tenantId) throw new UnauthorizedError();
    return tenantId;
  };

  app.post(
    '/',
    {
      preHandler: [authenticate, requirePermissions('apikey:create')],
      schema: { tags: tag, summary: 'Create an API key (returns the secret once)', security },
    },
    async (request, reply) => {
      const tenantId = tenantOf(request);
      const body = CreateApiKeySchema.parse(request.body);
      const created = await c.apiKeys.create(tenantId, {
        name: body.name,
        scopes: body.scopes,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        createdBy: request.principal?.userId ?? null,
      });
      await c.audit.record({
        tenantId,
        actorId: request.principal?.userId ?? null,
        action: 'apikey.create',
        resource: 'apikey',
        resourceId: created.id,
        ipAddress: request.ip,
      });
      reply.status(201).send({ data: created });
    },
  );

  app.get(
    '/',
    {
      preHandler: [authenticate, requirePermissions('apikey:read')],
      schema: { tags: tag, summary: 'List API keys', security },
    },
    async (request, reply) => {
      const tenantId = tenantOf(request);
      const query = PaginationQuerySchema.parse(request.query);
      const { data, total } = await c.apiKeys.list(tenantId, query);
      reply.send(buildPaginatedResult(data, total, query.page, query.limit, request.id));
    },
  );

  app.delete(
    '/:id',
    {
      preHandler: [authenticate, requirePermissions('apikey:delete')],
      schema: { tags: tag, summary: 'Revoke an API key', security },
    },
    async (request, reply) => {
      const tenantId = tenantOf(request);
      const { id } = IdParamSchema.parse(request.params);
      await c.apiKeys.revoke(tenantId, id);
      await c.audit.record({
        tenantId,
        actorId: request.principal?.userId ?? null,
        action: 'apikey.revoke',
        resource: 'apikey',
        resourceId: id,
        ipAddress: request.ip,
      });
      reply.status(204).send();
    },
  );
}
