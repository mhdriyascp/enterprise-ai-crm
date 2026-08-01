// =============================================================================
// Date Utilities
// =============================================================================

/**
 * Returns the current timestamp as an ISO 8601 string.
 */
export function now(): string {
  return new Date().toISOString();
}

/**
 * Adds days to a date and returns ISO string.
 */
export function addDays(date: Date | string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/**
 * Checks if a date is in the past.
 */
export function isPast(date: Date | string): boolean {
  return new Date(date) < new Date();
}

/**
 * Checks if a date is in the future.
 */
export function isFuture(date: Date | string): boolean {
  return new Date(date) > new Date();
}

/**
 * Format a date for display.
 */
export function formatDate(
  date: Date | string,
  locale = 'en-US',
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' },
): string {
  return new Intl.DateTimeFormat(locale, options).format(new Date(date));
}
