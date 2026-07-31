import type { PrismaClient } from '@prisma/client';

// =============================================================================
// Permission Service — read-only access to the global permission catalog.
// =============================================================================

export class PermissionService {
  constructor(private readonly prisma: PrismaClient) {}

  async list() {
    return this.prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });
  }
}
