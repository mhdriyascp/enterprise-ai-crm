import { describe, expect, it } from 'vitest';

import { EventTopics, type EventPublisher, type PublishOptions } from '@crm/events';

import { OpportunityService } from '../../src/application/services/opportunity.service';

class RecordingPublisher implements EventPublisher {
  public readonly published: Array<{ topic: string; data: unknown; options: PublishOptions }> = [];

  async publish<T>(topic: string, data: T, options: PublishOptions): Promise<void> {
    this.published.push({ topic, data, options });
  }
}

function createFakePrisma() {
  const store = new Map<string, Record<string, unknown>>();
  let counter = 0;
  const opportunity = {
    create: async ({ data }: { data: Record<string, unknown> }) => {
      const id = `opp-${++counter}`;
      const row = { id, amount: 0, currency: 'USD', ...data };
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { opportunity } as any;
}

const ctx = { tenantId: 'tenant-1', userId: 'user-1' };

describe('OpportunityService events', () => {
  it('publishes opportunity.created on create', async () => {
    const publisher = new RecordingPublisher();
    const service = new OpportunityService(createFakePrisma(), publisher);

    await service.create(ctx, { name: 'Big Deal', amount: 1000 });

    expect(publisher.published.map((e) => e.topic)).toContain(EventTopics.OPPORTUNITY_CREATED);
  });

  it('publishes opportunity.won when stage transitions to closed_won', async () => {
    const publisher = new RecordingPublisher();
    const service = new OpportunityService(createFakePrisma(), publisher);

    const opp = await service.create(ctx, { name: 'Big Deal', amount: 1000 });
    publisher.published.length = 0;

    await service.update(ctx, opp.id, { stage: 'closed_won' });

    expect(publisher.published.map((e) => e.topic)).toContain(EventTopics.OPPORTUNITY_WON);
  });

  it('publishes opportunity.lost when stage transitions to closed_lost', async () => {
    const publisher = new RecordingPublisher();
    const service = new OpportunityService(createFakePrisma(), publisher);

    const opp = await service.create(ctx, { name: 'Big Deal', amount: 1000 });
    publisher.published.length = 0;

    await service.update(ctx, opp.id, { stage: 'closed_lost' });

    expect(publisher.published.map((e) => e.topic)).toContain(EventTopics.OPPORTUNITY_LOST);
  });
});
