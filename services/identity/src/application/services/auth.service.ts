import type { PrismaClient } from '@prisma/client';

import { sha256 } from '@crm/common';

import { InvalidCredentialsError, TokenInvalidError, UserInactiveError } from '../../domain/errors';

import type { PasswordService } from './password.service';
import type { TenantService } from './tenant.service';
import type { TokenService } from './token.service';
import type { UserService } from './user.service';

// =============================================================================
// Auth Service — registration, login, token refresh (with rotation), logout.
// =============================================================================

export interface RegisterInput {
  tenantName: string;
  tenantSlug: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginInput {
  tenantSlug: string;
  email: string;
  password: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

export class AuthService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
    private readonly users: UserService,
    private readonly tenants: TenantService,
  ) {}

  /**
   * Register a brand-new tenant and its owner user (assigned the admin role).
   */
  async register(input: RegisterInput): Promise<{ tenantId: string; userId: string } & TokenPair> {
    const tenant = await this.tenants.create({
      name: input.tenantName,
      slug: input.tenantSlug,
    });

    const adminRole = await this.prisma.role.findFirst({
      where: { tenantId: tenant.id, name: 'admin' },
      select: { id: true },
    });

    const user = await this.users.create({
      tenantId: tenant.id,
      email: input.email,
      password: input.password,
      firstName: input.firstName,
      lastName: input.lastName,
      roleIds: adminRole ? [adminRole.id] : [],
    });

    const pair = await this.issueTokens(tenant.id, user.id, user.email);
    return { tenantId: tenant.id, userId: user.id, ...pair };
  }

  async login(input: LoginInput): Promise<{ userId: string } & TokenPair> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: input.tenantSlug },
      select: { id: true, status: true },
    });
    if (!tenant || tenant.status !== 'active') {
      throw new InvalidCredentialsError();
    }

    const user = await this.prisma.user.findFirst({
      where: { tenantId: tenant.id, email: input.email, deletedAt: null },
      select: { id: true, email: true, passwordHash: true, status: true },
    });
    if (!user) throw new InvalidCredentialsError();

    const valid = await this.passwords.verify(input.password, user.passwordHash);
    if (!valid) throw new InvalidCredentialsError();
    if (user.status !== 'active') throw new UserInactiveError();

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const pair = await this.issueTokens(tenant.id, user.id, user.email);
    return { userId: user.id, ...pair };
  }

  /**
   * Exchange a refresh token for a new token pair, rotating (revoking) the old
   * one. Reuse of a revoked/expired token is rejected.
   */
  async refresh(refreshToken: string): Promise<TokenPair> {
    const tokenHash = sha256(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!stored || stored.revokedAt || stored.expiresAt.getTime() < Date.now()) {
      throw new TokenInvalidError('Refresh token is invalid or expired.');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: stored.userId, deletedAt: null },
      select: { id: true, email: true, status: true },
    });
    if (!user || user.status !== 'active') {
      throw new TokenInvalidError();
    }

    // Rotate: revoke the presented token before issuing a new pair.
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(stored.tenantId, user.id, user.email);
  }

  /** Revoke a specific refresh token (single-session logout). */
  async logout(refreshToken: string): Promise<void> {
    const tokenHash = sha256(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** Revoke every active refresh token for a user (global logout). */
  async logoutAll(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async issueTokens(
    tenantId: string,
    userId: string,
    email: string,
  ): Promise<TokenPair> {
    const claims = await this.users.getEffectiveClaims(userId);

    const { token: accessToken, expiresIn } = this.tokens.signAccessToken({
      sub: userId,
      tenantId,
      email,
      roles: claims.roles,
      permissions: claims.permissions,
    });

    const { token: refreshToken, expiresAt } = this.tokens.generateRefreshToken();
    await this.prisma.refreshToken.create({
      data: { tenantId, userId, tokenHash: sha256(refreshToken), expiresAt },
    });

    return { accessToken, refreshToken, tokenType: 'Bearer', expiresIn };
  }
}
