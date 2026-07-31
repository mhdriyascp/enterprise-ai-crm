import type { FastifyReply, FastifyRequest } from 'fastify';

import { UnauthorizedError } from '@crm/common';
import { extractBearerToken, verifyToken, type JwtPayload } from '@crm/auth';

// =============================================================================
// Authentication middleware for the AI Platform.
//
// Supports two callers:
//  1. End-user requests via the gateway carrying a JWT bearer token.
//  2. Internal service-to-service calls (e.g. from `@crm/ai-sdk`) that have
//     already been authenticated upstream and forward tenant/user context via
//     `X-Tenant-ID` / `X-User-ID` headers.
// A bearer token, when present, always takes precedence.
// =============================================================================

export interface AiPrincipal {
  userId?: string;
  tenantId: string;
  email?: string;
  roles: string[];
  permissions: string[];
}

declare module 'fastify' {
  interface FastifyRequest {
    principal?: AiPrincipal;
  }
}

export interface AuthDeps {
  secret: string;
  issuer: string;
}

export function createAuthenticate(deps: AuthDeps) {
  return async function authenticate(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
    const token = extractBearerToken(request.headers.authorization);

    if (token) {
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
      return;
    }

    // Fall back to trusted internal headers.
    const tenantId = headerValue(request.headers['x-tenant-id']);
    if (tenantId) {
      request.principal = {
        userId: headerValue(request.headers['x-user-id']),
        tenantId,
        roles: [],
        permissions: [],
      };
      return;
    }

    throw new UnauthorizedError('Missing bearer token or tenant context.');
  };
}

function headerValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function requirePrincipal(request: FastifyRequest): AiPrincipal {
  if (!request.principal) throw new UnauthorizedError();
  return request.principal;
}
