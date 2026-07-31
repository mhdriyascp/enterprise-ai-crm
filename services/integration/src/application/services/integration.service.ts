import type {
  Integration,
  IntegrationEvent,
  Prisma,
  PrismaClient,
} from '@prisma/client';

import { ConflictError, NotFoundError } from '@crm/common';

import type {
  CreateIntegrationInput,
  ListEventsQuery,
  ListIntegrationsQuery,
  UpdateIntegrationInput,
  WebhookInput,
} from '../../interface/dtos';
import type { IntegrationEventType } from '../../domain/integration';

// =============================================================================
// Integration Service — tenant-scoped management of third-party provider
// connections plus an append-only activity log.
//
// Every operation is constrained to the caller's tenant and ignores
// soft-deleted integrations. Provider secrets are never persisted; only an
// opaque `credentialsRef` is stored.
// =============================================================================

export interface TenantContext {
  tenantId: string;
  userId?: string;
}

export class IntegrationService {
  constructor(private readonly prisma: PrismaClient) {}

  private async log(
    ctx: TenantContext,
    integrationId: string,
    type: IntegrationEventType,
    status: 'success' | 'failure',
    message?: string,
    payload: Record<string, unknown> = {},
  ): Promise<void> {
    await this.prisma.integrationEvent.create({
      data: {
        tenantId: ctx.tenantId,
        integrationId,
        type,
        status,
        message,
        payload: payload as Prisma.InputJsonValue,
      },
    });
  }

  // ---------------------------------------------------------------------------
  // CRUD
  // ---------------------------------------------------------------------------

  async create(ctx: TenantContext, input: CreateIntegrationInput): Promise<Integration> {
    return this.prisma.integration.create({
      data: {
        tenantId: ctx.tenantId,
        provider: input.provider,
        name: input.name,
        config: (input.config ?? {}) as Prisma.InputJsonValue,
        credentialsRef: input.credentialsRef,
        ownerId: input.ownerId,
      },
    });
  }

  async list(
    ctx: TenantContext,
    query: ListIntegrationsQuery,
  ): Promise<{ data: Integration[]; total: number }> {
    const where: Prisma.IntegrationWhereInput = {
      tenantId: ctx.tenantId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.provider ? { provider: query.provider } : {}),
      ...(query.search ? { name: { contains: query.search, mode: 'insensitive' } } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.integration.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.integration.count({ where }),
    ]);

    return { data, total };
  }

  async findById(ctx: TenantContext, id: string): Promise<Integration> {
    const integration = await this.prisma.integration.findFirst({
      where: { id, tenantId: ctx.tenantId, deletedAt: null },
    });
    if (!integration) throw new NotFoundError('Integration', id);
    return integration;
  }

  async update(
    ctx: TenantContext,
    id: string,
    input: UpdateIntegrationInput,
  ): Promise<Integration> {
    await this.findById(ctx, id);
    return this.prisma.integration.update({
      where: { id },
      data: {
        ...input,
        config: input.config as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async softDelete(ctx: TenantContext, id: string): Promise<void> {
    await this.findById(ctx, id);
    await this.prisma.integration.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ---------------------------------------------------------------------------
  // Lifecycle actions
  // ---------------------------------------------------------------------------

  async connect(ctx: TenantContext, id: string): Promise<Integration> {
    const integration = await this.findById(ctx, id);
    if (!integration.credentialsRef) {
      throw new ConflictError('Cannot connect: credentialsRef is not configured.');
    }
    const updated = await this.prisma.integration.update({
      where: { id },
      data: { status: 'connected', lastError: null },
    });
    await this.log(ctx, id, 'connected', 'success');
    return updated;
  }

  async disconnect(ctx: TenantContext, id: string): Promise<Integration> {
    await this.findById(ctx, id);
    const updated = await this.prisma.integration.update({
      where: { id },
      data: { status: 'disconnected' },
    });
    await this.log(ctx, id, 'disconnected', 'success');
    return updated;
  }

  async test(ctx: TenantContext, id: string): Promise<{ ok: boolean; status: string }> {
    const integration = await this.findById(ctx, id);
    const ok = integration.status === 'connected';
    await this.log(
      ctx,
      id,
      'test',
      ok ? 'success' : 'failure',
      ok ? undefined : 'Integration is not connected.',
    );
    return { ok, status: integration.status };
  }

  async sync(ctx: TenantContext, id: string): Promise<Integration> {
    const integration = await this.findById(ctx, id);
    if (integration.status !== 'connected') {
      throw new ConflictError('Cannot sync: integration is not connected.');
    }
    const updated = await this.prisma.integration.update({
      where: { id },
      data: { lastSyncedAt: new Date() },
    });
    await this.log(ctx, id, 'sync', 'success');
    return updated;
  }

  async recordWebhook(
    ctx: TenantContext,
    id: string,
    input: WebhookInput,
  ): Promise<IntegrationEvent> {
    const integration = await this.findById(ctx, id);
    return this.prisma.integrationEvent.create({
      data: {
        tenantId: ctx.tenantId,
        integrationId: integration.id,
        type: 'webhook',
        status: 'success',
        payload: input.payload as Prisma.InputJsonValue,
      },
    });
  }

  async listEvents(
    ctx: TenantContext,
    id: string,
    query: ListEventsQuery,
  ): Promise<{ data: IntegrationEvent[]; total: number }> {
    await this.findById(ctx, id);
    const where: Prisma.IntegrationEventWhereInput = {
      tenantId: ctx.tenantId,
      integrationId: id,
      ...(query.type ? { type: query.type } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.integrationEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.integrationEvent.count({ where }),
    ]);

    return { data, total };
  }
}
