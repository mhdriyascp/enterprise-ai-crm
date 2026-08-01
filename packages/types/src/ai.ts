// =============================================================================
// AI Platform Types
// =============================================================================

import type { UUID, ISODateString } from './common';

export type AgentName =
  | 'supervisor'
  | 'crm'
  | 'sales'
  | 'workflow'
  | 'support'
  | 'finance'
  | 'reporting'
  | 'knowledge'
  | 'email';

export interface AgentRequest {
  task: string;
  context?: Record<string, unknown>;
  sessionId?: UUID;
  stream?: boolean;
}

export interface AgentResponse {
  response: string;
  actions?: AgentAction[];
  citations?: Citation[];
  sessionId: UUID;
  model: string;
  tokensUsed: number;
  latencyMs: number;
}

export interface AgentAction {
  type: string;
  payload: Record<string, unknown>;
}

export interface Citation {
  id: number;
  documentTitle: string;
  documentId: UUID;
  chunkText: string;
  pageNumber?: number;
  score: number;
}

export interface Conversation {
  id: UUID;
  tenantId: UUID;
  userId: UUID;
  agentName: AgentName;
  messages: ConversationMessage[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: ISODateString;
  model?: string;
  citations?: Citation[];
}

export interface EmbeddingRequest {
  text: string | string[];
  model?: string;
}

export interface EmbeddingResponse {
  embeddings: number[][];
  model: string;
  tokensUsed: number;
}
