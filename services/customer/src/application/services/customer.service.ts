import type { Customer, Prisma, PrismaClient } from '@prisma/client';

import { NotFoundError } from '@crm/common';
import { EventTopics, NoopEventPublisher, type EventPublisher } from '@crm/events';

import type {
  CreateCustomerInput,
  ListCustomersQuery,
  UpdateCustomerInput,
} from '../../interface/dtos';

// =============================================================================
// Customer Service — tenant-scoped CRUD for customer accounts.
// Every operation is constrained to the caller's tenant and ignores
// soft-deleted rows.
// =============================================================================

export interface TenantContext {
  tenantId: string;
  userId?: string;
}

/** Serialised customer with the Decimal `revenue` converted to a number. */
export type CustomerDto = Omit<Customer, 'revenue'> & { revenue: number | null };

function toDto(customer: Customer): CustomerDto {
  return {
    ...customer,
    revenue: customer.revenue === null ? null : Number(customer.revenue),
  };
}

export class CustomerService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly events: EventPublisher = new NoopEventPublisher(),
  ) {}

  async create(ctx: TenantContext, input: CreateCustomerInput): Promise<CustomerDto> {
    const customer = await this.prisma.customer.create({
      data: {
        tenantId: ctx.tenantId,
        name: input.name,
        email: input.email,
        phone: input.phone,
        website: input.website,
        industry: input.industry,
        size: input.size,
        revenue: input.revenue,
        currency: input.currency,
        status: input.status ?? 'prospect',
        ownerId: input.ownerId,
        tags: input.tags ?? [],
        customFields: (input.customFields ?? {}) as Prisma.InputJsonValue,
      },
    });
    await this.events.publish(
      EventTopics.CUSTOMER_CREATED,
      { customerId: customer.id, name: customer.name },
      { tenantId: ctx.tenantId, userId: ctx.userId },
    );
    return toDto(customer);
  }

  async list(
    ctx: TenantContext,
    query: ListCustomersQuery,
  ): Promise<{ data: CustomerDto[]; total: number }> {
    const where: Prisma.CustomerWhereInput = {
      tenantId: ctx.tenantId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.ownerId ? { ownerId: query.ownerId } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.customer.count({ where }),
    ]);

    return { data: data.map(toDto), total };
  }

  async findById(ctx: TenantContext, id: string): Promise<CustomerDto> {
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId: ctx.tenantId, deletedAt: null },
    });
    if (!customer) throw new NotFoundError('Customer', id);
    return toDto(customer);
  }

  async update(
    ctx: TenantContext,
    id: string,
    input: UpdateCustomerInput,
  ): Promise<CustomerDto> {
    await this.findById(ctx, id);
    const customer = await this.prisma.customer.update({
      where: { id },
      data: {
        ...input,
        customFields: input.customFields as Prisma.InputJsonValue | undefined,
      },
    });
    await this.events.publish(
      EventTopics.CUSTOMER_UPDATED,
      { customerId: customer.id, name: customer.name },
      { tenantId: ctx.tenantId, userId: ctx.userId },
    );
    return toDto(customer);
  }

  async softDelete(ctx: TenantContext, id: string): Promise<void> {
    await this.findById(ctx, id);
    await this.prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
