/**
 * Security Middleware
 */

import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import config from '../config/env';
import { CacheService } from '../services/cache';

const cache = new CacheService();

/**
 * CORS configuration
 */
export const corsMiddleware = cors({
  origin: config.security.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
});

/**
 * Helmet security headers
 */
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

/**
 * Rate limiting middleware
 */
export const rateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const identifier = req.ip || 'unknown';
    const key = `ratelimit:${identifier}`;
    
    await cache.connect().catch(() => {});
    
    const count = await cache.incrementRateLimit(
      identifier,
      config.security.rateLimitWindow
    );

    if (count > config.security.rateLimitMax) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.',
        timestamp: new Date().toISOString()
      });
    }

    next();
  } catch (error) {
    // If rate limiting fails, allow request to proceed
    next();
  }
};

/**
 * Request sanitization
 */
export const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Remove potentially harmful characters from inputs
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.replace(/[<>]/g, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        obj[key] = sanitize(obj[key]);
      }
    }
    return obj;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);

  next();
};
