/**
 * Request Validation Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from './error';

/**
 * Validate URL scan request
 */
export const validateUrlScan = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { url } = req.body;

  if (!url) {
    throw new AppError('URL is required', 400);
  }

  if (typeof url !== 'string') {
    throw new AppError('URL must be a string', 400);
  }

  // Basic URL validation
  try {
    new URL(url);
  } catch (error) {
    throw new AppError('Invalid URL format', 400);
  }

  next();
};

/**
 * Validate email scan request
 */
export const validateEmailScan = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { from, to, subject, body } = req.body;

  if (!from || !to || !subject || !body) {
    throw new AppError('Missing required email fields', 400);
  }

  if (!from.includes('@') || !to.includes('@')) {
    throw new AppError('Invalid email address format', 400);
  }

  next();
};

/**
 * Validate pagination parameters
 */
export const validatePagination = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { limit } = req.query;

  if (limit) {
    const limitNum = parseInt(limit as string);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
      throw new AppError('Limit must be between 1 and 1000', 400);
    }
    req.query.limit = limitNum.toString();
  }

  next();
};
