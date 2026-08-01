import jwt from 'jsonwebtoken';

import type { JwtPayload } from '@crm/types';

// =============================================================================
// @crm/auth — JWT Utilities
// =============================================================================

export interface TokenOptions {
  secret: string;
  issuer: string;
  expiresIn?: number; // seconds
}

/**
 * Verify a JWT access token and return the decoded payload.
 */
export function verifyToken(token: string, options: TokenOptions): JwtPayload {
  const decoded = jwt.verify(token, options.secret, {
    issuer: options.issuer,
  }) as JwtPayload;

  return decoded;
}

/**
 * Decode a JWT without verification (e.g., for logging purposes).
 * NEVER use this for authorization decisions.
 */
export function decodeTokenUnsafe(token: string): JwtPayload | null {
  return jwt.decode(token) as JwtPayload | null;
}

/**
 * Check if a JWT token is expired.
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeTokenUnsafe(token);
  if (!decoded) return true;
  return decoded.exp * 1000 < Date.now();
}

/**
 * Extract the ****** from an Authorization header.
 */
export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.substring(7);
}

/**
 * Check if a user has a required permission.
 */
export function hasPermission(payload: JwtPayload, permission: string): boolean {
  return payload.permissions.includes(permission);
}

/**
 * Check if a user has any of the required roles.
 */
export function hasRole(payload: JwtPayload, ...roles: string[]): boolean {
  return roles.some((role) => payload.roles.includes(role));
}

export type { JwtPayload };
