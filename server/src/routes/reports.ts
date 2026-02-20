// ─────────────────────────────────────────────────────────────────────────────
// Guardian AI – Reports Router
// GET  /api/reports      – list recent scans
// GET  /api/reports/:id  – single scan detail
// ─────────────────────────────────────────────────────────────────────────────
import { Router } from 'express';
import { validateQuery, paginationSchema } from '../middleware/validate';
import { getRecentScans, getScanById } from '../services/database';
import { logger } from '../config/logger';

export const reportsRouter = Router();

reportsRouter.get('/', validateQuery(paginationSchema), async (req, res, next) => {
  try {
    const { limit, offset } = (req as unknown as { validatedQuery: { limit: number; offset: number } }).validatedQuery;
    const scans = await getRecentScans(limit, offset);
    res.json({ reports: scans, count: scans.length, limit, offset });
  } catch (err) {
    next(err);
  }
});

reportsRouter.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
      return res.status(400).json({ error: true, message: 'Invalid ID' });
    }
    const scan = await getScanById(id);
    if (!scan) return res.status(404).json({ error: true, message: 'Report not found' });
    return res.json(scan);
  } catch (err) {
    logger.error({ err }, 'Report fetch error');
    next(err);
  }
});
