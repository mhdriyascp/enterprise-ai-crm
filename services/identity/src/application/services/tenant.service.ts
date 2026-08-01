import type { PrismaClient } from '@prisma/client';

import { ConflictError, NotFoundError } from '@crm/common';

import {
  PERMISSIONS,
  SYSTEM_ROLES,
  WILDCARD_PERMISSION,
  permissionKey,
} from '../../domain/permissions';

// =============================================================================
// Tenant Service — tenant lifecycle plus RBAC bootstrapping.
// =============================================================================

export interface CreateTenantInput {
  name: string;
  slug: string;
  plan?: 'free' | 'starter' | 'professional' | 'enterprise';
}

export class TenantService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Ensure the global permission catalog exists. Idempotent — safe to call on
   * every tenant creation and on startup.
   */
  async syncPermissions(): Promise<void> {
    await this.prisma.$transaction(
      PERMISSIONS.map((p) =>
        this.prisma.permission.upsert({
          where: { resource_action: { resource: p.resource, action: p.action } },
          create: { resource: p.resource, action: p.action, description: p.description },
          update: { description: p.description },
        }),
      ),
    );
  }

  /**
   * Create a tenant together with its seeded system roles (admin, manager,
   * member, viewer) and their permission assignments.
   */
  async create(input: CreateTenantInput) {
    const existing = await this.prisma.tenant.findUnique({ where: { slug: input.slug } });
    if (existing) {
      throw new ConflictError(`A tenant with slug "${input.slug}" already exists.`);
    }

    await this.syncPermissions();

    const permissions = await this.prisma.permission.findMany();
    const permByKey = new Map(permissions.map((p) => [permissionKey(p.resource, p.action), p.id]));

    return this.prisma.tenant.create({
      data: {
        name: input.name,
        slug: input.slug,
        plan: input.plan ?? 'free',
        roles: {
          create: SYSTEM_ROLES.map((role) => ({
            name: role.name,
            description: role.description,
            isSystem: true,
            permissions: {
              create: this.resolveRolePermissionIds(role.permissions, permByKey).map(
                (permissionId) => ({ permissionId }),
              ),
            },
          })),
        },
      },
      include: { roles: true },
    });
  }

  private resolveRolePermissionIds(
    permissionKeys: string[],
    permByKey: Map<string, string>,
  ): string[] {
    if (permissionKeys.includes(WILDCARD_PERMISSION)) {
      return [...permByKey.values()];
    }
    return permissionKeys
      .map((key) => permByKey.get(key))
      .filter((id): id is string => Boolean(id));
  }

  async findById(id: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id, deletedAt: null },
    });
    if (!tenant) throw new NotFoundError('Tenant', id);
    return tenant;
  }

  async list(params: { page: number; limit: number }) {
    const where = { deletedAt: null };
    const [data, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.tenant.count({ where }),
    ]);
    return { data, total };
  }

  async update(
    id: string,
    data: { name?: string; plan?: CreateTenantInput['plan']; status?: 'active' | 'suspended' | 'cancelled' },
  ) {
    await this.findById(id);
    return this.prisma.tenant.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    await this.findById(id);
    return this.prisma.tenant.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'cancelled' },
    });
  }
}
