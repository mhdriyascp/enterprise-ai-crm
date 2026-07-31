import Fastify, { type FastifyInstance } from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import type { PrismaClient } from '@prisma/client';

import type { Logger } from '@crm/logging';
import { NoopEventPublisher, type EventPublisher } from '@crm/events';

import type { AiPlatformConfig } from '../../config';
import { AgentRegistry } from '../../agents/registry';
import { AiGateway } from '../../application/gateway/ai-gateway';
import { ModelRouter } from '../../application/gateway/model-router';
import { ConversationService } from '../../application/conversations/conversation.service';
import { RagService } from '../../application/rag/rag.service';
import { createEmbeddingProvider } from '../embeddings';
import { createLlmProvider } from '../llm';
import { createVectorStore } from '../vectorstore';
import { createAuthenticate } from '../../interface/middleware/authenticate';
import { createErrorHandler } from '../../interface/middleware/error-handler';
import { registerAgentRoutes } from '../../interface/routes/agent.routes';
import { registerConversationRoutes } from '../../interface/routes/conversation.routes';
import { registerEmbedRoutes } from '../../interface/routes/embed.routes';
import { registerHealthRoutes } from '../../interface/routes/health.routes';
import { registerRagRoutes } from '../../interface/routes/rag.routes';

// =============================================================================
// HTTP server assembly for the AI Platform service.
//
// Wires the model providers (LLM, embeddings, vector store) into the gateway,
// then builds the RAG pipeline, conversation store, and agent registry on top,
// exposing them under /api/v1/ai/*.
// =============================================================================

export interface BuildAppOptions {
  prisma: PrismaClient;
  config: AiPlatformConfig;
  logger: Logger;
  events?: EventPublisher;
}

export async function buildApp(opts: BuildAppOptions): Promise<FastifyInstance> {
  const { prisma, config, logger } = opts;
  const events = opts.events ?? new NoopEventPublisher();
  const app = Fastify({ logger: false, trustProxy: true });

  // --- Model layer -----------------------------------------------------------
  const llm = createLlmProvider(config, logger);
  const embedder = createEmbeddingProvider(config, logger);
  const vectorStore = createVectorStore(config, logger);
  const router = new ModelRouter({
    defaultModel: config.LLM_DEFAULT_MODEL,
    defaultTemperature: config.LLM_TEMPERATURE,
  });
  const gateway = new AiGateway(llm, embedder, router);

  // --- Application services --------------------------------------------------
  const conversations = new ConversationService(prisma);
  const rag = new RagService(
    prisma,
    gateway,
    vectorStore,
    {
      chunkSize: config.RAG_CHUNK_SIZE,
      chunkOverlap: config.RAG_CHUNK_OVERLAP,
      topK: config.RAG_TOP_K,
    },
    events,
  );
  const registry = new AgentRegistry(gateway, rag, conversations, {
    maxTokens: config.LLM_MAX_TOKENS,
  });

  const authenticate = createAuthenticate({
    secret: config.JWT_SECRET,
    issuer: config.JWT_ISSUER,
  });

  app.setErrorHandler(createErrorHandler(logger));

  await app.register(fastifyHelmet);
  await app.register(fastifyCors, { origin: config.CORS_ORIGINS });
  await app.register(fastifyRateLimit, {
    max: config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_WINDOW,
  });

  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'AI Platform Service API',
        description: 'AI gateway, agents, and RAG pipeline for the Enterprise AI CRM.',
        version: '1.0.0',
      },
      servers: [{ url: '/api/v1' }],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
    },
  });
  await app.register(fastifySwaggerUi, { routePrefix: '/docs' });

  registerHealthRoutes(app, prisma);

  await app.register(
    async (api) => {
      registerAgentRoutes(api, registry, authenticate);
      registerEmbedRoutes(api, gateway, authenticate);
      registerRagRoutes(api, rag, authenticate);
      registerConversationRoutes(api, conversations, authenticate);
    },
    { prefix: '/api/v1/ai' },
  );

  return app;
}
