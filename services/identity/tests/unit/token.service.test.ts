import { describe, expect, it } from 'vitest';

import { TokenService } from '../../src/application/services/token.service';
import { TokenInvalidError } from '../../src/domain/errors';

describe('TokenService', () => {
  const service = new TokenService({
    secret: 'test_secret_that_is_at_least_32_chars_long',
    issuer: 'http://localhost/test',
    accessTokenTtl: 900,
    refreshTokenTtl: 3600,
  });

  const claims = {
    sub: '11111111-1111-1111-1111-111111111111',
    tenantId: '22222222-2222-2222-2222-222222222222',
    email: 'user@example.com',
    roles: ['admin'],
    permissions: ['*:*'],
  };

  it('signs and verifies an access token round-trip', () => {
    const { token, expiresIn } = service.signAccessToken(claims);
    expect(expiresIn).toBe(900);

    const payload = service.verifyAccessToken(token);
    expect(payload.sub).toBe(claims.sub);
    expect(payload.tenantId).toBe(claims.tenantId);
    expect(payload.email).toBe(claims.email);
    expect(payload.roles).toEqual(['admin']);
    expect(payload.permissions).toEqual(['*:*']);
  });

  it('rejects a tampered/invalid token', () => {
    expect(() => service.verifyAccessToken('not.a.jwt')).toThrow(TokenInvalidError);
  });

  it('rejects a token signed with a different secret', () => {
    const other = new TokenService({
      secret: 'a_completely_different_secret_value_32c!',
      issuer: 'http://localhost/test',
      accessTokenTtl: 900,
      refreshTokenTtl: 3600,
    });
    const { token } = other.signAccessToken(claims);
    expect(() => service.verifyAccessToken(token)).toThrow(TokenInvalidError);
  });

  it('generates opaque refresh tokens with a future expiry', () => {
    const { token, expiresAt } = service.generateRefreshToken();
    expect(token.length).toBeGreaterThan(20);
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  });
});
