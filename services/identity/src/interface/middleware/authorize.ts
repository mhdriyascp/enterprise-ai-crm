import type { FastifyReply, FastifyRequest } from 'fastify';

import { ForbiddenError, UnauthorizedError } from '@crm/common';

import { hasAllPermissions, hasAnyPermission } from '../../domain/rbac';

// =============================================================================
// Authorization middleware — RBAC permission checks.
// Must run after `authenticate` has populated `request.principal`.
// =============================================================================

/** Require ALL of the given permissions (logical AND). */
export function requirePermissions(...required: string[]) {
  return async function authorize(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
    const principal = request.principal;
    if (!principal) throw new UnauthorizedError();

    if (!hasAllPermissions(principal.permissions, required)) {
      throw new ForbiddenError(`Missing required permission(s): ${required.join(', ')}`);
    }
  };
}

/** Require ANY of the given permissions (logical OR). */
export function requireAnyPermission(...required: string[]) {
  return async function authorize(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
    const principal = request.principal;
    if (!principal) throw new UnauthorizedError();

    if (!hasAnyPermission(principal.permissions, required)) {
      throw new ForbiddenError(`Requires one of: ${required.join(', ')}`);
    }
  };
}
