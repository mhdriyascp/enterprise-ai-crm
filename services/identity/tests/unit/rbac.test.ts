import { describe, expect, it } from 'vitest';

import {
  hasAllPermissions,
  hasAnyPermission,
  hasAnyRole,
  hasWildcard,
  permissionSatisfied,
} from '../../src/domain/rbac';

describe('rbac', () => {
  describe('permissionSatisfied', () => {
    it('matches an exact permission', () => {
      expect(permissionSatisfied(['customer:read'], 'customer:read')).toBe(true);
    });

    it('rejects a missing permission', () => {
      expect(permissionSatisfied(['customer:read'], 'customer:delete')).toBe(false);
    });

    it('honours the global wildcard', () => {
      expect(permissionSatisfied(['*:*'], 'anything:goes')).toBe(true);
    });

    it('honours a resource wildcard', () => {
      expect(permissionSatisfied(['customer:*'], 'customer:update')).toBe(true);
      expect(permissionSatisfied(['customer:*'], 'lead:update')).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('requires every permission', () => {
      const granted = ['user:read', 'user:update'];
      expect(hasAllPermissions(granted, ['user:read', 'user:update'])).toBe(true);
      expect(hasAllPermissions(granted, ['user:read', 'user:delete'])).toBe(false);
    });

    it('passes with wildcard for all', () => {
      expect(hasAllPermissions(['*:*'], ['a:b', 'c:d'])).toBe(true);
    });
  });

  describe('hasAnyPermission', () => {
    it('passes when at least one matches', () => {
      expect(hasAnyPermission(['lead:read'], ['lead:read', 'lead:delete'])).toBe(true);
      expect(hasAnyPermission(['lead:read'], ['user:read', 'user:delete'])).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    it('checks role membership', () => {
      expect(hasAnyRole(['admin'], ['admin', 'manager'])).toBe(true);
      expect(hasAnyRole(['viewer'], ['admin'])).toBe(false);
    });
  });

  describe('hasWildcard', () => {
    it('detects the global wildcard', () => {
      expect(hasWildcard(['*:*'])).toBe(true);
      expect(hasWildcard(['customer:read'])).toBe(false);
    });
  });
});
