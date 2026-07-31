import { createLogger } from '@crm/logging';

import { loadConfig } from './config';
import { getPrisma, disconnectPrisma } from './infrastructure/database/prisma';
import { buildApp } from './infrastructure/http/server';
import { TenantService } from './application/services/tenant.service';

// =============================================================================
// Identity & IAM Service — Entry Point
// =============================================================================

async function start(): Promise<void> {
  const config = loadConfig();
  const logger = createLogger({
    serviceName: 'identity-service',
    serviceVersion: config.SERVICE_VERSION,
    level: config.LOG_LEVEL,
  });

  const prisma = getPrisma({ databaseUrl: config.DATABASE_URL, logger });

  // Ensure the global permission catalog is present on startup.
  try {
    await new TenantService(prisma).syncPermissions();
  } catch (error) {
    logger.warn({ error }, 'Permission catalog sync skipped (database not ready?)');
  }

  const app = await buildApp({ prisma, config, logger });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Shutting down identity service');
    await app.close();
    await disconnectPrisma();
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  try {
    await app.listen({ port: config.PORT, host: config.HOST });
    logger.info({ port: config.PORT, host: config.HOST }, 'Identity service started');
  } catch (error) {
    logger.error({ error }, 'Failed to start identity service');
    process.exit(1);
  }
}

void start();
