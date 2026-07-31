import { describe, expect, it } from 'vitest';

import { EventTopics, type EventPublisher, type PublishOptions } from '@crm/events';

import { LeadService } from '../../src/application/services/lead.service';

// A recording publisher so we can assert which domain events were emitted.
class RecordingPublisher implements EventPublisher {
  public readonly published: Array<{ topic: string; data: unknown; options: PublishOptions }> = [];

  async publish<T>(topic: string, data: T, options: PublishOptions): Promise<void> {
    this.published.push({ topic, data, options });
  }
}

// Minimal in-memory Prisma stand-in exposing only what LeadService uses.
function createFakePrisma(seed: Record<string, unknown> = {}) {
  const store = new Map<string, Record<string, unknown>>();
  let counter = 0;
  const lead = {
    create: async ({ data }: { data: Record<string, unknown> }) => {
      const id = `lead-${++counter}`;
      const row = { id, score: null, email: null, ...data };
      store.set(id, row);
      return row;
    },
    findFirst: async ({ where }: { where: { id: string } }) => store.get(where.id) ?? null,
    update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      const row = { ...store.get(where.id), ...data };
      store.set(where.id, row);
      return row;
    },
  };
  for (const [id, row] of Object.entries(seed)) {
    store.set(id, row as Record<string, unknown>);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { lead } as any;
}

const ctx = { tenantId: 'tenant-1', userId: 'user-1' };

describe('LeadService events', () => {
  it('publishes lead.created on create', async () => {
    const publisher = new RecordingPublisher();
    const service = new LeadService(createFakePrisma(), publisher);

    await service.create(ctx, { firstName: 'Ada', lastName: 'Lovelace', source: 'website' });

    const topics = publisher.published.map((e) => e.topic);
    expect(topics).toContain(EventTopics.LEAD_CREATED);
  });

  it('publishes lead.qualified when status transitions to qualified', async () => {
    const publisher = new RecordingPublisher();
    const service = new LeadService(createFakePrisma(), publisher);

    const lead = await service.create(ctx, { firstName: 'Ada', lastName: 'Lovelace' });
    publisher.published.length = 0;

    await service.update(ctx, lead.id, { status: 'qualified' });

    const topics = publisher.published.map((e) => e.topic);
    expect(topics).toContain(EventTopics.LEAD_QUALIFIED);
  });

  it('does not re-publish qualified when already qualified', async () => {
    const publisher = new RecordingPublisher();
    const service = new LeadService(createFakePrisma(), publisher);

    const lead = await service.create(ctx, {
      firstName: 'Ada',
      lastName: 'Lovelace',
      status: 'qualified',
    });
    publisher.published.length = 0;

    await service.update(ctx, lead.id, { score: 90 });

    const topics = publisher.published.map((e) => e.topic);
    expect(topics).not.toContain(EventTopics.LEAD_QUALIFIED);
  });
});
