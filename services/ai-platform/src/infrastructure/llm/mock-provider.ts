import {
  estimateTokens,
  type ChatMessage,
  type CompletionRequest,
  type CompletionResult,
  type LlmProvider,
} from './provider';

// =============================================================================
// Deterministic, offline LLM provider.
//
// Produces a readable, grounded-looking response derived from the prompt so the
// platform, agents, and RAG pipeline are exercisable without any external
// dependency or API key. Output is deterministic for a given input, which makes
// it suitable for unit tests.
// =============================================================================

export class MockLlmProvider implements LlmProvider {
  readonly name = 'mock';

  constructor(readonly defaultModel: string = 'mock-llm') {}

  async complete(request: CompletionRequest): Promise<CompletionResult> {
    const model = request.model ?? this.defaultModel;
    const system = lastOf(request.messages, 'system');
    const user = lastOf(request.messages, 'user');

    const persona = system ? firstSentence(system) : 'AI assistant';
    const answer = user
      ? `${persona}: Based on the provided context, here is a response to "${truncate(user, 200)}".`
      : `${persona}: How can I help?`;

    const content = request.maxTokens ? truncateWords(answer, request.maxTokens) : answer;

    return {
      content,
      model,
      tokensUsed: request.messages.reduce((sum, m) => sum + estimateTokens(m.content), 0) +
        estimateTokens(content),
    };
  }
}

function lastOf(messages: ChatMessage[], role: ChatMessage['role']): string | undefined {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role === role) return messages[i].content;
  }
  return undefined;
}

function firstSentence(text: string): string {
  const match = text.trim().match(/^[^.!?\n]{1,120}/);
  return match ? match[0].trim() : 'AI assistant';
}

function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

function truncateWords(text: string, maxTokens: number): string {
  const words = text.split(/\s+/);
  return words.length > maxTokens ? words.slice(0, maxTokens).join(' ') : text;
}
