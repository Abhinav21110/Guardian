import type { ErrorRequestHandler } from 'express';
import { logger } from '../config/logger';

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  logger.error({ err }, 'Unhandled error');
  if (res.headersSent) return next(err);
  const status = (err as any).statusCode || 500;
  res.status(status).json({
    error: true,
    message: status === 500 ? 'Internal Server Error' : (err as any).message,
  });
};
