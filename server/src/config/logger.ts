import pino from 'pino';

const isDevelopment = process.env.NODE_ENV !== 'production';

export const logger = isDevelopment
  ? pino({ level: process.env.LOG_LEVEL || 'debug' }, pino.transport({ target: 'pino-pretty', options: { colorize: true, translateTime: true, singleLine: true } }))
  : pino({ level: process.env.LOG_LEVEL || 'info' });
