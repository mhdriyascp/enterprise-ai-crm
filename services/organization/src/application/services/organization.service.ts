import { Prisma, type Organization, type PrismaClient } from '@prisma/client';

import { ConflictError, NotFoundError } from '@crm/common';

import type {
  CreateOrganizationInput,
  ListOrganizationsQuery,
  UpdateOrganizationInput,
} from '../../interface/dtos';

// =============================================================================
// Organization Service — tenant-scoped CRUD for organizations.
// =============================================================================

export interface TenantContext {
  tenantId: string;
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
  );
}

export class OrganizationService {
  constructor(private readonly prisma: PrismaClient) {}

  async create(ctx: TenantContext, input: CreateOrganizationInput): Promise<Organization> {
    try {
      return await this.prisma.organization.create({
        data: {
          tenantId: ctx.tenantId,
          name: input.name,
          slug: input.slug,
          description: input.description,
          website: input.website,
          industry: input.industry,
          size: input.size,
          status: input.status ?? 'active',
          parentId: input.parentId,
          tags: input.tags ?? [],
          customFields: (input.customFields ?? {}) as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictError(`An organization with slug "${input.slug}" already exists.`);
      }
      throw error;
    }
  }

  async list(
    ctx: TenantContext,
    query: ListOrganizationsQuery,
  ): Promise<{ data: Organization[]; total: number }> {
    const where: Prisma.OrganizationWhereInput = {
      tenantId: ctx.tenantId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.parentId ? { parentId: query.parentId } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { slug: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.organization.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.organization.count({ where }),
    ]);

    return { data, total };
  }

  async findById(ctx: TenantContext, id: string): Promise<Organization> {
    const organization = await this.prisma.organization.findFirst({
      where: { id, tenantId: ctx.tenantId, deletedAt: null },
    });
    if (!organization) throw new NotFoundError('Organization', id);
    return organization;
  }

  async update(
    ctx: TenantContext,
    id: string,
    input: UpdateOrganizationInput,
  ): Promise<Organization> {
    await this.findById(ctx, id);
    try {
      return await this.prisma.organization.update({
        where: { id },
        data: {
          ...input,
          customFields: input.customFields as Prisma.InputJsonValue | undefined,
        },
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictError(`An organization with slug "${input.slug}" already exists.`);
      }
      throw error;
    }
  }

  async softDelete(ctx: TenantContext, id: string): Promise<void> {
    await this.findById(ctx, id);
    await this.prisma.organization.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
