import { describe, expect, it } from 'vitest';

import { DeviceRegistry, type MobilePrincipal } from '../../src/application/services/mobile.service';

const principal: MobilePrincipal = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  email: 'rep@example.com',
  roles: ['sales-rep'],
};

describe('DeviceRegistry', () => {
  it('registers a device and lists it for the user', () => {
    const registry = new DeviceRegistry();
    const record = registry.register(principal, { token: 'abc', platform: 'ios' });

    expect(record.userId).toBe('user-1');
    expect(record.platform).toBe('ios');
    expect(registry.listForUser('user-1')).toHaveLength(1);
  });

  it('deduplicates repeated registrations of the same token', () => {
    const registry = new DeviceRegistry();
    registry.register(principal, { token: 'abc', platform: 'android' });
    registry.register(principal, { token: 'abc', platform: 'android' });

    expect(registry.listForUser('user-1')).toHaveLength(1);
  });

  it('unregisters a device by token', () => {
    const registry = new DeviceRegistry();
    registry.register(principal, { token: 'abc', platform: 'ios' });

    expect(registry.unregister(principal, 'abc')).toBe(true);
    expect(registry.listForUser('user-1')).toHaveLength(0);
  });

  it('scopes device lists per user', () => {
    const registry = new DeviceRegistry();
    registry.register(principal, { token: 'abc', platform: 'ios' });
    registry.register(
      { ...principal, userId: 'user-2' },
      { token: 'xyz', platform: 'android' },
    );

    expect(registry.listForUser('user-1')).toHaveLength(1);
    expect(registry.listForUser('user-2')).toHaveLength(1);
  });
});
