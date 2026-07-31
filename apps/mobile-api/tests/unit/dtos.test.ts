import { describe, expect, it } from 'vitest';

import { RegisterDeviceSchema, SyncQuerySchema } from '../../src/interface/dtos';

describe('mobile DTO schemas', () => {
  it('accepts a valid device registration', () => {
    const parsed = RegisterDeviceSchema.parse({ token: 'abc', platform: 'ios' });
    expect(parsed.platform).toBe('ios');
  });

  it('rejects an unknown platform', () => {
    expect(() => RegisterDeviceSchema.parse({ token: 'abc', platform: 'web' })).toThrow();
  });

  it('defaults the sync limit', () => {
    const parsed = SyncQuerySchema.parse({});
    expect(parsed.limit).toBe(20);
  });

  it('rejects a non-ISO since timestamp', () => {
    expect(() => SyncQuerySchema.parse({ since: 'yesterday' })).toThrow();
  });
});
