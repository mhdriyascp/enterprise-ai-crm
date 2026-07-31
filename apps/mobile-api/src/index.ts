import { createLogger } from '@crm/logging';

import { loadConfig } from './config';
import { buildApp } from './infrastructure/http/server';

// =============================================================================
// Mobile API (BFF) — Entry Point
// =============================================================================

async function start(): Promise<void> {
  const config = loadConfig();
  const logger = createLogger({
    serviceName: 'mobile-api',
    serviceVersion: config.SERVICE_VERSION,
    level: config.LOG_LEVEL,
  });

  const app = await buildApp({ config, logger });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Shutting down mobile API');
    await app.close();
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  try {
    await app.listen({ port: config.PORT, host: config.HOST });
    logger.info({ port: config.PORT, host: config.HOST }, 'Mobile API started');
  } catch (error) {
    logger.error({ error }, 'Failed to start mobile API');
    process.exit(1);
  }
}

void start();
