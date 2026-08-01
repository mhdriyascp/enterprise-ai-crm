import { describe, expect, it } from 'vitest';

import {
  CreateLeadSchema,
  ListLeadsQuerySchema,
  UpdateLeadSchema,
} from '../../src/interface/dtos';

describe('CreateLeadSchema', () => {
  it('accepts a minimal valid payload', () => {
    const result = CreateLeadSchema.safeParse({ firstName: 'Ada', lastName: 'Lovelace' });
    expect(result.success).toBe(true);
  });

  it('requires first and last name', () => {
    expect(CreateLeadSchema.safeParse({ lastName: 'Lovelace' }).success).toBe(false);
  });

  it('rejects a score above 100', () => {
    const result = CreateLeadSchema.safeParse({
      firstName: 'Ada',
      lastName: 'Lovelace',
      score: 101,
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid source', () => {
    const result = CreateLeadSchema.safeParse({
      firstName: 'Ada',
      lastName: 'Lovelace',
      source: 'telepathy',
    });
    expect(result.success).toBe(false);
  });
});

describe('UpdateLeadSchema', () => {
  it('requires at least one field', () => {
    expect(UpdateLeadSchema.safeParse({}).success).toBe(false);
  });

  it('accepts a partial update', () => {
    expect(UpdateLeadSchema.safeParse({ status: 'qualified' }).success).toBe(true);
  });
});

describe('ListLeadsQuerySchema', () => {
  it('applies default pagination', () => {
    const result = ListLeadsQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });
});
