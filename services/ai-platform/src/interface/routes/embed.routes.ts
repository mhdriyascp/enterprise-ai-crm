import type { FastifyInstance, preHandlerHookHandler } from 'fastify';

import type { AiGateway } from '../../application/gateway/ai-gateway';
import { EmbedSchema } from '../dtos';

// =============================================================================
// Embedding routes — /api/v1/ai/embeddings
// =============================================================================

export function registerEmbedRoutes(
  app: FastifyInstance,
  gateway: AiGateway,
  authenticate: preHandlerHookHandler,
): void {
  const tags = ['Embeddings'];
  const security = [{ bearerAuth: [] }];

  app.post(
    '/embeddings',
    { preHandler: [authenticate], schema: { tags, summary: 'Generate embeddings', security } },
    async (request, reply) => {
      const body = EmbedSchema.parse(request.body);
      const result = await gateway.embed({ text: body.text, model: body.model });
      reply.send({ data: result });
    },
  );
}
