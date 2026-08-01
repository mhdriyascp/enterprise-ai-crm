import { createLogger } from '@crm/logging';

import { loadConfig } from './config';
import { disconnectPrisma, getPrisma } from './infrastructure/database/prisma';
import { buildApp } from './infrastructure/http/server';

// =============================================================================
// Integration Service — Entry Point
// =============================================================================

async function start(): Promise<void> {
  const config = loadConfig();
  const logger = createLogger({
    serviceName: 'integration-service',
    serviceVersion: config.SERVICE_VERSION,
    level: config.LOG_LEVEL,
  });

  const prisma = getPrisma({ databaseUrl: config.DATABASE_URL, logger });

  const app = await buildApp({ prisma, config, logger });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Shutting down integration service');
    await app.close();
    await disconnectPrisma();
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  try {
    await app.listen({ port: config.PORT, host: config.HOST });
    logger.info({ port: config.PORT, host: config.HOST }, 'Integration service started');
  } catch (error) {
    logger.error({ error }, 'Failed to start integration service');
    process.exit(1);
  }
}

void start();
