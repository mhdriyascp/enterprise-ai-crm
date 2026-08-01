import type { FastifyInstance, preHandlerHookHandler } from 'fastify';

import { buildPaginatedResult } from '@crm/common';

import type { ContactService } from '../../application/services/contact.service';
import { requirePrincipal } from '../middleware/authenticate';
import {
  CreateContactSchema,
  IdParamSchema,
  ListContactsQuerySchema,
  UpdateContactSchema,
} from '../dtos';

// =============================================================================
// Contact routes — /api/v1/contacts
// =============================================================================

export function registerContactRoutes(
  app: FastifyInstance,
  service: ContactService,
  authenticate: preHandlerHookHandler,
): void {
  const tags = ['Contacts'];
  const security = [{ bearerAuth: [] }];

  app.post(
    '/',
    { preHandler: [authenticate], schema: { tags, summary: 'Create a contact', security } },
    async (request, reply) => {
      const principal = requirePrincipal(request);
      const body = CreateContactSchema.parse(request.body);
      const contact = await service.create({ tenantId: principal.tenantId }, body);
      reply.status(201).send({ data: contact });
    },
  );

  app.get(
    '/',
    { preHandler: [authenticate], schema: { tags, summary: 'List contacts', security } },
    async (request, reply) => {
      const principal = requirePrincipal(request);
      const query = ListContactsQuerySchema.parse(request.query);
      const { data, total } = await service.list({ tenantId: principal.tenantId }, query);
      reply.send(buildPaginatedResult(data, total, query.page, query.limit, request.id));
    },
  );

  app.get(
    '/:id',
    { preHandler: [authenticate], schema: { tags, summary: 'Get a contact', security } },
    async (request, reply) => {
      const principal = requirePrincipal(request);
      const { id } = IdParamSchema.parse(request.params);
      reply.send({ data: await service.findById({ tenantId: principal.tenantId }, id) });
    },
  );

  app.patch(
    '/:id',
    { preHandler: [authenticate], schema: { tags, summary: 'Update a contact', security } },
    async (request, reply) => {
      const principal = requirePrincipal(request);
      const { id } = IdParamSchema.parse(request.params);
      const body = UpdateContactSchema.parse(request.body);
      reply.send({ data: await service.update({ tenantId: principal.tenantId }, id, body) });
    },
  );

  app.delete(
    '/:id',
    { preHandler: [authenticate], schema: { tags, summary: 'Soft-delete a contact', security } },
    async (request, reply) => {
      const principal = requirePrincipal(request);
      const { id } = IdParamSchema.parse(request.params);
      await service.softDelete({ tenantId: principal.tenantId }, id);
      reply.status(204).send();
    },
  );
}
