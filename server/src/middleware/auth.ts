// ─────────────────────────────────────────────────────────────────────────────
// Guardian AI – API Key Authentication Middleware
// ─────────────────────────────────────────────────────────────────────────────
import type { RequestHandler } from 'express';
import { config } from '../config/env';

/**
 * If API_KEY env var is set, enforce it on all requests.
 * The key must be sent in the header configured by API_KEY_HEADER (default: x-api-key).
 * Requests from localhost are allowed without a key in development mode.
 */
export const apiKeyAuth: RequestHandler = (req, res, next) => {
  // No key configured – open access
  if (!config.api.apiKey) return next();

  // Allow localhost in development
  if (config.nodeEnv === 'development') {
    const ip = req.ip ?? '';
    if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('::ffff:127.')) return next();
  }

  const provided = req.headers[config.api.apiKeyHeader.toLowerCase()] as string | undefined;
  if (!provided || provided !== config.api.apiKey) {
    res.status(401).json({ error: true, message: 'Invalid or missing API key' });
    return;
  }
  next();
};
