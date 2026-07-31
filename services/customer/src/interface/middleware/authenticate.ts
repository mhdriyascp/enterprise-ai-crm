import type { FastifyReply, FastifyRequest } from 'fastify';

import { UnauthorizedError } from '@crm/common';
import { extractBearerToken, verifyToken, type JwtPayload } from '@crm/auth';

// =============================================================================
// Authentication middleware.
//
// Requests reaching this service have already passed JWT validation at the Kong
// gateway. The service re-verifies the bearer token (defence in depth) and
// derives the tenant/user context from its claims.
// =============================================================================

export interface AuthPrincipal {
  userId: string;
  tenantId: string;
  email?: string;
  roles: string[];
  permissions: string[];
}

declare module 'fastify' {
  interface FastifyRequest {
    principal?: AuthPrincipal;
  }
}

export interface AuthDeps {
  secret: string;
  issuer: string;
}

export function createAuthenticate(deps: AuthDeps) {
  return async function authenticate(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
    const token = extractBearerToken(request.headers.authorization);
    if (!token) {
      throw new UnauthorizedError('Missing bearer token.');
    }

    let payload: JwtPayload;
    try {
      payload = verifyToken(token, { secret: deps.secret, issuer: deps.issuer });
    } catch {
      throw new UnauthorizedError('Invalid or expired token.');
    }

    if (!payload.tenantId) {
      throw new UnauthorizedError('Token is missing the tenant claim.');
    }

    request.principal = {
      userId: payload.sub,
      tenantId: payload.tenantId,
      email: payload.email,
      roles: payload.roles ?? [],
      permissions: payload.permissions ?? [],
    };
  };
}

/** Extract the authenticated principal or throw if authentication did not run. */
export function requirePrincipal(request: FastifyRequest): AuthPrincipal {
  if (!request.principal) throw new UnauthorizedError();
  return request.principal;
}
