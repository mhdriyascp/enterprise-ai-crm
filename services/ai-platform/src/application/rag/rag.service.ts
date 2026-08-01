import { randomUUID } from 'node:crypto';

import { EventTopics, NoopEventPublisher, type EventPublisher } from '@crm/events';
import type { Citation } from '@crm/types';

import type { PrismaClient } from '@prisma/client';

import type { AiGateway } from '../gateway/ai-gateway';
import { collectionForTenant, type VectorRecord, type VectorStore } from '../../infrastructure/vectorstore';
import type { AiContext } from '../context';
import { chunkText } from './chunker';

// =============================================================================
// RAG Pipeline — ingest → chunk → embed → store → retrieve → generate.
//
// Documents and chunks are persisted relationally (source of truth + metadata)
// while chunk embeddings live in the vector store. Retrieval returns citations
// that the generation step grounds its answer in.
// =============================================================================

export interface RagOptions {
  chunkSize: number;
  chunkOverlap: number;
  topK: number;
}

export interface IngestInput {
  title: string;
  content: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

export interface IngestResult {
  documentId: string;
  chunks: number;
}

export interface RagAnswer {
  answer: string;
  citations: Citation[];
  model: string;
  tokensUsed: number;
  latencyMs: number;
}

export class RagService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly gateway: AiGateway,
    private readonly vectorStore: VectorStore,
    private readonly options: RagOptions,
    private readonly events: EventPublisher = new NoopEventPublisher(),
  ) {}

  /** Ingest a document: chunk, embed, persist, and index into the vector store. */
  async ingest(ctx: AiContext, input: IngestInput): Promise<IngestResult> {
    const chunks = chunkText(input.content, {
      chunkSize: this.options.chunkSize,
      overlap: this.options.chunkOverlap,
    });

    const document = await this.prisma.document.create({
      data: {
        tenantId: ctx.tenantId,
        title: input.title,
        source: input.source ?? null,
        metadata: (input.metadata ?? {}) as object,
        chunkCount: chunks.length,
      },
      select: { id: true },
    });

    if (chunks.length === 0) {
      return { documentId: document.id, chunks: 0 };
    }

    const chunkIds = chunks.map(() => randomUUID());
    const { vectors } = await this.gateway.embeddingProvider.embed(chunks);

    await this.prisma.chunk.createMany({
      data: chunks.map((text, index) => ({
        id: chunkIds[index],
        tenantId: ctx.tenantId,
        documentId: document.id,
        chunkIndex: index,
        text,
      })),
    });

    const collection = collectionForTenant(ctx.tenantId);
    await this.vectorStore.ensureCollection(collection, this.gateway.embeddingDimensions);

    const records: VectorRecord[] = chunks.map((text, index) => ({
      id: chunkIds[index],
      vector: vectors[index],
      payload: {
        tenantId: ctx.tenantId,
        documentId: document.id,
        documentTitle: input.title,
        chunkIndex: index,
        text,
      },
    }));
    await this.vectorStore.upsert(collection, records);

    await this.events.publish(
      EventTopics.DOCUMENT_INDEXED,
      { documentId: document.id, title: input.title, chunks: chunks.length },
      { tenantId: ctx.tenantId, userId: ctx.userId },
    );

    return { documentId: document.id, chunks: chunks.length };
  }

  /** Semantic search over the tenant's knowledge base. Returns citations. */
  async search(ctx: AiContext, query: string, limit?: number): Promise<Citation[]> {
    const topK = limit ?? this.options.topK;
    const { vectors } = await this.gateway.embeddingProvider.embed([query]);
    const collection = collectionForTenant(ctx.tenantId);
    const hits = await this.vectorStore.search(collection, vectors[0], topK);

    return hits.map((hit, index) => ({
      id: index + 1,
      documentTitle: hit.payload.documentTitle,
      documentId: hit.payload.documentId,
      chunkText: hit.payload.text,
      score: hit.score,
    }));
  }

  /** Retrieve-then-generate: answer a question grounded in retrieved chunks. */
  async query(ctx: AiContext, query: string, limit?: number, model?: string): Promise<RagAnswer> {
    const startedAt = Date.now();
    const citations = await this.search(ctx, query, limit);

    if (citations.length === 0) {
      const completion = await this.gateway.complete(
        [
          { role: 'system', content: NO_CONTEXT_SYSTEM_PROMPT },
          { role: 'user', content: query },
        ],
        { model },
      );
      return {
        answer: completion.content,
        citations: [],
        model: completion.model,
        tokensUsed: completion.tokensUsed,
        latencyMs: Date.now() - startedAt,
      };
    }

    const context = citations
      .map((c) => `[${c.id}] (${c.documentTitle}) ${c.chunkText}`)
      .join('\n\n');

    const completion = await this.gateway.complete(
      [
        { role: 'system', content: RAG_SYSTEM_PROMPT },
        { role: 'user', content: `Context:\n${context}\n\nQuestion: ${query}` },
      ],
      { model },
    );

    return {
      answer: completion.content,
      citations,
      model: completion.model,
      tokensUsed: completion.tokensUsed,
      latencyMs: Date.now() - startedAt,
    };
  }
}

const RAG_SYSTEM_PROMPT =
  'You are a knowledge assistant. Answer the question using only the provided context. ' +
  'Cite supporting sources inline using their bracketed numbers (e.g. [1], [2]). ' +
  'If the context does not contain the answer, say you do not have enough information.';

const NO_CONTEXT_SYSTEM_PROMPT =
  'You are a knowledge assistant. No relevant documents were found for this question. ' +
  'Answer only if you are confident, and clearly state when information is unavailable.';
