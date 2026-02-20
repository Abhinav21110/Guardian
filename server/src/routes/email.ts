// ─────────────────────────────────────────────────────────────────────────────
// Guardian AI – Email Analysis Router
// POST /api/email/analyse – analyse an email for threats
// ─────────────────────────────────────────────────────────────────────────────
import { Router } from 'express';
import { validateBody, emailBodySchema } from '../middleware/validate';
import { analyseEmail } from '../services/email-analyzer';
import { persistScan } from '../services/database';
import { logger } from '../config/logger';
import type { EmailAnalysisRequest } from '../types/index';

export const emailRouter = Router();

emailRouter.post('/analyse', validateBody(emailBodySchema), async (req, res, next) => {
  try {
    const emailReq = req.body as EmailAnalysisRequest;
    const result = await analyseEmail(emailReq);

    // Persist parent email scan + all sub-URL scans
    await Promise.allSettled([
      persistScan(result),
      ...result.urlResults.map(r => persistScan(r)),
    ]);

    res.json(result);
  } catch (err) {
    logger.error({ err }, 'Email analysis route error');
    next(err);
  }
});
