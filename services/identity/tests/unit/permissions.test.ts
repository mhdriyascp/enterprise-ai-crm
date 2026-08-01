import { describe, expect, it } from 'vitest';

import {
  ALL_PERMISSION_KEYS,
  PERMISSIONS,
  SYSTEM_ROLES,
  WILDCARD_PERMISSION,
  permissionKey,
} from '../../src/domain/permissions';

describe('permission catalog', () => {
  it('produces resource:action keys', () => {
    expect(permissionKey('customer', 'read')).toBe('customer:read');
  });

  it('has unique permission definitions', () => {
    const keys = PERMISSIONS.map((p) => permissionKey(p.resource, p.action));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('exposes every key via ALL_PERMISSION_KEYS', () => {
    expect(ALL_PERMISSION_KEYS).toContain('user:create');
    expect(ALL_PERMISSION_KEYS).toContain('audit:read');
    expect(ALL_PERMISSION_KEYS.length).toBe(PERMISSIONS.length);
  });

  it('defines the four system roles', () => {
    const names = SYSTEM_ROLES.map((r) => r.name);
    expect(names).toEqual(['admin', 'manager', 'member', 'viewer']);
  });

  it('grants admin the global wildcard', () => {
    const admin = SYSTEM_ROLES.find((r) => r.name === 'admin');
    expect(admin?.permissions).toEqual([WILDCARD_PERMISSION]);
  });

  it('grants viewer read-only permissions only', () => {
    const viewer = SYSTEM_ROLES.find((r) => r.name === 'viewer');
    expect(viewer?.permissions.every((p) => p.endsWith(':read'))).toBe(true);
  });
});
