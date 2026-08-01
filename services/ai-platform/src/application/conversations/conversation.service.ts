import type { PrismaClient } from '@prisma/client';

import { NotFoundError } from '@crm/common';
import type { Citation } from '@crm/types';

import type { AiContext } from '../context';

// =============================================================================
// Conversation Service — persistence for chat history. Conversations and their
// messages back the agent endpoints so multi-turn sessions can be resumed and
// audited per tenant.
// =============================================================================

export interface AppendMessageInput {
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  tokensUsed?: number;
  citations?: Citation[];
}

export class ConversationService {
  constructor(private readonly prisma: PrismaClient) {}

  /** Fetch an existing conversation for the tenant, or create a new one. */
  async resolve(
    ctx: AiContext,
    agentName: string,
    sessionId?: string,
    title?: string,
  ): Promise<{ id: string }> {
    if (sessionId) {
      const existing = await this.prisma.conversation.findFirst({
        where: { id: sessionId, tenantId: ctx.tenantId },
        select: { id: true },
      });
      if (existing) return existing;
    }
    return this.prisma.conversation.create({
      data: {
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        agentName,
        title: title ?? null,
      },
      select: { id: true },
    });
  }

  async appendMessages(conversationId: string, messages: AppendMessageInput[]): Promise<void> {
    if (messages.length === 0) return;
    await this.prisma.message.createMany({
      data: messages.map((m) => ({
        conversationId,
        role: m.role,
        content: m.content,
        model: m.model ?? null,
        tokensUsed: m.tokensUsed ?? null,
        citations: m.citations ? (m.citations as unknown as object) : undefined,
      })),
    });
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
  }

  async list(ctx: AiContext, page: number, limit: number) {
    const where = { tenantId: ctx.tenantId };
    const [data, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.conversation.count({ where }),
    ]);
    return { data, total };
  }

  async getWithMessages(ctx: AiContext, id: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conversation) throw new NotFoundError('Conversation', id);
    return conversation;
  }
}
