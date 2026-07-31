import { describe, expect, it } from 'vitest';

import {
  CreateIntegrationSchema,
  ListIntegrationsQuerySchema,
  UpdateIntegrationSchema,
} from '../../src/interface/dtos';

// =============================================================================
// Integration DTO validation tests (pure — no database required).
// =============================================================================

describe('CreateIntegrationSchema', () => {
  it('accepts a valid payload', () => {
    const result = CreateIntegrationSchema.safeParse({ provider: 'slack', name: 'Team Slack' });
    expect(result.success).toBe(true);
  });

  it('rejects an unknown provider', () => {
    const result = CreateIntegrationSchema.safeParse({ provider: 'myspace', name: 'x' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty name', () => {
    const result = CreateIntegrationSchema.safeParse({ provider: 'stripe', name: '' });
    expect(result.success).toBe(false);
  });
});

describe('UpdateIntegrationSchema', () => {
  it('requires at least one field', () => {
    expect(UpdateIntegrationSchema.safeParse({}).success).toBe(false);
  });

  it('accepts a partial update', () => {
    expect(UpdateIntegrationSchema.safeParse({ name: 'Renamed' }).success).toBe(true);
  });
});

describe('ListIntegrationsQuerySchema', () => {
  it('applies default pagination', () => {
    const result = ListIntegrationsQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('caps the limit at 100', () => {
    expect(ListIntegrationsQuerySchema.safeParse({ limit: '500' }).success).toBe(false);
  });

  it('rejects an unknown status filter', () => {
    expect(ListIntegrationsQuerySchema.safeParse({ status: 'paused' }).success).toBe(false);
  });
});
