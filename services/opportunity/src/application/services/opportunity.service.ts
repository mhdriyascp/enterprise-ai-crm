import type { Opportunity, Prisma, PrismaClient } from '@prisma/client';

import { NotFoundError } from '@crm/common';
import { EventTopics, NoopEventPublisher, type EventPublisher } from '@crm/events';

import type {
  CreateOpportunityInput,
  ListOpportunitiesQuery,
  UpdateOpportunityInput,
} from '../../interface/dtos';

// =============================================================================
// Opportunity Service — tenant-scoped CRUD for opportunities.
// =============================================================================

export interface TenantContext {
  tenantId: string;
  userId?: string;
}

/** Serialised opportunity with the Decimal `amount` converted to a number. */
export type OpportunityDto = Omit<Opportunity, 'amount'> & { amount: number };

function toDto(opportunity: Opportunity): OpportunityDto {
  return {
    ...opportunity,
    amount: Number(opportunity.amount),
  };
}

export class OpportunityService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly events: EventPublisher = new NoopEventPublisher(),
  ) {}

  async create(ctx: TenantContext, input: CreateOpportunityInput): Promise<OpportunityDto> {
    const opportunity = await this.prisma.opportunity.create({
      data: {
        tenantId: ctx.tenantId,
        name: input.name,
        customerId: input.customerId,
        contactId: input.contactId,
        stage: input.stage ?? 'prospecting',
        amount: input.amount ?? 0,
        currency: input.currency ?? 'USD',
        probability: input.probability ?? 0,
        expectedCloseDate: input.expectedCloseDate ? new Date(input.expectedCloseDate) : undefined,
        actualCloseDate: input.actualCloseDate ? new Date(input.actualCloseDate) : undefined,
        ownerId: input.ownerId,
        notes: input.notes,
        tags: input.tags ?? [],
        customFields: (input.customFields ?? {}) as Prisma.InputJsonValue,
      },
    });
    await this.events.publish(
      EventTopics.OPPORTUNITY_CREATED,
      {
        opportunityId: opportunity.id,
        amount: Number(opportunity.amount),
        currency: opportunity.currency,
      },
      { tenantId: ctx.tenantId, userId: ctx.userId },
    );
    await this.publishStageEvent(ctx, opportunity, undefined);
    return toDto(opportunity);
  }

  async list(
    ctx: TenantContext,
    query: ListOpportunitiesQuery,
  ): Promise<{ data: OpportunityDto[]; total: number }> {
    const where: Prisma.OpportunityWhereInput = {
      tenantId: ctx.tenantId,
      deletedAt: null,
      ...(query.stage ? { stage: query.stage } : {}),
      ...(query.customerId ? { customerId: query.customerId } : {}),
      ...(query.ownerId ? { ownerId: query.ownerId } : {}),
      ...(query.search
        ? { name: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.opportunity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.opportunity.count({ where }),
    ]);

    return { data: data.map(toDto), total };
  }

  async findById(ctx: TenantContext, id: string): Promise<OpportunityDto> {
    const opportunity = await this.prisma.opportunity.findFirst({
      where: { id, tenantId: ctx.tenantId, deletedAt: null },
    });
    if (!opportunity) throw new NotFoundError('Opportunity', id);
    return toDto(opportunity);
  }

  async update(
    ctx: TenantContext,
    id: string,
    input: UpdateOpportunityInput,
  ): Promise<OpportunityDto> {
    await this.findById(ctx, id);
    const previous = await this.prisma.opportunity.findFirst({ where: { id } });
    const opportunity = await this.prisma.opportunity.update({
      where: { id },
      data: {
        ...input,
        expectedCloseDate: input.expectedCloseDate
          ? new Date(input.expectedCloseDate)
          : undefined,
        actualCloseDate: input.actualCloseDate ? new Date(input.actualCloseDate) : undefined,
        customFields: input.customFields as Prisma.InputJsonValue | undefined,
      },
    });
    await this.publishStageEvent(ctx, opportunity, previous?.stage);
    return toDto(opportunity);
  }

  /**
   * Emit a won/lost event when an opportunity enters a closed stage. `fromStage`
   * is the prior stage (undefined on create) so events only fire on transition.
   */
  private async publishStageEvent(
    ctx: TenantContext,
    opportunity: Opportunity,
    fromStage: string | undefined,
  ): Promise<void> {
    if (opportunity.stage === fromStage) return;

    if (opportunity.stage === 'closed_won') {
      await this.events.publish(
        EventTopics.OPPORTUNITY_WON,
        {
          opportunityId: opportunity.id,
          amount: Number(opportunity.amount),
          currency: opportunity.currency,
        },
        { tenantId: ctx.tenantId, userId: ctx.userId },
      );
    } else if (opportunity.stage === 'closed_lost') {
      await this.events.publish(
        EventTopics.OPPORTUNITY_LOST,
        { opportunityId: opportunity.id },
        { tenantId: ctx.tenantId, userId: ctx.userId },
      );
    }
  }

  async softDelete(ctx: TenantContext, id: string): Promise<void> {
    await this.findById(ctx, id);
    await this.prisma.opportunity.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
