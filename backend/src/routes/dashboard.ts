/**
 * Dashboard Routes
 */

import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/database';
import { asyncHandler } from '../middleware/error';
import { validatePagination } from '../middleware/validate';
import { DashboardStats, ApiResponse } from '../types';
import logger from '../config/logger';

const router = Router();
const db = new DatabaseService();

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics
 */
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  await db.connect();

  // Get statistics
  const stats = await db.getStatistics();
  const recentScans = await db.getRecentScans(10);

  const dashboardStats: DashboardStats = {
    totalScans: parseInt(stats.total_scans) || 0,
    phishingDetected: parseInt(stats.phishing_detected) || 0,
    highRisk: parseInt(stats.high_risk) || 0,
    suspicious: parseInt(stats.suspicious) || 0,
    safe: parseInt(stats.safe) || 0,
    avgRiskScore: parseFloat(stats.avg_risk_score) || 0,
    recentScans: recentScans.map(scan => ({
      id: scan.id || '',
      url: scan.url,
      riskScore: scan.finalRiskScore,
      classification: scan.classification,
      timestamp: scan.timestamp.toISOString()
    }))
  };

  await db.disconnect();

  logger.info('Dashboard stats retrieved');

  res.json({
    success: true,
    data: dashboardStats,
    timestamp: new Date().toISOString()
  } as ApiResponse<DashboardStats>);
}));

/**
 * GET /api/dashboard/recent
 * Get recent scans
 */
router.get('/recent', validatePagination, asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100;

  await db.connect();
  const scans = await db.getRecentScans(limit);
  await db.disconnect();

  res.json({
    success: true,
    data: scans,
    timestamp: new Date().toISOString()
  } as ApiResponse);
}));

export default router;
