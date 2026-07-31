import { PrismaClient } from '@prisma/client';

import type { Logger } from '@crm/logging';

// =============================================================================
// @crm/database — Shared Database Client
// =============================================================================

let prismaInstance: PrismaClient | null = null;

export interface PrismaOptions {
  databaseUrl?: string;
  logger?: Logger;
}

/**
 * Get or create a singleton Prisma client.
 * Handles connection pooling and graceful shutdown.
 */
export function getPrismaClient(options: PrismaOptions = {}): PrismaClient {
  if (prismaInstance) return prismaInstance;

  prismaInstance = new PrismaClient({
    datasources: options.databaseUrl
      ? { db: { url: options.databaseUrl } }
      : undefined,
    log: [
      { level: 'query', emit: 'event' },
      { level: 'warn', emit: 'event' },
      { level: 'error', emit: 'event' },
    ],
  });

  if (options.logger) {
    prismaInstance.$on('query', (e) => {
      options.logger?.debug({ query: e.query, duration: e.duration }, 'DB query');
    });
    prismaInstance.$on('warn', (e) => {
      options.logger?.warn({ message: e.message }, 'DB warning');
    });
    prismaInstance.$on('error', (e) => {
      options.logger?.error({ message: e.message }, 'DB error');
    });
  }

  return prismaInstance;
}

/**
 * Disconnect the Prisma client.
 * Call on application shutdown.
 */
export async function disconnectPrisma(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }
}

export { PrismaClient };
