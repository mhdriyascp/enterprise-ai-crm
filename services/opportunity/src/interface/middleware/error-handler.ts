import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

import { isAppError } from '@crm/common';
import type { Logger } from '@crm/logging';

// =============================================================================
// Centralised error handler — maps errors to the standard API error envelope.
// =============================================================================

export function createErrorHandler(logger: Logger) {
  return function errorHandler(
    error: FastifyError,
    request: FastifyRequest,
    reply: FastifyReply,
  ): void {
    const requestId = request.id;
    const meta = { requestId, timestamp: new Date().toISOString() };

    if (error instanceof ZodError) {
      reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed.',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        meta,
      });
      return;
    }

    if (isAppError(error)) {
      if (error.statusCode >= 500) {
        logger.error({ err: error, requestId }, 'Application error');
      }
      reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details } : {}),
        },
        meta,
      });
      return;
    }

    if (error.validation) {
      reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: error.message },
        meta,
      });
      return;
    }

    logger.error({ err: error, requestId }, 'Unhandled error');
    reply.status(error.statusCode ?? 500).send({
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
      meta,
    });
  };
}
