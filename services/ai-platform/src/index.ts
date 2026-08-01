import { createLogger } from '@crm/logging';
import { createEventBus } from '@crm/events';

import { loadConfig } from './config';
import { disconnectPrisma, getPrisma } from './infrastructure/database/prisma';
import { buildApp } from './infrastructure/http/server';

// =============================================================================
// AI Platform Service — Entry Point
// =============================================================================

async function start(): Promise<void> {
  const config = loadConfig();
  const logger = createLogger({
    serviceName: 'ai-platform-service',
    serviceVersion: config.SERVICE_VERSION,
    level: config.LOG_LEVEL,
  });

  const prisma = getPrisma({ databaseUrl: config.DATABASE_URL, logger });

  const eventBus = createEventBus({
    enabled: config.EVENTS_ENABLED,
    brokers: config.KAFKA_BROKERS,
    clientId: config.KAFKA_CLIENT_ID,
    serviceName: 'ai-platform-service',
    logger,
  });
  await eventBus.connect();

  const app = await buildApp({ prisma, config, logger, events: eventBus.publisher });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Shutting down ai-platform service');
    await app.close();
    await eventBus.disconnect();
    await disconnectPrisma();
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  try {
    await app.listen({ port: config.PORT, host: config.HOST });
    logger.info({ port: config.PORT, host: config.HOST }, 'AI Platform service started');
  } catch (error) {
    logger.error({ error }, 'Failed to start ai-platform service');
    process.exit(1);
  }
}

void start();
