import type { FastifyInstance, FastifyRequest, preHandlerHookHandler } from 'fastify';

import type { AgentName } from '@crm/types';

import type { AgentRegistry } from '../../agents/registry';
import type { AiContext } from '../../application/context';
import { requirePrincipal } from '../middleware/authenticate';
import { AgentInvokeSchema, AgentNameParamSchema } from '../dtos';

// =============================================================================
// Agent routes — /api/v1/ai/agents
// =============================================================================

function contextFrom(request: FastifyRequest): AiContext {
  const principal = requirePrincipal(request);
  return { tenantId: principal.tenantId, userId: principal.userId, correlationId: request.id };
}

export function registerAgentRoutes(
  app: FastifyInstance,
  registry: AgentRegistry,
  authenticate: preHandlerHookHandler,
): void {
  const tags = ['Agents'];
  const security = [{ bearerAuth: [] }];

  app.get(
    '/agents',
    { schema: { tags, summary: 'List available agents' } },
    async (_request, reply) => {
      reply.send({
        data: registry.list().map((a) => ({
          name: a.name,
          title: a.title,
          description: a.description,
          tools: a.tools.map((t) => t.name),
        })),
      });
    },
  );

  app.post(
    '/agents/:name/invoke',
    { preHandler: [authenticate], schema: { tags, summary: 'Invoke a specific agent', security } },
    async (request, reply) => {
      const { name } = AgentNameParamSchema.parse(request.params);
      const body = AgentInvokeSchema.parse(request.body);
      const result = await registry.invoke(name as AgentName, contextFrom(request), body);
      reply.send({ data: result });
    },
  );

  app.post(
    '/agents/invoke',
    {
      preHandler: [authenticate],
      schema: { tags, summary: 'Invoke via the supervisor (auto-routed)', security },
    },
    async (request, reply) => {
      const body = AgentInvokeSchema.parse(request.body);
      const result = await registry.invoke('supervisor', contextFrom(request), body);
      reply.send({ data: result });
    },
  );
}
