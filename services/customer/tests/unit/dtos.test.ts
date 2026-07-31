import { describe, expect, it } from 'vitest';

import {
  CreateCustomerSchema,
  ListCustomersQuerySchema,
  UpdateCustomerSchema,
} from '../../src/interface/dtos';

// =============================================================================
// Customer DTO validation tests (pure — no database required).
// =============================================================================

describe('CreateCustomerSchema', () => {
  it('accepts a minimal valid payload', () => {
    const result = CreateCustomerSchema.safeParse({ name: 'Acme Inc' });
    expect(result.success).toBe(true);
  });

  it('rejects an empty name', () => {
    const result = CreateCustomerSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid status', () => {
    const result = CreateCustomerSchema.safeParse({ name: 'Acme', status: 'unknown' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid email', () => {
    const result = CreateCustomerSchema.safeParse({ name: 'Acme', email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('rejects a negative revenue', () => {
    const result = CreateCustomerSchema.safeParse({ name: 'Acme', revenue: -1 });
    expect(result.success).toBe(false);
  });
});

describe('UpdateCustomerSchema', () => {
  it('requires at least one field', () => {
    const result = UpdateCustomerSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('accepts a partial update', () => {
    const result = UpdateCustomerSchema.safeParse({ status: 'active' });
    expect(result.success).toBe(true);
  });
});

describe('ListCustomersQuerySchema', () => {
  it('applies default pagination', () => {
    const result = ListCustomersQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('coerces numeric query strings', () => {
    const result = ListCustomersQuerySchema.parse({ page: '2', limit: '50' });
    expect(result.page).toBe(2);
    expect(result.limit).toBe(50);
  });

  it('caps the limit at 100', () => {
    const result = ListCustomersQuerySchema.safeParse({ limit: '500' });
    expect(result.success).toBe(false);
  });
});
