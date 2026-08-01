import type { FastifyInstance, FastifyRequest, preHandlerHookHandler } from 'fastify';

import { extractBearerToken } from '@crm/auth';
import { UnauthorizedError } from '@crm/common';

import type {
  DeviceRegistry,
  MobilePrincipal,
  MobileService,
} from '../../application/services/mobile.service';
import { requirePrincipal } from '../middleware/authenticate';
import { RegisterDeviceSchema, SyncQuerySchema } from '../dtos';

// =============================================================================
// Mobile BFF routes — /mobile/v1/*
// =============================================================================

function principalOf(request: FastifyRequest): MobilePrincipal {
  const principal = requirePrincipal(request);
  return {
    userId: principal.userId,
    tenantId: principal.tenantId,
    email: principal.email,
    roles: principal.roles,
  };
}

function tokenOf(request: FastifyRequest): string {
  const token = extractBearerToken(request.headers.authorization);
  if (!token) throw new UnauthorizedError('Missing bearer token.');
  return token;
}

export interface MobileRoutesDeps {
  service: MobileService;
  devices: DeviceRegistry;
  authenticate: preHandlerHookHandler;
}

export function registerMobileRoutes(app: FastifyInstance, deps: MobileRoutesDeps): void {
  const { service, devices, authenticate } = deps;
  const tags = ['Mobile'];
  const security = [{ bearerAuth: [] }];
  const guard = { preHandler: [authenticate] };

  app.get(
    '/bootstrap',
    { ...guard, schema: { tags, summary: 'App startup payload (profile + counts)', security } },
    async (request, reply) => {
      const payload = await service.bootstrap(principalOf(request), tokenOf(request));
      reply.send({ data: payload });
    },
  );

  app.get(
    '/sync',
    { ...guard, schema: { tags, summary: 'Delta sync of core entities', security } },
    async (request, reply) => {
      const query = SyncQuerySchema.parse(request.query);
      const payload = await service.sync(tokenOf(request), query);
      reply.send({ data: payload });
    },
  );

  app.post(
    '/devices',
    { ...guard, schema: { tags, summary: 'Register a push notification device', security } },
    async (request, reply) => {
      const body = RegisterDeviceSchema.parse(request.body);
      const record = devices.register(principalOf(request), body);
      reply.status(201).send({ data: record });
    },
  );

  app.delete(
    '/devices/:token',
    { ...guard, schema: { tags, summary: 'Unregister a push notification device', security } },
    async (request, reply) => {
      const { token } = request.params as { token: string };
      devices.unregister(principalOf(request), token);
      reply.status(204).send();
    },
  );

  app.get(
    '/devices',
    { ...guard, schema: { tags, summary: 'List the caller\u2019s registered devices', security } },
    async (request, reply) => {
      const principal = principalOf(request);
      reply.send({ data: devices.listForUser(principal.userId) });
    },
  );
}
