import { WILDCARD_PERMISSION } from './permissions';

// =============================================================================
// RBAC — pure authorization logic (no I/O, easily unit-tested).
// =============================================================================

/**
 * Expand a set of granted permissions, honouring the `*:*` wildcard.
 */
export function hasWildcard(granted: readonly string[]): boolean {
  return granted.includes(WILDCARD_PERMISSION);
}

/**
 * Check whether the granted permissions satisfy a single required permission.
 * Supports the global wildcard (`*:*`) and resource wildcard (`resource:*`).
 */
export function permissionSatisfied(
  granted: readonly string[],
  required: string,
): boolean {
  if (hasWildcard(granted)) return true;
  if (granted.includes(required)) return true;

  const [resource] = required.split(':');
  return granted.includes(`${resource}:*`);
}

/**
 * Check whether ALL required permissions are satisfied (logical AND).
 */
export function hasAllPermissions(
  granted: readonly string[],
  required: readonly string[],
): boolean {
  return required.every((perm) => permissionSatisfied(granted, perm));
}

/**
 * Check whether ANY of the required permissions are satisfied (logical OR).
 */
export function hasAnyPermission(
  granted: readonly string[],
  required: readonly string[],
): boolean {
  return required.some((perm) => permissionSatisfied(granted, perm));
}

/**
 * Check whether the subject has any of the required roles.
 */
export function hasAnyRole(
  granted: readonly string[],
  required: readonly string[],
): boolean {
  return required.some((role) => granted.includes(role));
}
