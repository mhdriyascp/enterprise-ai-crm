import type { Logger } from '@crm/logging';

import type { ChunkPayload, SearchHit, VectorRecord, VectorStore } from './vector-store';

// =============================================================================
// Qdrant vector store (HTTP API). Collections are created on demand with cosine
// distance. Point IDs are the chunk UUIDs; the chunk metadata is stored as the
// point payload so search results carry citation data directly.
// =============================================================================

export interface QdrantOptions {
  url: string;
  apiKey?: string;
  logger?: Logger;
  timeoutMs?: number;
}

interface QdrantSearchResponse {
  result?: Array<{ id: string; score: number; payload: ChunkPayload }>;
}

export class QdrantVectorStore implements VectorStore {
  readonly name = 'qdrant';
  private readonly url: string;
  private readonly apiKey?: string;
  private readonly timeoutMs: number;
  private readonly ensured = new Set<string>();

  constructor(options: QdrantOptions) {
    this.url = options.url.replace(/\/$/, '');
    this.apiKey = options.apiKey;
    this.timeoutMs = options.timeoutMs ?? 15000;
  }

  async ensureCollection(collection: string, dimensions: number): Promise<void> {
    if (this.ensured.has(collection)) return;
    const existing = await this.request('GET', `/collections/${collection}`, undefined, [200, 404]);
    if (existing.status === 404) {
      await this.request('PUT', `/collections/${collection}`, {
        vectors: { size: dimensions, distance: 'Cosine' },
      });
    }
    this.ensured.add(collection);
  }

  async upsert(collection: string, records: VectorRecord[]): Promise<void> {
    if (records.length === 0) return;
    await this.request('PUT', `/collections/${collection}/points?wait=true`, {
      points: records.map((r) => ({ id: r.id, vector: r.vector, payload: r.payload })),
    });
  }

  async search(collection: string, vector: number[], limit: number): Promise<SearchHit[]> {
    const res = await this.request('POST', `/collections/${collection}/points/search`, {
      vector,
      limit,
      with_payload: true,
    });
    const body = (await res.json()) as QdrantSearchResponse;
    return (body.result ?? []).map((r) => ({ id: r.id, score: r.score, payload: r.payload }));
  }

  async deleteByDocument(collection: string, documentId: string): Promise<void> {
    await this.request('POST', `/collections/${collection}/points/delete?wait=true`, {
      filter: { must: [{ key: 'documentId', match: { value: documentId } }] },
    });
  }

  private async request(
    method: string,
    path: string,
    body?: unknown,
    okStatuses: number[] = [200],
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(`${this.url}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { 'api-key': this.apiKey } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      if (!okStatuses.includes(response.status)) {
        const detail = await response.text();
        throw new Error(`Qdrant error ${response.status} on ${method} ${path}: ${detail}`);
      }
      return response;
    } finally {
      clearTimeout(timeout);
    }
  }
}
