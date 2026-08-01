import { randomBytes } from 'crypto';

import jwt from 'jsonwebtoken';

import type { JwtPayload } from '@crm/types';

import { TokenInvalidError } from '../../domain/errors';

// =============================================================================
// Token Service — issues and verifies JWT access tokens and opaque refresh
// tokens.
//
// Access tokens are stateless JWTs carrying roles + permissions. Refresh tokens
// are high-entropy opaque strings; only their SHA-256 hash is persisted so a
// database leak does not expose usable tokens.
// =============================================================================

export interface TokenServiceOptions {
  secret: string;
  issuer: string;
  accessTokenTtl: number; // seconds
  refreshTokenTtl: number; // seconds
}

export interface AccessTokenClaims {
  sub: string;
  tenantId: string;
  email: string;
  roles: string[];
  permissions: string[];
}

export class TokenService {
  constructor(private readonly options: TokenServiceOptions) {}

  /** Sign a short-lived access token. */
  signAccessToken(claims: AccessTokenClaims): { token: string; expiresIn: number } {
    const token = jwt.sign(
      {
        tenantId: claims.tenantId,
        email: claims.email,
        roles: claims.roles,
        permissions: claims.permissions,
      },
      this.options.secret,
      {
        subject: claims.sub,
        issuer: this.options.issuer,
        expiresIn: this.options.accessTokenTtl,
      },
    );

    return { token, expiresIn: this.options.accessTokenTtl };
  }

  /** Verify an access token, returning its decoded payload. */
  verifyAccessToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.options.secret, {
        issuer: this.options.issuer,
      }) as JwtPayload;
    } catch {
      throw new TokenInvalidError();
    }
  }

  /** Generate a new opaque refresh token plus its expiry timestamp. */
  generateRefreshToken(): { token: string; expiresAt: Date } {
    const token = randomBytes(48).toString('base64url');
    const expiresAt = new Date(Date.now() + this.options.refreshTokenTtl * 1000);
    return { token, expiresAt };
  }
}
