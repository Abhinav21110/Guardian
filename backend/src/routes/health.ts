/**
 * Health Check Routes
 */

import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/database';
import { CacheService } from '../services/cache';
import { asyncHandler } from '../middleware/error';
import { HealthCheckResponse } from '../types';

const router = Router();
const db = new DatabaseService();
const cache = new CacheService();

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const services = {
    database: false,
    cache: false,
    api: true
  };

  // Check database
  try {
    await db.connect();
    services.database = true;
    await db.disconnect();
  } catch (error) {
    services.database = false;
  }

  // Check cache
  try {
    await cache.connect();
    services.cache = true;
    await cache.disconnect();
  } catch (error) {
    services.cache = false;
  }

  const allHealthy = Object.values(services).every(s => s);
  const status = allHealthy ? 'healthy' : 'degraded';

  const response: HealthCheckResponse = {
    status,
    timestamp: new Date().toISOString(),
    services,
    version: process.env.npm_package_version || '1.0.0'
  };

  res.status(allHealthy ? 200 : 503).json(response);
}));

/**
 * GET /api/health/ping
 * Simple ping endpoint
 */
router.get('/ping', (req: Request, res: Response) => {
  res.json({ 
    success: true, 
    message: 'pong',
    timestamp: new Date().toISOString()
  });
});

export default router;
