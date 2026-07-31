// =============================================================================
// Embedding provider abstraction. See the LLM provider for the rationale — the
// `mock` embedder is deterministic and offline; `openai` calls a compatible
// `/embeddings` endpoint.
// =============================================================================

export interface EmbeddingResult {
  vectors: number[][];
  model: string;
  tokensUsed: number;
}

export interface EmbeddingProvider {
  readonly name: string;
  readonly model: string;
  readonly dimensions: number;
  embed(texts: string[]): Promise<EmbeddingResult>;
}

/** Normalise a vector to unit length so dot-product equals cosine similarity. */
export function normalize(vector: number[]): number[] {
  let norm = 0;
  for (const v of vector) norm += v * v;
  norm = Math.sqrt(norm);
  if (norm === 0) return vector;
  return vector.map((v) => v / norm);
}

/** Cosine similarity for two equal-length vectors. */
export function cosineSimilarity(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < len; i += 1) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
