import type { FastifyInstance, FastifyRequest, preHandlerHookHandler } from 'fastify';

import type { RagService } from '../../application/rag/rag.service';
import type { AiContext } from '../../application/context';
import { requirePrincipal } from '../middleware/authenticate';
import { IngestDocumentSchema, RagQuerySchema, RagSearchSchema } from '../dtos';

// =============================================================================
// RAG routes — /api/v1/ai/rag
// =============================================================================

function contextFrom(request: FastifyRequest): AiContext {
  const principal = requirePrincipal(request);
  return { tenantId: principal.tenantId, userId: principal.userId, correlationId: request.id };
}

export function registerRagRoutes(
  app: FastifyInstance,
  rag: RagService,
  authenticate: preHandlerHookHandler,
): void {
  const tags = ['RAG'];
  const security = [{ bearerAuth: [] }];

  app.post(
    '/rag/documents',
    { preHandler: [authenticate], schema: { tags, summary: 'Ingest a document', security } },
    async (request, reply) => {
      const body = IngestDocumentSchema.parse(request.body);
      const result = await rag.ingest(contextFrom(request), body);
      reply.status(201).send({ data: result });
    },
  );

  app.post(
    '/rag/search',
    { preHandler: [authenticate], schema: { tags, summary: 'Semantic search', security } },
    async (request, reply) => {
      const body = RagSearchSchema.parse(request.body);
      const citations = await rag.search(contextFrom(request), body.query, body.topK);
      reply.send({ data: citations });
    },
  );

  app.post(
    '/rag/query',
    {
      preHandler: [authenticate],
      schema: { tags, summary: 'Retrieval-augmented answer', security },
    },
    async (request, reply) => {
      const body = RagQuerySchema.parse(request.body);
      const result = await rag.query(contextFrom(request), body.query, body.topK, body.model);
      reply.send({ data: result });
    },
  );
}
