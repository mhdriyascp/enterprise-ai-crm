import type { AgentAction, AgentName, AgentRequest, AgentResponse } from '@crm/types';

import type { AiGateway } from '../application/gateway/ai-gateway';
import type { ConversationService } from '../application/conversations/conversation.service';
import type { RagService } from '../application/rag/rag.service';
import type { AiContext } from '../application/context';
import type { ChatMessage } from '../infrastructure/llm';
import { AGENT_DEFINITIONS, AGENT_NAMES, type AgentDefinition } from './definitions';

// =============================================================================
// Agent Registry — resolves, routes, and invokes agents.
//
// The supervisor classifies intent (lightweight keyword scoring) and delegates
// to a specialized agent. The knowledge agent is backed by the RAG pipeline so
// its answers are grounded and cited; the rest are LLM completions steered by
// their system prompt and the configured model route.
// =============================================================================

export interface AgentRegistryOptions {
  maxTokens?: number;
}

export class AgentRegistry {
  constructor(
    private readonly gateway: AiGateway,
    private readonly rag: RagService,
    private readonly conversations: ConversationService,
    private readonly options: AgentRegistryOptions = {},
  ) {}

  list(): AgentDefinition[] {
    return AGENT_NAMES.map((name) => AGENT_DEFINITIONS[name]);
  }

  get(name: AgentName): AgentDefinition {
    return AGENT_DEFINITIONS[name];
  }

  /**
   * Classify a task to a specialized agent using keyword scoring. Defaults to
   * the CRM agent when nothing matches. Never returns `supervisor`.
   */
  route(task: string): AgentName {
    const text = task.toLowerCase();
    let best: { name: AgentName; score: number } = { name: 'crm', score: 0 };

    for (const name of AGENT_NAMES) {
      if (name === 'supervisor') continue;
      const def = AGENT_DEFINITIONS[name];
      let score = 0;
      for (const keyword of def.keywords) {
        if (text.includes(keyword)) score += 1;
      }
      if (score > best.score) best = { name, score };
    }
    return best.name;
  }

  /** Invoke an agent by name, persisting the exchange to a conversation. */
  async invoke(name: AgentName, ctx: AiContext, request: AgentRequest): Promise<AgentResponse> {
    const startedAt = Date.now();
    const actions: AgentAction[] = [];

    // Supervisor routes to a specialized agent before answering.
    let target = name;
    if (name === 'supervisor') {
      target = this.route(request.task);
      actions.push({ type: 'delegate', payload: { agent: target } });
    }

    const conversation = await this.conversations.resolve(ctx, name, request.sessionId);

    let response: string;
    let model: string;
    let tokensUsed: number;
    let citations: AgentResponse['citations'];

    if (target === 'knowledge') {
      const rag = await this.rag.query(ctx, request.task);
      response = rag.answer;
      model = rag.model;
      tokensUsed = rag.tokensUsed;
      citations = rag.citations;
    } else {
      const def = AGENT_DEFINITIONS[target];
      const route = this.gateway.modelRouter.routeForAgent(target);
      const messages = this.buildMessages(def, request);
      const completion = await this.gateway.complete(messages, {
        model: route.model,
        temperature: route.temperature,
        maxTokens: this.options.maxTokens,
      });
      response = completion.content;
      model = completion.model;
      tokensUsed = completion.tokensUsed;
    }

    await this.conversations.appendMessages(conversation.id, [
      { role: 'user', content: request.task },
      { role: 'assistant', content: response, model, tokensUsed, citations },
    ]);

    return {
      response,
      actions: actions.length > 0 ? actions : undefined,
      citations,
      sessionId: conversation.id,
      model,
      tokensUsed,
      latencyMs: Date.now() - startedAt,
    };
  }

  private buildMessages(def: AgentDefinition, request: AgentRequest): ChatMessage[] {
    let system = def.systemPrompt;
    if (request.context && Object.keys(request.context).length > 0) {
      system += `\n\nAdditional context:\n${JSON.stringify(request.context, null, 2)}`;
    }
    return [
      { role: 'system', content: system },
      { role: 'user', content: request.task },
    ];
  }
}
