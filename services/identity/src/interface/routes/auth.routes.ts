import type { FastifyInstance, preHandlerHookHandler } from 'fastify';

import { UnauthorizedError } from '@crm/common';

import type { Container } from '../../infrastructure/http/container';
import { LoginSchema, RefreshSchema, RegisterSchema } from '../dtos';

// =============================================================================
// Authentication routes — /api/v1/auth
// =============================================================================

export function registerAuthRoutes(
  app: FastifyInstance,
  c: Container,
  authenticate: preHandlerHookHandler,
): void {
  const tag = ['Auth'];

  app.post(
    '/register',
    { schema: { tags: tag, summary: 'Register a new tenant and owner user' } },
    async (request, reply) => {
      const body = RegisterSchema.parse(request.body);
      const result = await c.auth.register(body);

      await c.audit.record({
        tenantId: result.tenantId,
        actorId: result.userId,
        action: 'auth.register',
        resource: 'tenant',
        resourceId: result.tenantId,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] ?? null,
      });

      reply.status(201).send({ data: result });
    },
  );

  app.post(
    '/login',
    { schema: { tags: tag, summary: 'Authenticate and receive a token pair' } },
    async (request, reply) => {
      const body = LoginSchema.parse(request.body);
      const result = await c.auth.login(body);
      reply.send({ data: result });
    },
  );

  app.post(
    '/refresh',
    { schema: { tags: tag, summary: 'Rotate a refresh token for a new token pair' } },
    async (request, reply) => {
      const body = RefreshSchema.parse(request.body);
      const result = await c.auth.refresh(body.refreshToken);
      reply.send({ data: result });
    },
  );

  app.post(
    '/logout',
    { schema: { tags: tag, summary: 'Revoke a refresh token' } },
    async (request, reply) => {
      const body = RefreshSchema.parse(request.body);
      await c.auth.logout(body.refreshToken);
      reply.status(204).send();
    },
  );

  app.get(
    '/me',
    { preHandler: authenticate, schema: { tags: tag, summary: 'Get the current principal', security: [{ bearerAuth: [] }] } },
    async (request, reply) => {
      const principal = request.principal;
      if (!principal?.userId) throw new UnauthorizedError();
      const user = await c.users.findById(principal.tenantId, principal.userId);
      reply.send({ data: { ...user, roles: principal.roles, permissions: principal.permissions } });
    },
  );
}
