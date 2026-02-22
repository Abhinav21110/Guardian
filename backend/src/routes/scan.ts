/**
 * URL Scan Routes
 */

import { Router, Request, Response } from 'express';
import { MLAnalyzerService } from '../services/ml-analyzer';
import { LLMAnalyzerService } from '../services/llm-analyzer';
import { ThreatIntelligenceService } from '../services/threat-intelligence';
import { RiskFusionEngine } from '../services/risk-fusion';
import { DatabaseService } from '../services/database';
import { CacheService } from '../services/cache';
import { asyncHandler } from '../middleware/error';
import { validateUrlScan } from '../middleware/validate';
import { ScanRequest, ScanResponse, ApiResponse } from '../types';
import logger from '../config/logger';

const router = Router();

// Initialize services
const mlAnalyzer = new MLAnalyzerService();
const llmAnalyzer = new LLMAnalyzerService();
const threatIntel = new ThreatIntelligenceService();
const riskFusion = new RiskFusionEngine();
const db = new DatabaseService();
const cache = new CacheService();

/**
 * POST /api/scan/url
 * Scan a URL for phishing indicators
 */
router.post('/', validateUrlScan, asyncHandler(async (req: Request, res: Response) => {
  const { url, userAgent, ipAddress }: ScanRequest = req.body;

  logger.info(`URL scan requested: ${url}`);

  // Check cache first
  await cache.connect();
  const cacheKey = cache.urlScanKey(url);
  const cached = await cache.get<ScanResponse>(cacheKey);
  
  if (cached) {
    logger.info(`Cache hit for URL: ${url}`);
    return res.json({
      success: true,
      data: cached,
      timestamp: new Date().toISOString()
    } as ApiResponse<ScanResponse>);
  }

  // Perform analysis
  logger.info('Running ML analysis...');
  const mlResult = await mlAnalyzer.analyzeURL(url);

  logger.info('Running LLM analysis...');
  // For URL scan, we'd need to fetch the page content first
  // For now, we'll skip LLM or use URL-based analysis
  const llmResult = await llmAnalyzer.analyzeContent(`URL: ${url}`, '');

  logger.info('Running threat intelligence lookup...');
  const threatResult = await threatIntel.analyzeThreat(url);

  logger.info('Fusing risk scores...');
  const assessment = await riskFusion.fuseRiskScores(
    mlResult,
    llmResult,
    threatResult
  );

  // Store in database
  await db.connect();
  const scanId = await db.storeScan({
    url,
    finalRiskScore: assessment.finalRiskScore,
    classification: assessment.classification,
    confidence: assessment.confidence,
    mlScore: assessment.breakdown.mlScore,
    llmScore: assessment.breakdown.llmScore,
    threatScore: assessment.breakdown.threatScore,
    scanType: 'url',
    userAgent,
    ipAddress,
    timestamp: assessment.timestamp,
    fullReport: assessment
  });

  const response: ScanResponse = {
    scanId,
    url,
    finalRiskScore: assessment.finalRiskScore,
    classification: assessment.classification,
    confidence: assessment.confidence,
    breakdown: assessment.breakdown,
    explanation: assessment.explanation,
    timestamp: assessment.timestamp.toISOString()
  };

  // Cache the result
  await cache.set(cacheKey, response, 3600);

  logger.info(`Scan completed for ${url} - Risk Score: ${assessment.finalRiskScore}`);

  res.json({
    success: true,
    data: response,
    timestamp: new Date().toISOString()
  } as ApiResponse<ScanResponse>);

  // Cleanup connections
  await db.disconnect();
  await cache.disconnect();
}));

/**
 * GET /api/scan/:scanId
 * Retrieve scan result by ID
 */
router.get('/:scanId', asyncHandler(async (req: Request, res: Response) => {
  const { scanId } = req.params;

  await db.connect();
  const scan = await db.getScanById(scanId);
  await db.disconnect();

  if (!scan) {
    return res.status(404).json({
      success: false,
      error: 'Scan not found',
      timestamp: new Date().toISOString()
    } as ApiResponse);
  }

  res.json({
    success: true,
    data: scan,
    timestamp: new Date().toISOString()
  } as ApiResponse);
}));

export default router;
