import { describe, expect, it } from 'vitest';

import {
  CreateOrganizationSchema,
  ListOrganizationsQuerySchema,
  UpdateOrganizationSchema,
} from '../../src/interface/dtos';

describe('CreateOrganizationSchema', () => {
  it('accepts a minimal valid payload', () => {
    const result = CreateOrganizationSchema.safeParse({ name: 'Acme', slug: 'acme' });
    expect(result.success).toBe(true);
  });

  it('requires a name and slug', () => {
    expect(CreateOrganizationSchema.safeParse({ name: 'Acme' }).success).toBe(false);
  });

  it('rejects an invalid slug', () => {
    expect(
      CreateOrganizationSchema.safeParse({ name: 'Acme', slug: 'Acme Corp!' }).success,
    ).toBe(false);
  });

  it('rejects an invalid website URL', () => {
    const result = CreateOrganizationSchema.safeParse({
      name: 'Acme',
      slug: 'acme',
      website: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });
});

describe('UpdateOrganizationSchema', () => {
  it('requires at least one field', () => {
    expect(UpdateOrganizationSchema.safeParse({}).success).toBe(false);
  });

  it('accepts a partial update', () => {
    expect(UpdateOrganizationSchema.safeParse({ status: 'archived' }).success).toBe(true);
  });
});

describe('ListOrganizationsQuerySchema', () => {
  it('applies default pagination', () => {
    const result = ListOrganizationsQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });
});
