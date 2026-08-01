import type { Lead, Prisma, PrismaClient } from '@prisma/client';

import { NotFoundError } from '@crm/common';
import { EventTopics, NoopEventPublisher, type EventPublisher } from '@crm/events';

import type { CreateLeadInput, ListLeadsQuery, UpdateLeadInput } from '../../interface/dtos';

// =============================================================================
// Lead Service — tenant-scoped CRUD for leads.
// =============================================================================

export interface TenantContext {
  tenantId: string;
  userId?: string;
}

export class LeadService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly events: EventPublisher = new NoopEventPublisher(),
  ) {}

  async create(ctx: TenantContext, input: CreateLeadInput): Promise<Lead> {
    const lead = await this.prisma.lead.create({
      data: {
        tenantId: ctx.tenantId,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        company: input.company,
        title: input.title,
        source: input.source ?? 'other',
        status: input.status ?? 'new',
        score: input.score,
        ownerId: input.ownerId,
        notes: input.notes,
        tags: input.tags ?? [],
        customFields: (input.customFields ?? {}) as Prisma.InputJsonValue,
      },
    });

    await this.events.publish(
      EventTopics.LEAD_CREATED,
      { leadId: lead.id, email: lead.email ?? undefined, source: lead.source },
      { tenantId: ctx.tenantId, userId: ctx.userId },
    );

    if (lead.status === 'qualified') {
      await this.publishQualified(ctx, lead);
    }

    return lead;
  }

  async list(ctx: TenantContext, query: ListLeadsQuery): Promise<{ data: Lead[]; total: number }> {
    const where: Prisma.LeadWhereInput = {
      tenantId: ctx.tenantId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.source ? { source: query.source } : {}),
      ...(query.ownerId ? { ownerId: query.ownerId } : {}),
      ...(query.search
        ? {
            OR: [
              { firstName: { contains: query.search, mode: 'insensitive' } },
              { lastName: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
              { company: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.lead.count({ where }),
    ]);

    return { data, total };
  }

  async findById(ctx: TenantContext, id: string): Promise<Lead> {
    const lead = await this.prisma.lead.findFirst({
      where: { id, tenantId: ctx.tenantId, deletedAt: null },
    });
    if (!lead) throw new NotFoundError('Lead', id);
    return lead;
  }

  async update(ctx: TenantContext, id: string, input: UpdateLeadInput): Promise<Lead> {
    const existing = await this.findById(ctx, id);
    const lead = await this.prisma.lead.update({
      where: { id },
      data: {
        ...input,
        customFields: input.customFields as Prisma.InputJsonValue | undefined,
      },
    });

    // Emit a qualification event only on the transition into `qualified`.
    if (existing.status !== 'qualified' && lead.status === 'qualified') {
      await this.publishQualified(ctx, lead);
    }

    return lead;
  }

  private async publishQualified(ctx: TenantContext, lead: Lead): Promise<void> {
    await this.events.publish(
      EventTopics.LEAD_QUALIFIED,
      { leadId: lead.id, score: lead.score ?? 0, qualificationMethod: 'manual' },
      { tenantId: ctx.tenantId, userId: ctx.userId },
    );
  }

  async softDelete(ctx: TenantContext, id: string): Promise<void> {
    await this.findById(ctx, id);
    await this.prisma.lead.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
