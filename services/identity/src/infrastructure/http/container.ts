import type { PrismaClient } from '@prisma/client';

import type { Logger } from '@crm/logging';

import type { IdentityConfig } from '../../config';
import { ApiKeyService } from '../../application/services/apikey.service';
import { AuditService } from '../../application/services/audit.service';
import { AuthService } from '../../application/services/auth.service';
import { PasswordService } from '../../application/services/password.service';
import { PermissionService } from '../../application/services/permission.service';
import { RoleService } from '../../application/services/role.service';
import { TenantService } from '../../application/services/tenant.service';
import { TokenService } from '../../application/services/token.service';
import { UserService } from '../../application/services/user.service';

// =============================================================================
// Service container — wires application services from their dependencies.
// =============================================================================

export interface Container {
  passwords: PasswordService;
  tokens: TokenService;
  tenants: TenantService;
  users: UserService;
  roles: RoleService;
  permissions: PermissionService;
  apiKeys: ApiKeyService;
  audit: AuditService;
  auth: AuthService;
}

export function buildContainer(
  prisma: PrismaClient,
  config: IdentityConfig,
  logger: Logger,
): Container {
  const passwords = new PasswordService(config.BCRYPT_ROUNDS);
  const tokens = new TokenService({
    secret: config.JWT_SECRET,
    issuer: config.JWT_ISSUER,
    accessTokenTtl: config.JWT_ACCESS_TOKEN_TTL,
    refreshTokenTtl: config.JWT_REFRESH_TOKEN_TTL,
  });

  const tenants = new TenantService(prisma);
  const users = new UserService(prisma, passwords);
  const roles = new RoleService(prisma);
  const permissions = new PermissionService(prisma);
  const apiKeys = new ApiKeyService(prisma);
  const audit = new AuditService(prisma, logger);
  const auth = new AuthService(prisma, passwords, tokens, users, tenants);

  return { passwords, tokens, tenants, users, roles, permissions, apiKeys, audit, auth };
}
