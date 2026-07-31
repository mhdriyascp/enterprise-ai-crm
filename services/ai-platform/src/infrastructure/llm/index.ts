import type { Logger } from '@crm/logging';

import type { AiPlatformConfig } from '../../config';
import { MockLlmProvider } from './mock-provider';
import { OpenAiLlmProvider } from './openai-provider';
import type { LlmProvider } from './provider';

export * from './provider';

// =============================================================================
// LLM provider factory — selects the provider from configuration and falls back
// to the deterministic mock when the OpenAI provider is misconfigured.
// =============================================================================

export function createLlmProvider(config: AiPlatformConfig, logger?: Logger): LlmProvider {
  if (config.LLM_PROVIDER === 'openai') {
    if (!config.LLM_API_KEY) {
      logger?.warn('LLM_PROVIDER=openai but LLM_API_KEY is missing; using mock provider');
      return new MockLlmProvider(config.LLM_DEFAULT_MODEL);
    }
    return new OpenAiLlmProvider({
      baseUrl: config.LLM_BASE_URL,
      apiKey: config.LLM_API_KEY,
      defaultModel: config.LLM_DEFAULT_MODEL,
      temperature: config.LLM_TEMPERATURE,
      maxTokens: config.LLM_MAX_TOKENS,
    });
  }
  return new MockLlmProvider(config.LLM_DEFAULT_MODEL);
}
