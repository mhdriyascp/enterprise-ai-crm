import { cosineSimilarity } from '../embeddings/provider';
import type { SearchHit, VectorRecord, VectorStore } from './vector-store';

// =============================================================================
// In-memory vector store — a brute-force cosine-similarity index. Suitable for
// local development, tests, and small tenants. Not persistent.
// =============================================================================

export class MemoryVectorStore implements VectorStore {
  readonly name = 'memory';
  private readonly collections = new Map<string, Map<string, VectorRecord>>();

  async ensureCollection(collection: string): Promise<void> {
    if (!this.collections.has(collection)) {
      this.collections.set(collection, new Map());
    }
  }

  async upsert(collection: string, records: VectorRecord[]): Promise<void> {
    const store = this.getCollection(collection);
    for (const record of records) {
      store.set(record.id, record);
    }
  }

  async search(collection: string, vector: number[], limit: number): Promise<SearchHit[]> {
    const store = this.collections.get(collection);
    if (!store) return [];

    const hits: SearchHit[] = [];
    for (const record of store.values()) {
      hits.push({
        id: record.id,
        score: cosineSimilarity(vector, record.vector),
        payload: record.payload,
      });
    }
    hits.sort((a, b) => b.score - a.score);
    return hits.slice(0, limit);
  }

  async deleteByDocument(collection: string, documentId: string): Promise<void> {
    const store = this.collections.get(collection);
    if (!store) return;
    for (const [id, record] of store) {
      if (record.payload.documentId === documentId) store.delete(id);
    }
  }

  private getCollection(collection: string): Map<string, VectorRecord> {
    let store = this.collections.get(collection);
    if (!store) {
      store = new Map();
      this.collections.set(collection, store);
    }
    return store;
  }
}
