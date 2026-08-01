import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';

// =============================================================================
// Health & readiness routes.
// =============================================================================

const SERVICE = 'organization-service';

export function registerHealthRoutes(app: FastifyInstance, prisma: PrismaClient): void {
  app.get(
    '/health',
    { schema: { tags: ['Health'], summary: 'Liveness probe' } },
    async () => ({
      status: 'ok',
      service: SERVICE,
      version: process.env.SERVICE_VERSION ?? '0.1.0',
      uptime: process.uptime(),
    }),
  );

  app.get(
    '/health/ready',
    { schema: { tags: ['Health'], summary: 'Readiness probe' } },
    async (_request, reply) => {
      let database: 'ok' | 'error' = 'ok';
      try {
        await prisma.$queryRaw`SELECT 1`;
      } catch {
        database = 'error';
      }

      const status = database === 'ok' ? 'ok' : 'error';
      reply.status(status === 'ok' ? 200 : 503).send({
        status,
        service: SERVICE,
        checks: { database },
      });
    },
  );
}
