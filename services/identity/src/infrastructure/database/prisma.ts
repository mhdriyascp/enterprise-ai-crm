import { PrismaClient } from '@prisma/client';

import type { Logger } from '@crm/logging';

// =============================================================================
// Prisma client for the Identity service.
//
// A dedicated client is used (rather than the shared @crm/database singleton)
// because each microservice owns its own database and generated client.
// =============================================================================

let prisma: PrismaClient | null = null;

export function getPrisma(options: { databaseUrl?: string; logger?: Logger } = {}): PrismaClient {
  if (prisma) return prisma;

  prisma = new PrismaClient({
    datasources: options.databaseUrl ? { db: { url: options.databaseUrl } } : undefined,
  });

  return prisma;
}

export async function disconnectPrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

export type { PrismaClient };
