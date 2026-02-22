/**
 * Email Scan Routes
 */

import { Router, Request, Response } from 'express';
import { EmailAnalyzerService } from '../services/email-analyzer';
import { DatabaseService } from '../services/database';
import { asyncHandler } from '../middleware/error';
import { validateEmailScan } from '../middleware/validate';
import { EmailScanRequest, ApiResponse } from '../types';
import logger from '../config/logger';

const router = Router();

const emailAnalyzer = new EmailAnalyzerService();
const db = new DatabaseService();

/**
 * POST /api/email/scan
 * Analyze email for phishing indicators
 */
router.post('/scan', validateEmailScan, asyncHandler(async (req: Request, res: Response) => {
  const emailData: EmailScanRequest = req.body;

  logger.info(`Email scan requested from: ${emailData.from}`);

  // Analyze email
  const analysis = await emailAnalyzer.analyzeEmail(emailData);

  // Store in database
  await db.connect();
  const scanId = await db.storeScan({
    url: `Email from ${emailData.from}`,
    finalRiskScore: analysis.overallRisk,
    classification: analysis.isPhishing ? 'confirmed_phishing' : 'safe',
    confidence: 85,
    mlScore: analysis.analysis.sender.riskScore,
    llmScore: analysis.analysis.content.semanticRiskScore,
    threatScore: analysis.analysis.headers.riskScore,
    scanType: 'email',
    timestamp: new Date(),
    fullReport: analysis
  });
  await db.disconnect();

  const response = {
    scanId,
    overallRisk: analysis.overallRisk,
    isPhishing: analysis.isPhishing,
    analysis: analysis.analysis,
    explanation: analysis.explanation,
    timestamp: new Date().toISOString()
  };

  logger.info(`Email scan completed - Risk Score: ${analysis.overallRisk}`);

  res.json({
    success: true,
    data: response,
    timestamp: new Date().toISOString()
  } as ApiResponse);
}));

export default router;
