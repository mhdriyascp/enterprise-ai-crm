import Fastify, { type FastifyInstance } from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import type { PrismaClient } from '@prisma/client';

import type { Logger } from '@crm/logging';

import type { ContactConfig } from '../../config';
import { ContactService } from '../../application/services/contact.service';
import { createAuthenticate } from '../../interface/middleware/authenticate';
import { createErrorHandler } from '../../interface/middleware/error-handler';
import { registerContactRoutes } from '../../interface/routes/contact.routes';
import { registerHealthRoutes } from '../../interface/routes/health.routes';

// =============================================================================
// HTTP server assembly for the Contact service.
// =============================================================================

export interface BuildAppOptions {
  prisma: PrismaClient;
  config: ContactConfig;
  logger: Logger;
}

export async function buildApp(opts: BuildAppOptions): Promise<FastifyInstance> {
  const { prisma, config, logger } = opts;
  const app = Fastify({ logger: false, trustProxy: true });

  const service = new ContactService(prisma);
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
        title: 'Contact Service API',
        description: 'Contact management for the Enterprise AI CRM.',
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
    async (api) => registerContactRoutes(api, service, authenticate),
    { prefix: '/api/v1/contacts' },
  );

  return app;
}
