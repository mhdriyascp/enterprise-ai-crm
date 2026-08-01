import { describe, expect, it } from 'vitest';

import { MemoryVectorStore } from '../../src/infrastructure/vectorstore/memory-store';
import {
  collectionForTenant,
  type VectorRecord,
} from '../../src/infrastructure/vectorstore/vector-store';

function record(id: string, vector: number[], documentId = 'doc-1'): VectorRecord {
  return {
    id,
    vector,
    payload: { tenantId: 't1', documentId, documentTitle: 'Doc', chunkIndex: 0, text: id },
  };
}

describe('collectionForTenant', () => {
  it('derives a stable, dash-free collection name', () => {
    expect(collectionForTenant('11111111-2222-3333')).toBe('knowledge_1111111122223333');
  });
});

describe('MemoryVectorStore', () => {
  it('returns nearest neighbours ranked by cosine similarity', async () => {
    const store = new MemoryVectorStore();
    await store.ensureCollection('c', 3);
    await store.upsert('c', [
      record('a', [1, 0, 0]),
      record('b', [0.9, 0.1, 0]),
      record('c', [0, 1, 0]),
    ]);

    const hits = await store.search('c', [1, 0, 0], 2);
    expect(hits).toHaveLength(2);
    expect(hits[0].id).toBe('a');
    expect(hits[1].id).toBe('b');
    expect(hits[0].score).toBeGreaterThanOrEqual(hits[1].score);
  });

  it('returns an empty result for an unknown collection', async () => {
    const store = new MemoryVectorStore();
    expect(await store.search('missing', [1, 0, 0], 5)).toEqual([]);
  });

  it('deletes all chunks belonging to a document', async () => {
    const store = new MemoryVectorStore();
    await store.ensureCollection('c', 3);
    await store.upsert('c', [
      record('a', [1, 0, 0], 'doc-1'),
      record('b', [0, 1, 0], 'doc-2'),
    ]);
    await store.deleteByDocument('c', 'doc-1');
    const hits = await store.search('c', [1, 0, 0], 5);
    expect(hits.map((h) => h.id)).toEqual(['b']);
  });
});
