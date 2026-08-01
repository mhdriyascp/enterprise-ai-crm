import { describe, expect, it } from 'vitest';

import { IntegrationService } from '../../src/application/services/integration.service';

// =============================================================================
// Integration lifecycle tests — exercised against an in-memory fake Prisma so
// connect / test / sync transitions and the activity log can be verified
// offline.
// =============================================================================

function createFakePrisma() {
  let intCounter = 0;
  let evtCounter = 0;
  const integrations = new Map<string, Record<string, unknown>>();
  const events = new Map<string, Record<string, unknown>>();

  const integration = {
    create: async ({ data }: { data: Record<string, unknown> }) => {
      const id = `int-${++intCounter}`;
      const row = { id, status: 'disconnected', deletedAt: null, ...data };
      integrations.set(id, row);
      return row;
    },
    findFirst: async ({ where }: { where: { id: string } }) => integrations.get(where.id) ?? null,
    findMany: async () => [...integrations.values()],
    count: async () => integrations.size,
    update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      const row = { ...integrations.get(where.id), ...data };
      integrations.set(where.id, row);
      return row;
    },
  };

  const integrationEvent = {
    create: async ({ data }: { data: Record<string, unknown> }) => {
      const id = `evt-${++evtCounter}`;
      const row = { id, ...data };
      events.set(id, row);
      return row;
    },
    findMany: async () => [...events.values()],
    count: async () => events.size,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { integration, integrationEvent } as any;
}

const ctx = { tenantId: 'tenant-1', userId: 'user-1' };

describe('IntegrationService lifecycle', () => {
  it('connects only when credentialsRef is configured', async () => {
    const service = new IntegrationService(createFakePrisma());
    const created = await service.create(ctx, {
      provider: 'slack',
      name: 'Team Slack',
      credentialsRef: 'secret://slack/team',
    });

    const connected = await service.connect(ctx, created.id);
    expect(connected.status).toBe('connected');

    const { data: events } = await service.listEvents(ctx, created.id, { page: 1, limit: 20 });
    expect(events.map((e) => e.type)).toContain('connected');
  });

  it('refuses to connect without credentialsRef', async () => {
    const service = new IntegrationService(createFakePrisma());
    const created = await service.create(ctx, { provider: 'stripe', name: 'Billing' });
    await expect(service.connect(ctx, created.id)).rejects.toThrow();
  });

  it('test reports failure when disconnected and success when connected', async () => {
    const service = new IntegrationService(createFakePrisma());
    const created = await service.create(ctx, {
      provider: 'hubspot',
      name: 'Marketing',
      credentialsRef: 'secret://hubspot',
    });

    expect((await service.test(ctx, created.id)).ok).toBe(false);
    await service.connect(ctx, created.id);
    expect((await service.test(ctx, created.id)).ok).toBe(true);
  });

  it('syncs only a connected integration and stamps lastSyncedAt', async () => {
    const service = new IntegrationService(createFakePrisma());
    const created = await service.create(ctx, {
      provider: 'salesforce',
      name: 'SFDC',
      credentialsRef: 'secret://sfdc',
    });

    await expect(service.sync(ctx, created.id)).rejects.toThrow();
    await service.connect(ctx, created.id);
    const synced = await service.sync(ctx, created.id);
    expect(synced.lastSyncedAt).toBeInstanceOf(Date);
  });
});
