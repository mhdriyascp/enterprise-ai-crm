import type { PrismaClient, Prisma } from '@prisma/client';

import { ConflictError, NotFoundError } from '@crm/common';

import { permissionKey } from '../../domain/permissions';

import type { PasswordService } from './password.service';

// =============================================================================
// User Service — user CRUD and role membership.
// =============================================================================

export interface CreateUserInput {
  tenantId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationId?: string | null;
  roleIds?: string[];
}

export interface EffectiveClaims {
  roles: string[];
  permissions: string[];
}

export class UserService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly passwords: PasswordService,
  ) {}

  async create(input: CreateUserInput) {
    const existing = await this.prisma.user.findFirst({
      where: { tenantId: input.tenantId, email: input.email, deletedAt: null },
    });
    if (existing) {
      throw new ConflictError(`A user with email "${input.email}" already exists.`);
    }

    const passwordHash = await this.passwords.hash(input.password);

    return this.prisma.user.create({
      data: {
        tenantId: input.tenantId,
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        organizationId: input.organizationId ?? null,
        roles: input.roleIds?.length
          ? { create: input.roleIds.map((roleId) => ({ roleId })) }
          : undefined,
      },
      select: this.publicSelect(),
    });
  }

  async findById(tenantId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: this.publicSelect(),
    });
    if (!user) throw new NotFoundError('User', id);
    return user;
  }

  async list(tenantId: string, params: { page: number; limit: number; search?: string }) {
    const where: Prisma.UserWhereInput = {
      tenantId,
      deletedAt: null,
      ...(params.search
        ? {
            OR: [
              { email: { contains: params.search, mode: 'insensitive' } },
              { firstName: { contains: params.search, mode: 'insensitive' } },
              { lastName: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: this.publicSelect(),
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.user.count({ where }),
    ]);
    return { data, total };
  }

  async update(
    tenantId: string,
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      status?: 'active' | 'inactive' | 'pending' | 'suspended';
      organizationId?: string | null;
    },
  ) {
    await this.findById(tenantId, id);
    return this.prisma.user.update({ where: { id }, data, select: this.publicSelect() });
  }

  async softDelete(tenantId: string, id: string) {
    await this.findById(tenantId, id);
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'inactive' },
    });
  }

  /** Replace a user's role assignments. */
  async setRoles(tenantId: string, id: string, roleIds: string[]) {
    await this.findById(tenantId, id);

    // Ensure all roles belong to the same tenant.
    const roles = await this.prisma.role.findMany({
      where: { id: { in: roleIds }, tenantId },
      select: { id: true },
    });
    if (roles.length !== roleIds.length) {
      throw new NotFoundError('Role', 'one or more supplied role IDs');
    }

    await this.prisma.$transaction([
      this.prisma.userRole.deleteMany({ where: { userId: id } }),
      this.prisma.userRole.createMany({
        data: roleIds.map((roleId) => ({ userId: id, roleId })),
      }),
    ]);

    return this.findById(tenantId, id);
  }

  /**
   * Resolve the flattened role names and permission keys granted to a user
   * through their role assignments.
   */
  async getEffectiveClaims(userId: string): Promise<EffectiveClaims> {
    const roles = await this.prisma.role.findMany({
      where: { users: { some: { userId } } },
      include: { permissions: { include: { permission: true } } },
    });

    const roleNames = new Set<string>();
    const permissions = new Set<string>();

    for (const role of roles) {
      roleNames.add(role.name);
      for (const rp of role.permissions) {
        permissions.add(permissionKey(rp.permission.resource, rp.permission.action));
      }
    }

    return { roles: [...roleNames], permissions: [...permissions] };
  }

  private publicSelect() {
    return {
      id: true,
      tenantId: true,
      organizationId: true,
      email: true,
      firstName: true,
      lastName: true,
      status: true,
      emailVerified: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    } satisfies Prisma.UserSelect;
  }
}
