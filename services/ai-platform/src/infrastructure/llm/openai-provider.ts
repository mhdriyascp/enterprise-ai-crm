import type {
  CompletionRequest,
  CompletionResult,
  LlmProvider,
} from './provider';

// =============================================================================
// OpenAI-compatible chat-completions provider.
//
// Works with the OpenAI API and any compatible gateway (Azure OpenAI, Ollama's
// OpenAI shim, vLLM, etc.) by pointing `baseUrl` at the desired endpoint.
// =============================================================================

export interface OpenAiLlmOptions {
  baseUrl: string;
  apiKey: string;
  defaultModel: string;
  temperature: number;
  maxTokens: number;
  timeoutMs?: number;
}

interface OpenAiChatResponse {
  choices: Array<{ message?: { content?: string } }>;
  model?: string;
  usage?: { total_tokens?: number };
}

export class OpenAiLlmProvider implements LlmProvider {
  readonly name = 'openai';
  readonly defaultModel: string;
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly temperature: number;
  private readonly maxTokens: number;
  private readonly timeoutMs: number;

  constructor(options: OpenAiLlmOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.apiKey = options.apiKey;
    this.defaultModel = options.defaultModel;
    this.temperature = options.temperature;
    this.maxTokens = options.maxTokens;
    this.timeoutMs = options.timeoutMs ?? 60000;
  }

  async complete(request: CompletionRequest): Promise<CompletionResult> {
    const model = request.model ?? this.defaultModel;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: request.messages,
          temperature: request.temperature ?? this.temperature,
          max_tokens: request.maxTokens ?? this.maxTokens,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`LLM provider error ${response.status}: ${detail}`);
      }

      const data = (await response.json()) as OpenAiChatResponse;
      return {
        content: data.choices[0]?.message?.content ?? '',
        model: data.model ?? model,
        tokensUsed: data.usage?.total_tokens ?? 0,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
