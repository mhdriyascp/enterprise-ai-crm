import Fastify, { type FastifyInstance } from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import type { PrismaClient } from '@prisma/client';

import type { Logger } from '@crm/logging';

import type { IdentityConfig } from '../../config';
import { createAuthenticate } from '../../interface/middleware/authenticate';
import { createErrorHandler } from '../../interface/middleware/error-handler';
import { registerApiKeyRoutes } from '../../interface/routes/apikeys.routes';
import { registerAuditRoutes } from '../../interface/routes/audit.routes';
import { registerAuthRoutes } from '../../interface/routes/auth.routes';
import { registerHealthRoutes } from '../../interface/routes/health.routes';
import { registerPermissionRoutes } from '../../interface/routes/permissions.routes';
import { registerRoleRoutes } from '../../interface/routes/roles.routes';
import { registerTenantRoutes } from '../../interface/routes/tenants.routes';
import { registerUserRoutes } from '../../interface/routes/users.routes';
import { buildContainer } from './container';

// =============================================================================
// HTTP server assembly.
// =============================================================================

export interface BuildAppOptions {
  prisma: PrismaClient;
  config: IdentityConfig;
  logger: Logger;
}

export async function buildApp(opts: BuildAppOptions): Promise<FastifyInstance> {
  const { prisma, config, logger } = opts;
  const app = Fastify({ logger: false, trustProxy: true });

  const container = buildContainer(prisma, config, logger);
  const authenticate = createAuthenticate({
    tokens: container.tokens,
    apiKeys: container.apiKeys,
  });

  app.setErrorHandler(createErrorHandler(logger));

  // Security & platform plugins
  await app.register(fastifyHelmet);
  await app.register(fastifyCors, { origin: config.CORS_ORIGINS });

  // OpenAPI documentation
  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Identity & IAM Service API',
        description:
          'Authentication, authorization, tenants, users, roles, permissions, API keys and audit logging.',
        version: '1.0.0',
      },
      servers: [{ url: '/api/v1' }],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
          apiKey: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
        },
      },
    },
  });
  await app.register(fastifySwaggerUi, { routePrefix: '/docs' });

  // Health endpoints (unversioned)
  registerHealthRoutes(app, prisma);

  // Versioned API
  await app.register(
    async (api) => {
      await api.register(
        async (auth) => {
          // Rate-limit authentication endpoints within this encapsulated scope.
          await auth.register(fastifyRateLimit, {
            max: config.AUTH_RATE_LIMIT_MAX,
            timeWindow: config.AUTH_RATE_LIMIT_WINDOW,
          });
          registerAuthRoutes(auth, container, authenticate);
        },
        { prefix: '/auth' },
      );

      await api.register(
        async (scoped) => registerTenantRoutes(scoped, container, authenticate),
        { prefix: '/tenants' },
      );
      await api.register(
        async (scoped) => registerUserRoutes(scoped, container, authenticate),
        { prefix: '/users' },
      );
      await api.register(
        async (scoped) => registerRoleRoutes(scoped, container, authenticate),
        { prefix: '/roles' },
      );
      await api.register(
        async (scoped) => registerPermissionRoutes(scoped, container, authenticate),
        { prefix: '/permissions' },
      );
      await api.register(
        async (scoped) => registerApiKeyRoutes(scoped, container, authenticate),
        { prefix: '/api-keys' },
      );
      await api.register(
        async (scoped) => registerAuditRoutes(scoped, container, authenticate),
        { prefix: '/audit-logs' },
      );
    },
    { prefix: '/api/v1' },
  );

  return app;
}
