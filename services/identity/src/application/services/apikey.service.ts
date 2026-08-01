import type { PrismaClient } from '@prisma/client';

import { generateApiKey, sha256 } from '@crm/common';
import { NotFoundError } from '@crm/common';

import { ApiKeyInvalidError } from '../../domain/errors';

// =============================================================================
// API Key Service — machine-to-machine credentials.
//
// The raw key is returned exactly once on creation. Only the SHA-256 hash is
// stored, so keys cannot be recovered from the database.
// =============================================================================

export interface ApiKeyContext {
  id: string;
  tenantId: string;
  scopes: string[];
}

export class ApiKeyService {
  constructor(private readonly prisma: PrismaClient) {}

  async create(
    tenantId: string,
    input: { name: string; scopes?: string[]; expiresAt?: Date | null; createdBy?: string | null },
  ) {
    const { key, prefix } = generateApiKey(tenantId.slice(0, 8));
    const keyHash = sha256(key);

    const record = await this.prisma.apiKey.create({
      data: {
        tenantId,
        name: input.name,
        keyPrefix: prefix,
        keyHash,
        scopes: input.scopes ?? [],
        expiresAt: input.expiresAt ?? null,
        createdBy: input.createdBy ?? null,
      },
    });

    // Return the plaintext key only here; it is never persisted or shown again.
    return { ...this.publicView(record), key };
  }

  async list(tenantId: string, params: { page: number; limit: number }) {
    const where = { tenantId };
    const [rows, total] = await Promise.all([
      this.prisma.apiKey.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.apiKey.count({ where }),
    ]);
    return { data: rows.map((r) => this.publicView(r)), total };
  }

  async revoke(tenantId: string, id: string) {
    const key = await this.prisma.apiKey.findFirst({ where: { id, tenantId } });
    if (!key) throw new NotFoundError('API key', id);
    await this.prisma.apiKey.update({ where: { id }, data: { revokedAt: new Date() } });
  }

  /**
   * Validate a raw API key. Returns the owning tenant + scopes, or throws.
   * Updates `lastUsedAt` on success.
   */
  async verify(rawKey: string): Promise<ApiKeyContext> {
    const keyHash = sha256(rawKey);
    const record = await this.prisma.apiKey.findUnique({ where: { keyHash } });

    if (!record || record.revokedAt) {
      throw new ApiKeyInvalidError();
    }
    if (record.expiresAt && record.expiresAt.getTime() < Date.now()) {
      throw new ApiKeyInvalidError('The API key has expired.');
    }

    await this.prisma.apiKey.update({
      where: { id: record.id },
      data: { lastUsedAt: new Date() },
    });

    return { id: record.id, tenantId: record.tenantId, scopes: record.scopes };
  }

  private publicView(record: {
    id: string;
    tenantId: string;
    name: string;
    keyPrefix: string;
    scopes: string[];
    expiresAt: Date | null;
    lastUsedAt: Date | null;
    revokedAt: Date | null;
    createdAt: Date;
  }) {
    return {
      id: record.id,
      tenantId: record.tenantId,
      name: record.name,
      keyPrefix: record.keyPrefix,
      scopes: record.scopes,
      expiresAt: record.expiresAt,
      lastUsedAt: record.lastUsedAt,
      revoked: Boolean(record.revokedAt),
      createdAt: record.createdAt,
    };
  }
}
