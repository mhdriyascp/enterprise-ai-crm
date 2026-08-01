import type { FastifyInstance } from 'fastify';

// =============================================================================
// Health & readiness routes for the mobile BFF.
//
// The BFF has no database; readiness reflects whether the upstream gateway is
// reachable (checked lazily so the probe stays fast).
// =============================================================================

const SERVICE = 'mobile-api';

export interface HealthDeps {
  upstreamUrl: string;
}

export function registerHealthRoutes(app: FastifyInstance, deps: HealthDeps): void {
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
      let upstream: 'ok' | 'error' = 'ok';
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 2000);
        const response = await fetch(new URL('/', deps.upstreamUrl), {
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (!response.ok && response.status >= 500) upstream = 'error';
      } catch {
        upstream = 'error';
      }

      const status = upstream === 'ok' ? 'ok' : 'error';
      reply.status(status === 'ok' ? 200 : 503).send({
        status,
        service: SERVICE,
        checks: { upstream },
      });
    },
  );
}
