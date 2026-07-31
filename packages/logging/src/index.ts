import pino from 'pino';

// =============================================================================
// @crm/logging — Shared Structured Logging
// =============================================================================

export interface LoggerOptions {
  serviceName: string;
  serviceVersion?: string;
  level?: 'debug' | 'info' | 'warn' | 'error';
  pretty?: boolean;
}

/**
 * Create a structured logger with standard CRM platform fields.
 */
export function createLogger(options: LoggerOptions): pino.Logger {
  const { serviceName, serviceVersion = '0.1.0', level = 'info', pretty } = options;

  const transport =
    pretty || process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined;

  return pino({
    level,
    transport,
    base: {
      service: serviceName,
      version: serviceVersion,
      env: process.env.NODE_ENV ?? 'development',
    },
    serializers: {
      err: pino.stdSerializers.err,
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
    },
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers["x-api-key"]',
        '*.password',
        '*.token',
        '*.secret',
        '*.apiKey',
      ],
      remove: true,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  });
}

export type Logger = pino.Logger;
export { pino };
