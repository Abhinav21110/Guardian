// ─────────────────────────────────────────────────────────────────────────────
// Guardian AI – Threats Router
// GET /api/threats/feed   – recent high-risk / confirmed phishing entries
// GET /api/threats/stats  – category breakdown
// ─────────────────────────────────────────────────────────────────────────────
import { Router } from 'express';
import { getRecentScans } from '../services/database';
import type { RiskTier } from '../types/index';

export const threatsRouter = Router();

const HIGH_TIERS: RiskTier[] = ['HIGH_RISK', 'CONFIRMED_PHISHING'];

threatsRouter.get('/feed', async (_req, res, next) => {
  try {
    const scans = await getRecentScans(100, 0);
    const threats = scans.filter(s => HIGH_TIERS.includes(s.fusion.tier));
    res.json({ threats, count: threats.length });
  } catch (err) {
    next(err);
  }
});

threatsRouter.get('/stats', async (_req, res, next) => {
  try {
    const scans = await getRecentScans(500, 0);
    const byCategory: Record<string, number> = {};
    const byTier: Record<string, number> = {};

    for (const s of scans) {
      byCategory[s.fusion.attackCategory] = (byCategory[s.fusion.attackCategory] ?? 0) + 1;
      byTier[s.fusion.tier]               = (byTier[s.fusion.tier] ?? 0) + 1;
    }

    res.json({ byCategory, byTier, totalAnalysed: scans.length });
  } catch (err) {
    next(err);
  }
});
