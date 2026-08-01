// =============================================================================
// Application Error Classes
// =============================================================================

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    details?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id
      ? `${resource} with ID ${id} was not found.`
      : `${resource} was not found.`;
    super(message, 'RESOURCE_NOT_FOUND', 404);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required.') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Insufficient permissions.') {
    super(message, 'FORBIDDEN', 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'DUPLICATE_RESOURCE', 409);
  }
}

export class TenantNotFoundError extends AppError {
  constructor(tenantId: string) {
    super(`Tenant ${tenantId} was not found.`, 'TENANT_NOT_FOUND', 404);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded.') {
    super(message, 'RATE_LIMIT_EXCEEDED', 429);
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
