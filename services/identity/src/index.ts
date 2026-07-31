import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';

import { createLogger } from '@crm/logging';

// =============================================================================
// Identity Service — Entry Point
// =============================================================================

const logger = createLogger({ serviceName: 'identity-service' });

async function buildApp() {
  const app = Fastify({
    logger: false,
  });

  // Plugins
  await app.register(fastifyCors, { origin: false });
  await app.register(fastifyHelmet);
  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Identity Service API',
        description: 'Authentication, authorization, and identity management',
        version: '1.0.0',
      },
      servers: [{ url: 'http://localhost:3000' }],
    },
  });
  await app.register(fastifySwaggerUi, { routePrefix: '/docs' });

  // Health routes
  app.get('/health', async () => ({
    status: 'ok',
    service: 'identity-service',
    version: process.env.SERVICE_VERSION ?? '0.1.0',
    uptime: process.uptime(),
  }));

  app.get('/health/ready', async () => ({
    status: 'ok',
    service: 'identity-service',
    checks: {
      database: 'ok',
      redis: 'ok',
    },
  }));

  // TODO: Register routes
  // await app.register(authRoutes, { prefix: '/api/v1/auth' });
  // await app.register(usersRoutes, { prefix: '/api/v1/users' });
  // await app.register(tenantsRoutes, { prefix: '/api/v1/tenants' });

  return app;
}

async function start() {
  const port = Number(process.env.PORT ?? 3000);
  const host = process.env.HOST ?? '0.0.0.0';

  const app = await buildApp();

  try {
    await app.listen({ port, host });
    logger.info({ port, host }, 'Identity service started');
  } catch (error) {
    logger.error(error, 'Failed to start identity service');
    process.exit(1);
  }
}

void start();
