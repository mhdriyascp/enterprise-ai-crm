import type { EmbeddingProvider, EmbeddingResult } from './provider';

// =============================================================================
// OpenAI-compatible embeddings provider.
// =============================================================================

export interface OpenAiEmbeddingOptions {
  baseUrl: string;
  apiKey: string;
  model: string;
  dimensions: number;
  timeoutMs?: number;
}

interface OpenAiEmbeddingResponse {
  data: Array<{ embedding: number[] }>;
  model?: string;
  usage?: { total_tokens?: number };
}

export class OpenAiEmbeddingProvider implements EmbeddingProvider {
  readonly name = 'openai';
  readonly model: string;
  readonly dimensions: number;
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;

  constructor(options: OpenAiEmbeddingOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.apiKey = options.apiKey;
    this.model = options.model;
    this.dimensions = options.dimensions;
    this.timeoutMs = options.timeoutMs ?? 30000;
  }

  async embed(texts: string[]): Promise<EmbeddingResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ model: this.model, input: texts, dimensions: this.dimensions }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Embedding provider error ${response.status}: ${detail}`);
      }

      const data = (await response.json()) as OpenAiEmbeddingResponse;
      return {
        vectors: data.data.map((d) => d.embedding),
        model: data.model ?? this.model,
        tokensUsed: data.usage?.total_tokens ?? 0,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
