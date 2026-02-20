// ─────────────────────────────────────────────────────────────────────────────
// Guardian AI – URL Scan Router
// POST /api/scan/url    – single URL scan
// POST /api/scan/batch  – batch URL scan (max 10)
// GET  /api/scan/:id    – retrieve a previous scan result
// ─────────────────────────────────────────────────────────────────────────────
import { Router } from 'express';
import crypto from 'node:crypto';
import { validateBody } from '../middleware/validate';
import { scanUrlBodySchema, batchScanBodySchema } from '../middleware/validate';
import { analyseUrl } from '../services/ml-analyzer';
import { analyseSemantically } from '../services/llm-analyzer';
import { gatherThreatIntel } from '../services/threat-intelligence';
import { fuseRiskScores } from '../services/risk-fusion';
import { BlockchainService } from '../services/blockchain';
import { cacheGet, cacheSet, buildScanCacheKey } from '../services/cache';
import { persistScan, getScanById } from '../services/database';
import { config } from '../config/env';
import { logger } from '../config/logger';
import type { ScanResult, ScanUrlRequest } from '../types/index';

export const scanRouter = Router();

const blockchain = new BlockchainService();

// ─── Single URL scan ──────────────────────────────────────────────────────────

scanRouter.post('/url', validateBody(scanUrlBodySchema), async (req, res, next) => {
  try {
    const { url, options = {} } = req.body as ScanUrlRequest;
    const t0 = Date.now();

    // Cache check
    const cacheKey = buildScanCacheKey(url);
    const cached = await cacheGet<ScanResult>(cacheKey);
    if (cached) {
      logger.debug({ url }, 'Cache hit');
      return res.json({ ...cached, cached: true });
    }

    // Run analyses in parallel
    const [ml, llm, threatIntel] = await Promise.all([
      config.features.ml && !options.skipMl
        ? analyseUrl(url).catch(err => { logger.warn({ err }, 'ML analysis error'); return null; })
        : Promise.resolve(null),
      config.features.llm && !options.skipLlm
        ? analyseSemantically(url, 'URL').catch(err => { logger.warn({ err }, 'LLM analysis error'); return null; })
        : Promise.resolve(null),
      config.features.threatIntel && !options.skipThreatIntel
        ? gatherThreatIntel(url).catch(err => { logger.warn({ err }, 'Threat intel error'); return null; })
        : Promise.resolve(null),
    ]);

    const fusion = fuseRiskScores(ml, llm, threatIntel);

    // Optional blockchain anchoring
    let anchored = false, txHash: string | undefined, chainId: number | undefined;
    if (config.features.blockchain && !options.skipBlockchain) {
      try {
        const hashHex = '0x' + crypto.createHash('sha256').update(url).digest('hex');
        const anchorResult = await blockchain.anchorHash(hashHex);
        anchored = true;
        txHash = anchorResult.txHash;
        chainId = anchorResult.chainId;
      } catch { /* anchoring optional */ }
    }

    const result: ScanResult = {
      scanId: crypto.randomUUID(),
      input: url,
      inputType: 'URL',
      timestamp: new Date().toISOString(),
      ml,
      llm,
      threatIntel,
      fusion,
      anchored,
      txHash,
      chainId,
      processingMs: Date.now() - t0,
    };

    await Promise.allSettled([
      cacheSet(cacheKey, result),
      persistScan(result),
    ]);

    logger.info({ url, riskScore: fusion.unifiedRiskScore, tier: fusion.tier, ms: result.processingMs }, 'Scan complete');
    return res.json(result);

  } catch (err) {
    next(err);
  }
});

// ─── Batch scan ───────────────────────────────────────────────────────────────

scanRouter.post('/batch', validateBody(batchScanBodySchema), async (req, res, next) => {
  try {
    const { urls, options = {} } = req.body as { urls: string[]; options?: ScanUrlRequest['options'] };

    const results = await Promise.all(
      urls.map(async (url): Promise<ScanResult> => {
        const t0 = Date.now();
        const cacheKey = buildScanCacheKey(url);
        const cached = await cacheGet<ScanResult>(cacheKey);
        if (cached) return { ...cached, cached: true } as ScanResult;

        const [ml, llm, threatIntel] = await Promise.all([
          config.features.ml && !options?.skipMl ? analyseUrl(url).catch(() => null) : null,
          config.features.llm && !options?.skipLlm ? analyseSemantically(url, 'URL').catch(() => null) : null,
          config.features.threatIntel && !options?.skipThreatIntel ? gatherThreatIntel(url).catch(() => null) : null,
        ]);

        const fusion = fuseRiskScores(ml, llm, threatIntel);
        const result: ScanResult = {
          scanId: crypto.randomUUID(),
          input: url,
          inputType: 'URL',
          timestamp: new Date().toISOString(),
          ml, llm, threatIntel, fusion,
          anchored: false,
          processingMs: Date.now() - t0,
        };

        await Promise.allSettled([cacheSet(cacheKey, result), persistScan(result)]);
        return result;
      }),
    );

    res.json({ results, count: results.length });
  } catch (err) {
    next(err);
  }
});

// ─── Get scan by ID ───────────────────────────────────────────────────────────

scanRouter.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
      return res.status(400).json({ error: true, message: 'Invalid scan ID' });
    }
    const scan = await getScanById(id);
    if (!scan) return res.status(404).json({ error: true, message: 'Scan not found' });
    return res.json(scan);
  } catch (err) {
    next(err);
  }
});
