import { randomBytes, createHash } from 'crypto';

// =============================================================================
// Cryptography Utilities
// =============================================================================

/**
 * Generate a cryptographically secure random string.
 */
export function generateSecureToken(byteLength = 32): string {
  return randomBytes(byteLength).toString('hex');
}

/**
 * Generate an API key with a prefix for identification.
 * Format: crm_{prefix}_{random}
 */
export function generateApiKey(prefix = 'key'): { key: string; prefix: string } {
  const random = randomBytes(32).toString('base64url');
  const key = `crm_${prefix}_${random}`;
  return { key, prefix: key.substring(0, 16) };
}

/**
 * Hash a value using SHA-256.
 */
export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/**
 * Mask a string for safe display (e.g., API keys in logs).
 * Shows first 8 and last 4 characters.
 */
export function maskSecret(value: string): string {
  if (value.length <= 12) return '***';
  return `${value.substring(0, 8)}...${value.substring(value.length - 4)}`;
}
