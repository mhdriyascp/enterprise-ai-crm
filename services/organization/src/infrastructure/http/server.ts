import Fastify, { type FastifyInstance } from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import type { PrismaClient } from '@prisma/client';

import type { Logger } from '@crm/logging';

import type { OrganizationConfig } from '../../config';
import { OrganizationService } from '../../application/services/organization.service';
import { createAuthenticate } from '../../interface/middleware/authenticate';
import { createErrorHandler } from '../../interface/middleware/error-handler';
import { registerOrganizationRoutes } from '../../interface/routes/organization.routes';
import { registerHealthRoutes } from '../../interface/routes/health.routes';

// =============================================================================
// HTTP server assembly for the Organization service.
// =============================================================================

export interface BuildAppOptions {
  prisma: PrismaClient;
  config: OrganizationConfig;
  logger: Logger;
}

export async function buildApp(opts: BuildAppOptions): Promise<FastifyInstance> {
  const { prisma, config, logger } = opts;
  const app = Fastify({ logger: false, trustProxy: true });

  const service = new OrganizationService(prisma);
  const authenticate = createAuthenticate({
    secret: config.JWT_SECRET,
    issuer: config.JWT_ISSUER,
  });

  app.setErrorHandler(createErrorHandler(logger));

  await app.register(fastifyHelmet);
  await app.register(fastifyCors, { origin: config.CORS_ORIGINS });
  await app.register(fastifyRateLimit, {
    max: config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_WINDOW,
  });

  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Organization Service API',
        description: 'Organization management for the Enterprise AI CRM.',
        version: '1.0.0',
      },
      servers: [{ url: '/api/v1' }],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
    },
  });
  await app.register(fastifySwaggerUi, { routePrefix: '/docs' });

  registerHealthRoutes(app, prisma);

  await app.register(
    async (api) => registerOrganizationRoutes(api, service, authenticate),
    { prefix: '/api/v1/organizations' },
  );

  return app;
}
