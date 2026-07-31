import Fastify, { type FastifyInstance } from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';

import type { Logger } from '@crm/logging';

import type { MobileApiConfig } from '../../config';
import { DeviceRegistry, MobileService } from '../../application/services/mobile.service';
import { GatewayClient } from '../gateway/client';
import { createAuthenticate } from '../../interface/middleware/authenticate';
import { createErrorHandler } from '../../interface/middleware/error-handler';
import { registerHealthRoutes } from '../../interface/routes/health.routes';
import { registerMobileRoutes } from '../../interface/routes/mobile.routes';

// =============================================================================
// HTTP server assembly for the Mobile API (BFF).
// =============================================================================

export interface BuildAppOptions {
  config: MobileApiConfig;
  logger: Logger;
}

export async function buildApp(opts: BuildAppOptions): Promise<FastifyInstance> {
  const { config, logger } = opts;
  const app = Fastify({ logger: false, trustProxy: true });

  const gateway = new GatewayClient({
    baseUrl: config.UPSTREAM_GATEWAY_URL,
    timeoutMs: config.UPSTREAM_TIMEOUT_MS,
  });
  const service = new MobileService(gateway, config.MOBILE_PAGE_SIZE);
  const devices = new DeviceRegistry();
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
        title: 'Mobile API (BFF)',
        description: 'Mobile-optimized aggregation API for the Enterprise AI CRM Flutter app.',
        version: '1.0.0',
      },
      servers: [{ url: '/mobile/v1' }],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
    },
  });
  await app.register(fastifySwaggerUi, { routePrefix: '/docs' });

  registerHealthRoutes(app, { upstreamUrl: config.UPSTREAM_GATEWAY_URL });

  await app.register(
    async (api) => registerMobileRoutes(api, { service, devices, authenticate }),
    { prefix: '/mobile/v1' },
  );

  return app;
}
