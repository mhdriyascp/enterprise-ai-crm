import type { PrismaClient } from '@prisma/client';

import { ConflictError, ForbiddenError, NotFoundError } from '@crm/common';

// =============================================================================
// Role Service — tenant-scoped role management and permission assignment.
// =============================================================================

export class RoleService {
  constructor(private readonly prisma: PrismaClient) {}

  async create(tenantId: string, input: { name: string; description?: string; permissionIds?: string[] }) {
    const existing = await this.prisma.role.findFirst({
      where: { tenantId, name: input.name },
    });
    if (existing) throw new ConflictError(`A role named "${input.name}" already exists.`);

    return this.prisma.role.create({
      data: {
        tenantId,
        name: input.name,
        description: input.description,
        permissions: input.permissionIds?.length
          ? { create: input.permissionIds.map((permissionId) => ({ permissionId })) }
          : undefined,
      },
      include: this.include(),
    });
  }

  async findById(tenantId: string, id: string) {
    const role = await this.prisma.role.findFirst({
      where: { id, tenantId },
      include: this.include(),
    });
    if (!role) throw new NotFoundError('Role', id);
    return role;
  }

  async list(tenantId: string, params: { page: number; limit: number }) {
    const where = { tenantId };
    const [data, total] = await Promise.all([
      this.prisma.role.findMany({
        where,
        include: this.include(),
        orderBy: { createdAt: 'asc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.role.count({ where }),
    ]);
    return { data, total };
  }

  async update(tenantId: string, id: string, data: { name?: string; description?: string }) {
    const role = await this.findById(tenantId, id);
    if (role.isSystem && data.name) {
      throw new ForbiddenError('System roles cannot be renamed.');
    }
    return this.prisma.role.update({ where: { id }, data, include: this.include() });
  }

  /** Replace the permissions assigned to a role. */
  async setPermissions(tenantId: string, id: string, permissionIds: string[]) {
    await this.findById(tenantId, id);

    const permissions = await this.prisma.permission.findMany({
      where: { id: { in: permissionIds } },
      select: { id: true },
    });
    if (permissions.length !== permissionIds.length) {
      throw new NotFoundError('Permission', 'one or more supplied permission IDs');
    }

    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId: id } }),
      this.prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId: id, permissionId })),
      }),
    ]);

    return this.findById(tenantId, id);
  }

  async delete(tenantId: string, id: string) {
    const role = await this.findById(tenantId, id);
    if (role.isSystem) {
      throw new ForbiddenError('System roles cannot be deleted.');
    }
    await this.prisma.role.delete({ where: { id } });
  }

  private include() {
    return { permissions: { include: { permission: true } } };
  }
}
