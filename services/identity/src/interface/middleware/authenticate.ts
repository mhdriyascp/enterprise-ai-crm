import type { FastifyReply, FastifyRequest } from 'fastify';

import { UnauthorizedError } from '@crm/common';
import { extractBearerToken } from '@crm/auth';

import type { ApiKeyService } from '../../application/services/apikey.service';
import type { TokenService } from '../../application/services/token.service';

// =============================================================================
// Authentication middleware — supports ****** and X-API-Key credentials.
// =============================================================================

export interface AuthPrincipal {
  userId?: string;
  tenantId: string;
  email?: string;
  roles: string[];
  permissions: string[];
  authType: 'jwt' | 'apikey';
}

declare module 'fastify' {
  interface FastifyRequest {
    principal?: AuthPrincipal;
  }
}

export interface AuthDeps {
  tokens: TokenService;
  apiKeys: ApiKeyService;
}

/**
 * Build a Fastify preHandler that populates `request.principal`.
 * Rejects the request with 401 when no valid credential is present.
 */
export function createAuthenticate(deps: AuthDeps) {
  return async function authenticate(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
    const apiKeyHeader = request.headers['x-api-key'];
    if (typeof apiKeyHeader === 'string' && apiKeyHeader.length > 0) {
      const ctx = await deps.apiKeys.verify(apiKeyHeader);
      request.principal = {
        tenantId: ctx.tenantId,
        roles: [],
        permissions: ctx.scopes,
        authType: 'apikey',
      };
      return;
    }

    const token = extractBearerToken(request.headers.authorization);
    if (!token) {
      throw new UnauthorizedError('Missing bearer token or API key.');
    }

    const payload = deps.tokens.verifyAccessToken(token);
    request.principal = {
      userId: payload.sub,
      tenantId: payload.tenantId,
      email: payload.email,
      roles: payload.roles ?? [],
      permissions: payload.permissions ?? [],
      authType: 'jwt',
    };
  };
}
