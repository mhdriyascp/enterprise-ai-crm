import type { FastifyInstance, FastifyRequest, preHandlerHookHandler } from 'fastify';

import { buildPaginatedResult } from '@crm/common';

import type { ConversationService } from '../../application/conversations/conversation.service';
import type { AiContext } from '../../application/context';
import { requirePrincipal } from '../middleware/authenticate';
import { IdParamSchema, ListQuerySchema } from '../dtos';

// =============================================================================
// Conversation routes — /api/v1/ai/conversations
// =============================================================================

function contextFrom(request: FastifyRequest): AiContext {
  const principal = requirePrincipal(request);
  return { tenantId: principal.tenantId, userId: principal.userId, correlationId: request.id };
}

export function registerConversationRoutes(
  app: FastifyInstance,
  service: ConversationService,
  authenticate: preHandlerHookHandler,
): void {
  const tags = ['Conversations'];
  const security = [{ bearerAuth: [] }];

  app.get(
    '/conversations',
    { preHandler: [authenticate], schema: { tags, summary: 'List conversations', security } },
    async (request, reply) => {
      const query = ListQuerySchema.parse(request.query);
      const { data, total } = await service.list(contextFrom(request), query.page, query.limit);
      reply.send(buildPaginatedResult(data, total, query.page, query.limit, request.id));
    },
  );

  app.get(
    '/conversations/:id',
    {
      preHandler: [authenticate],
      schema: { tags, summary: 'Get a conversation with messages', security },
    },
    async (request, reply) => {
      const { id } = IdParamSchema.parse(request.params);
      reply.send({ data: await service.getWithMessages(contextFrom(request), id) });
    },
  );
}
