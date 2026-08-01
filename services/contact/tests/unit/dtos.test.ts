import { describe, expect, it } from 'vitest';

import {
  CreateContactSchema,
  ListContactsQuerySchema,
  UpdateContactSchema,
} from '../../src/interface/dtos';

describe('CreateContactSchema', () => {
  it('accepts a minimal valid payload', () => {
    const result = CreateContactSchema.safeParse({ firstName: 'Ada', lastName: 'Lovelace' });
    expect(result.success).toBe(true);
  });

  it('requires first and last name', () => {
    expect(CreateContactSchema.safeParse({ firstName: 'Ada' }).success).toBe(false);
  });

  it('rejects an invalid customerId', () => {
    const result = CreateContactSchema.safeParse({
      firstName: 'Ada',
      lastName: 'Lovelace',
      customerId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });
});

describe('UpdateContactSchema', () => {
  it('requires at least one field', () => {
    expect(UpdateContactSchema.safeParse({}).success).toBe(false);
  });

  it('accepts a partial update', () => {
    expect(UpdateContactSchema.safeParse({ isPrimary: true }).success).toBe(true);
  });
});

describe('ListContactsQuerySchema', () => {
  it('applies default pagination', () => {
    const result = ListContactsQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });
});
