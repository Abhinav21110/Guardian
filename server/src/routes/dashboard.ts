// ─────────────────────────────────────────────────────────────────────────────
// Guardian AI – Dashboard Router
// GET /api/dashboard/stats   – aggregated SOC-style dashboard statistics
// GET /api/dashboard/recent  – recent scans feed
// ─────────────────────────────────────────────────────────────────────────────
import { Router } from 'express';
import { validateQuery, paginationSchema } from '../middleware/validate';
import { getDashboardStats, getRecentScans } from '../services/database';
import { cacheGet, cacheSet } from '../services/cache';
import { logger } from '../config/logger';

export const dashboardRouter = Router();

const STATS_CACHE_KEY = 'guardian:dashboard:stats';
const STATS_TTL = 30; // seconds – low for near-real-time feel

// ─── Dashboard stats ──────────────────────────────────────────────────────────

dashboardRouter.get('/stats', async (_req, res, next) => {
  try {
    const cached = await cacheGet(STATS_CACHE_KEY);
    if (cached) return res.json(cached);

    const stats = await getDashboardStats();
    await cacheSet(STATS_CACHE_KEY, stats, STATS_TTL);
    return res.json(stats);
  } catch (err) {
    logger.error({ err }, 'Dashboard stats error');
    next(err);
  }
});

// ─── Recent scans feed ────────────────────────────────────────────────────────

dashboardRouter.get('/recent', validateQuery(paginationSchema), async (req, res, next) => {
  try {
    const { limit, offset } = (req as unknown as { validatedQuery: { limit: number; offset: number } }).validatedQuery;
    const scans = await getRecentScans(limit, offset);
    res.json({ scans, limit, offset, count: scans.length });
  } catch (err) {
    next(err);
  }
});
