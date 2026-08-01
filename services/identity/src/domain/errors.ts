import { AppError } from '@crm/common';

// =============================================================================
// Identity Service — Domain Errors
// Extends the shared AppError hierarchy with identity-specific errors.
// =============================================================================

export class InvalidCredentialsError extends AppError {
  constructor(message = 'Invalid email or password.') {
    super(message, 'INVALID_CREDENTIALS', 401);
  }
}

export class TokenInvalidError extends AppError {
  constructor(message = 'The provided token is invalid or expired.') {
    super(message, 'TOKEN_INVALID', 401);
  }
}

export class UserInactiveError extends AppError {
  constructor(message = 'This user account is not active.') {
    super(message, 'USER_INACTIVE', 403);
  }
}

export class ApiKeyInvalidError extends AppError {
  constructor(message = 'The provided API key is invalid, revoked, or expired.') {
    super(message, 'API_KEY_INVALID', 401);
  }
}
