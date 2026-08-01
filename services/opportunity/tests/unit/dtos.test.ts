import { describe, expect, it } from 'vitest';

import {
  CreateOpportunitySchema,
  ListOpportunitiesQuerySchema,
  UpdateOpportunitySchema,
} from '../../src/interface/dtos';

const VALID_CUSTOMER_ID = '11111111-1111-1111-1111-111111111111';

describe('CreateOpportunitySchema', () => {
  it('accepts a minimal valid payload', () => {
    const result = CreateOpportunitySchema.safeParse({
      name: 'Big Deal',
      customerId: VALID_CUSTOMER_ID,
    });
    expect(result.success).toBe(true);
  });

  it('requires a name and customerId', () => {
    expect(CreateOpportunitySchema.safeParse({ name: 'Big Deal' }).success).toBe(false);
  });

  it('rejects a negative amount', () => {
    const result = CreateOpportunitySchema.safeParse({
      name: 'Big Deal',
      customerId: VALID_CUSTOMER_ID,
      amount: -1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid stage', () => {
    const result = CreateOpportunitySchema.safeParse({
      name: 'Big Deal',
      customerId: VALID_CUSTOMER_ID,
      stage: 'won',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a non-ISO expectedCloseDate', () => {
    const result = CreateOpportunitySchema.safeParse({
      name: 'Big Deal',
      customerId: VALID_CUSTOMER_ID,
      expectedCloseDate: '2026-13-40',
    });
    expect(result.success).toBe(false);
  });
});

describe('UpdateOpportunitySchema', () => {
  it('requires at least one field', () => {
    expect(UpdateOpportunitySchema.safeParse({}).success).toBe(false);
  });

  it('accepts a partial update', () => {
    expect(UpdateOpportunitySchema.safeParse({ stage: 'closed_won' }).success).toBe(true);
  });
});

describe('ListOpportunitiesQuerySchema', () => {
  it('applies default pagination', () => {
    const result = ListOpportunitiesQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });
});
