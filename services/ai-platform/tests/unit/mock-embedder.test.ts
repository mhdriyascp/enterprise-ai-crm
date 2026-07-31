import { describe, expect, it } from 'vitest';

import { MockEmbeddingProvider } from '../../src/infrastructure/embeddings/mock-embedder';
import { cosineSimilarity } from '../../src/infrastructure/embeddings/provider';

describe('MockEmbeddingProvider', () => {
  const provider = new MockEmbeddingProvider('mock-embedding', 128);

  it('produces vectors of the configured dimensionality', async () => {
    const { vectors } = await provider.embed(['hello world']);
    expect(vectors).toHaveLength(1);
    expect(vectors[0]).toHaveLength(128);
  });

  it('is deterministic for identical input', async () => {
    const a = await provider.embed(['the quick brown fox']);
    const b = await provider.embed(['the quick brown fox']);
    expect(a.vectors[0]).toEqual(b.vectors[0]);
  });

  it('ranks lexically similar text higher than unrelated text', async () => {
    const { vectors } = await provider.embed([
      'invoice payment billing revenue',
      'invoice payment billing amount',
      'the weather is sunny today outside',
    ]);
    const [query, similar, unrelated] = vectors;
    expect(cosineSimilarity(query, similar)).toBeGreaterThan(
      cosineSimilarity(query, unrelated),
    );
  });

  it('returns unit-length vectors', async () => {
    const { vectors } = await provider.embed(['normalize me please']);
    const magnitude = Math.sqrt(vectors[0].reduce((s, v) => s + v * v, 0));
    expect(magnitude).toBeCloseTo(1, 5);
  });
});
