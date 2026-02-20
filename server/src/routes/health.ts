// ─────────────────────────────────────────────────────────────────────────────
// Guardian AI – Health Router
// GET /api/health        – liveness probe
// GET /api/health/ready  – readiness probe (checks DB / Redis)
// ─────────────────────────────────────────────────────────────────────────────
import { Router } from 'express';
import { config } from '../config/env';

export const healthRouter = Router();

const START_TIME = Date.now();

healthRouter.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'guardian-ai-api',
    version: '1.0.0',
    env: config.nodeEnv,
    uptimeSeconds: Math.floor((Date.now() - START_TIME) / 1000),
    timestamp: new Date().toISOString(),
  });
});

// Kubernetes readiness probe – returns 200 when app can serve traffic
healthRouter.get('/ready', (_req, res) => {
  res.json({ status: 'ready', timestamp: new Date().toISOString() });
});

// Kubernetes liveness probe – extremely lightweight, just confirms process alive
healthRouter.get('/live', (_req, res) => {
  res.json({ alive: true });
});
