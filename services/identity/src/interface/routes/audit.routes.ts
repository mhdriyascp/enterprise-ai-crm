import type { FastifyInstance, preHandlerHookHandler } from 'fastify';

import { UnauthorizedError, buildPaginatedResult } from '@crm/common';

import type { Container } from '../../infrastructure/http/container';
import { requirePermissions } from '../middleware/authorize';
import { AuditQuerySchema } from '../dtos';

// =============================================================================
// Audit log routes — /api/v1/audit-logs (read-only, scoped to caller's tenant)
// =============================================================================

export function registerAuditRoutes(
  app: FastifyInstance,
  c: Container,
  authenticate: preHandlerHookHandler,
): void {
  app.get(
    '/',
    {
      preHandler: [authenticate, requirePermissions('audit:read')],
      schema: {
        tags: ['Audit'],
        summary: 'List audit log entries',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const tenantId = request.principal?.tenantId;
      if (!tenantId) throw new UnauthorizedError();
      const query = AuditQuerySchema.parse(request.query);
      const { data, total } = await c.audit.list(tenantId, query);
      reply.send(buildPaginatedResult(data, total, query.page, query.limit, request.id));
    },
  );
}
