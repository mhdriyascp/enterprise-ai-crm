import { normalize, type EmbeddingProvider, type EmbeddingResult } from './provider';

// =============================================================================
// Deterministic, offline embedding provider.
//
// Uses a hashed bag-of-words projection: each token is hashed into a dimension
// and accumulated, then the vector is L2-normalised. This yields stable vectors
// where lexical overlap produces higher cosine similarity — enough to drive and
// test the RAG retrieval pipeline without an external embedding API.
// =============================================================================

export class MockEmbeddingProvider implements EmbeddingProvider {
  readonly name = 'mock';

  constructor(
    readonly model: string = 'mock-embedding',
    readonly dimensions: number = 256,
  ) {}

  async embed(texts: string[]): Promise<EmbeddingResult> {
    const vectors = texts.map((text) => this.embedOne(text));
    const tokensUsed = texts.reduce((sum, t) => sum + tokenize(t).length, 0);
    return { vectors, model: this.model, tokensUsed };
  }

  private embedOne(text: string): number[] {
    const vector = new Array<number>(this.dimensions).fill(0);
    for (const token of tokenize(text)) {
      const idx = hash(token) % this.dimensions;
      vector[idx] += 1;
    }
    return normalize(vector);
  }
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

// Deterministic 32-bit FNV-1a hash.
function hash(token: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < token.length; i += 1) {
    h ^= token.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
