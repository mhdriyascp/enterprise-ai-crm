import type { PrismaClient } from '@prisma/client';

import type { Logger } from '@crm/logging';

// =============================================================================
// Audit Service — records security-relevant actions.
// =============================================================================

export interface AuditEntry {
  tenantId: string;
  actorId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}

export class AuditService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly logger?: Logger,
  ) {}

  /**
   * Persist an audit log entry. Audit writes must never break the primary
   * request flow, so failures are logged and swallowed.
   */
  async record(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          tenantId: entry.tenantId,
          actorId: entry.actorId ?? null,
          action: entry.action,
          resource: entry.resource,
          resourceId: entry.resourceId ?? null,
          ipAddress: entry.ipAddress ?? null,
          userAgent: entry.userAgent ?? null,
          metadata: (entry.metadata ?? {}) as object,
        },
      });
    } catch (error) {
      this.logger?.error({ error, action: entry.action }, 'Failed to write audit log');
    }
  }

  async list(
    tenantId: string,
    params: { page: number; limit: number; resource?: string; action?: string },
  ): Promise<{ data: unknown[]; total: number }> {
    const where = {
      tenantId,
      ...(params.resource ? { resource: params.resource } : {}),
      ...(params.action ? { action: params.action } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, total };
  }
}
