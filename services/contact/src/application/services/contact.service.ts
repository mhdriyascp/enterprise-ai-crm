import type { Contact, Prisma, PrismaClient } from '@prisma/client';

import { NotFoundError } from '@crm/common';

import type {
  CreateContactInput,
  ListContactsQuery,
  UpdateContactInput,
} from '../../interface/dtos';

// =============================================================================
// Contact Service — tenant-scoped CRUD for contacts.
// =============================================================================

export interface TenantContext {
  tenantId: string;
}

export class ContactService {
  constructor(private readonly prisma: PrismaClient) {}

  async create(ctx: TenantContext, input: CreateContactInput): Promise<Contact> {
    return this.prisma.contact.create({
      data: {
        tenantId: ctx.tenantId,
        firstName: input.firstName,
        lastName: input.lastName,
        customerId: input.customerId,
        email: input.email,
        phone: input.phone,
        title: input.title,
        department: input.department,
        isPrimary: input.isPrimary ?? false,
        status: input.status ?? 'active',
        ownerId: input.ownerId,
        tags: input.tags ?? [],
        customFields: (input.customFields ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  async list(
    ctx: TenantContext,
    query: ListContactsQuery,
  ): Promise<{ data: Contact[]; total: number }> {
    const where: Prisma.ContactWhereInput = {
      tenantId: ctx.tenantId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.customerId ? { customerId: query.customerId } : {}),
      ...(query.ownerId ? { ownerId: query.ownerId } : {}),
      ...(query.search
        ? {
            OR: [
              { firstName: { contains: query.search, mode: 'insensitive' } },
              { lastName: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.contact.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.contact.count({ where }),
    ]);

    return { data, total };
  }

  async findById(ctx: TenantContext, id: string): Promise<Contact> {
    const contact = await this.prisma.contact.findFirst({
      where: { id, tenantId: ctx.tenantId, deletedAt: null },
    });
    if (!contact) throw new NotFoundError('Contact', id);
    return contact;
  }

  async update(ctx: TenantContext, id: string, input: UpdateContactInput): Promise<Contact> {
    await this.findById(ctx, id);
    return this.prisma.contact.update({
      where: { id },
      data: {
        ...input,
        customFields: input.customFields as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async softDelete(ctx: TenantContext, id: string): Promise<void> {
    await this.findById(ctx, id);
    await this.prisma.contact.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
