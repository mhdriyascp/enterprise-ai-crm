import type { AgentName } from '@crm/types';

// =============================================================================
// Model Router — decides which model handles a given request.
//
// A small, explicit policy layer between callers and providers. It lets us
// route heavier reasoning agents (supervisor, sales, finance) to a stronger
// model while keeping simple agents on a cheaper/faster one, without callers
// needing to know model names.
// =============================================================================

export interface ModelRoute {
  model: string;
  temperature?: number;
}

export interface ModelRouterOptions {
  defaultModel: string;
  defaultTemperature: number;
  /** Optional per-agent overrides (model id). */
  overrides?: Partial<Record<AgentName, string>>;
}

export class ModelRouter {
  constructor(private readonly options: ModelRouterOptions) {}

  /** Resolve the model + sampling settings for an agent. */
  routeForAgent(agent: AgentName): ModelRoute {
    const model = this.options.overrides?.[agent] ?? this.options.defaultModel;
    // Analytical agents benefit from lower temperature (more deterministic).
    const analytical: AgentName[] = ['finance', 'reporting', 'workflow'];
    const temperature = analytical.includes(agent) ? 0 : this.options.defaultTemperature;
    return { model, temperature };
  }

  /** Resolve the model for a raw completion/chat request. */
  routeDefault(): ModelRoute {
    return { model: this.options.defaultModel, temperature: this.options.defaultTemperature };
  }
}
