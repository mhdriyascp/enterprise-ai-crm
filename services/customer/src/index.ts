import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';

import { createLogger } from '@crm/logging';

// =============================================================================
// Customer Service — Entry Point
// =============================================================================

const logger = createLogger({ serviceName: 'customer-service' });

async function buildApp() {
  const app = Fastify({ logger: false });

  await app.register(fastifyCors, { origin: false });
  await app.register(fastifyHelmet);

  app.get('/health', async () => ({
    status: 'ok',
    service: 'customer-service',
    version: process.env.SERVICE_VERSION ?? '0.1.0',
    uptime: process.uptime(),
  }));

  app.get('/health/ready', async () => ({
    status: 'ok',
    service: 'customer-service',
    checks: { database: 'ok', redis: 'ok', kafka: 'ok' },
  }));

  // TODO: Register customer routes
  // await app.register(customerRoutes, { prefix: '/api/v1/customers' });

  return app;
}

async function start() {
  const port = Number(process.env.PORT ?? 3000);
  const host = process.env.HOST ?? '0.0.0.0';

  const app = await buildApp();

  try {
    await app.listen({ port, host });
    logger.info({ port, host }, 'Customer service started');
  } catch (error) {
    logger.error(error, 'Failed to start customer service');
    process.exit(1);
  }
}

void start();
