import { describe, expect, it } from 'vitest';

import type { PrismaClient } from '@prisma/client';

import { AgentRegistry } from '../../src/agents/registry';
import { AiGateway } from '../../src/application/gateway/ai-gateway';
import { ModelRouter } from '../../src/application/gateway/model-router';
import { ConversationService } from '../../src/application/conversations/conversation.service';
import { RagService } from '../../src/application/rag/rag.service';
import { MockEmbeddingProvider } from '../../src/infrastructure/embeddings/mock-embedder';
import { MockLlmProvider } from '../../src/infrastructure/llm/mock-provider';
import { MemoryVectorStore } from '../../src/infrastructure/vectorstore/memory-store';
import type { AiContext } from '../../src/application/context';

// Minimal in-memory Prisma stand-in covering the operations the AI Platform
// application services use.
function createFakePrisma() {
  let docSeq = 0;
  let convSeq = 0;
  const conversations = new Map<string, Record<string, unknown>>();
  const messages: Record<string, unknown>[] = [];

  return {
    document: {
      create: async ({ select }: { data: unknown; select?: unknown }) => {
        const id = `doc-${++docSeq}`;
        return select ? { id } : { id };
      },
    },
    chunk: {
      createMany: async (_args: unknown) => ({ count: 0 }),
    },
    conversation: {
      findFirst: async ({ where }: { where: { id: string; tenantId: string } }) => {
        const c = conversations.get(where.id);
        return c && c.tenantId === where.tenantId ? { id: where.id } : null;
      },
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const id = `conv-${++convSeq}`;
        conversations.set(id, { id, ...data });
        return { id };
      },
      update: async (_args: unknown) => ({}),
    },
    message: {
      createMany: async ({ data }: { data: Record<string, unknown>[] }) => {
        messages.push(...data);
        return { count: data.length };
      },
    },
    __messages: messages,
  } as unknown as PrismaClient & { __messages: Record<string, unknown>[] };
}

function buildGateway(): AiGateway {
  const router = new ModelRouter({ defaultModel: 'mock-llm', defaultTemperature: 0.2 });
  return new AiGateway(new MockLlmProvider('mock-llm'), new MockEmbeddingProvider('mock', 128), router);
}

const ctx: AiContext = { tenantId: '11111111-1111-1111-1111-111111111111', userId: 'u1' };
const ragOptions = { chunkSize: 200, chunkOverlap: 20, topK: 3 };

describe('RagService', () => {
  it('ingests a document and retrieves grounded citations', async () => {
    const prisma = createFakePrisma();
    const gateway = buildGateway();
    const store = new MemoryVectorStore();
    const rag = new RagService(prisma, gateway, store, ragOptions);

    const result = await rag.ingest(ctx, {
      title: 'Refund Policy',
      content:
        'Our refund policy allows customers to request a refund within 30 days of purchase. ' +
        'Refunds are processed to the original payment method.',
    });
    expect(result.documentId).toBe('doc-1');
    expect(result.chunks).toBeGreaterThan(0);

    const citations = await rag.search(ctx, 'How long do I have to request a refund?');
    expect(citations.length).toBeGreaterThan(0);
    expect(citations[0].documentTitle).toBe('Refund Policy');
    expect(citations[0].chunkText.toLowerCase()).toContain('refund');
  });

  it('answers with citations via query()', async () => {
    const prisma = createFakePrisma();
    const gateway = buildGateway();
    const store = new MemoryVectorStore();
    const rag = new RagService(prisma, gateway, store, ragOptions);

    await rag.ingest(ctx, {
      title: 'Billing',
      content: 'Invoices are due within 15 days. Late payments incur a 2 percent fee.',
    });

    const answer = await rag.query(ctx, 'When are invoices due?');
    expect(answer.citations.length).toBeGreaterThan(0);
    expect(answer.answer.length).toBeGreaterThan(0);
    expect(answer.model).toBe('mock-llm');
  });

  it('returns an empty citation list when nothing is indexed', async () => {
    const prisma = createFakePrisma();
    const rag = new RagService(prisma, buildGateway(), new MemoryVectorStore(), ragOptions);
    const answer = await rag.query(ctx, 'Anything indexed?');
    expect(answer.citations).toEqual([]);
    expect(answer.answer.length).toBeGreaterThan(0);
  });
});

describe('AgentRegistry.invoke', () => {
  function buildRegistry(prisma: PrismaClient) {
    const gateway = buildGateway();
    const store = new MemoryVectorStore();
    const rag = new RagService(prisma, gateway, store, ragOptions);
    const conversations = new ConversationService(prisma);
    return { registry: new AgentRegistry(gateway, rag, conversations), rag };
  }

  it('invokes a specialized agent and persists the exchange', async () => {
    const prisma = createFakePrisma();
    const { registry } = buildRegistry(prisma);

    const res = await registry.invoke('sales', ctx, { task: 'Qualify this lead' });
    expect(res.response.length).toBeGreaterThan(0);
    expect(res.sessionId).toBe('conv-1');
    expect(res.model).toBe('mock-llm');
    expect(res.tokensUsed).toBeGreaterThan(0);
    // user + assistant messages recorded.
    expect((prisma as unknown as { __messages: unknown[] }).__messages).toHaveLength(2);
  });

  it('supervisor routes to a specialized agent and records a delegate action', async () => {
    const prisma = createFakePrisma();
    const { registry } = buildRegistry(prisma);

    const res = await registry.invoke('supervisor', ctx, {
      task: 'Draft a follow-up email to the client',
    });
    expect(res.actions?.[0]).toMatchObject({ type: 'delegate', payload: { agent: 'email' } });
  });

  it('knowledge agent returns citations from the RAG pipeline', async () => {
    const prisma = createFakePrisma();
    const { registry, rag } = buildRegistry(prisma);
    await rag.ingest(ctx, {
      title: 'Security',
      content: 'All data is encrypted at rest using AES-256 and in transit using TLS 1.3.',
    });

    const res = await registry.invoke('knowledge', ctx, {
      task: 'How is data encrypted at rest?',
    });
    expect(res.citations?.length).toBeGreaterThan(0);
    expect(res.citations?.[0].documentTitle).toBe('Security');
  });
});
