import type { FastifyInstance, preHandlerHookHandler } from 'fastify';

import type { Container } from '../../infrastructure/http/container';
import { requirePermissions } from '../middleware/authorize';

// =============================================================================
// Permission catalog routes — /api/v1/permissions (read-only)
// =============================================================================

export function registerPermissionRoutes(
  app: FastifyInstance,
  c: Container,
  authenticate: preHandlerHookHandler,
): void {
  app.get(
    '/',
    {
      preHandler: [authenticate, requirePermissions('permission:read')],
      schema: {
        tags: ['Permissions'],
        summary: 'List all platform permissions',
        security: [{ bearerAuth: [] }],
      },
    },
    async (_request, reply) => {
      reply.send({ data: await c.permissions.list() });
    },
  );
}
