import pino from 'pino';
import { env } from '../config/env.js';

const transport = env.LOG_PRETTY
  ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    }
  : undefined;

export const logger = pino({
  level: env.LOG_LEVEL,
  transport,
  base: {
    service: 'happy-feet-api',
    environment: env.NODE_ENV,
  },
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export function createChildLogger(bindings: Record<string, unknown>) {
  return logger.child(bindings);
}

export const auditLogger = createChildLogger({ type: 'audit' });
export const securityLogger = createChildLogger({ type: 'security' });
export const paymentLogger = createChildLogger({ type: 'payment' });
export const performanceLogger = createChildLogger({ type: 'performance' });
