import { z } from 'zod';

import { AGENT_NAMES } from '../../agents/definitions';

// =============================================================================
// AI Platform — Request DTO schemas (zod).
// =============================================================================

const agentNameValues = AGENT_NAMES as [string, ...string[]];

export const AgentInvokeSchema = z.object({
  task: z.string().min(1).max(8000),
  context: z.record(z.unknown()).optional(),
  sessionId: z.string().uuid().optional(),
  stream: z.boolean().optional(),
});

export const AgentNameParamSchema = z.object({
  name: z.enum(agentNameValues),
});

export const EmbedSchema = z.object({
  text: z.union([z.string().min(1), z.array(z.string().min(1)).min(1).max(100)]),
  model: z.string().min(1).max(120).optional(),
});

export const IngestDocumentSchema = z.object({
  title: z.string().min(1).max(300),
  content: z.string().min(1).max(1_000_000),
  source: z.string().max(500).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const RagSearchSchema = z.object({
  query: z.string().min(1).max(4000),
  topK: z.coerce.number().int().min(1).max(50).optional(),
});

export const RagQuerySchema = z.object({
  query: z.string().min(1).max(4000),
  topK: z.coerce.number().int().min(1).max(50).optional(),
  model: z.string().min(1).max(120).optional(),
});

export const IdParamSchema = z.object({ id: z.string().uuid() });

export const ListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type AgentInvokeInput = z.infer<typeof AgentInvokeSchema>;
export type EmbedInput = z.infer<typeof EmbedSchema>;
export type IngestDocumentInput = z.infer<typeof IngestDocumentSchema>;
export type RagSearchInput = z.infer<typeof RagSearchSchema>;
export type RagQueryInput = z.infer<typeof RagQuerySchema>;
export type ListQuery = z.infer<typeof ListQuerySchema>;
