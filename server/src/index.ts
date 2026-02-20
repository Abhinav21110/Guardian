// ─────────────────────────────────────────────────────────────────────────────
// Guardian AI – API Gateway Entry Point
// ─────────────────────────────────────────────────────────────────────────────
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config/env';
import { logger } from './config/logger';
import { errorHandler } from './middleware/error';
import { securityHeaders } from './middleware/security';
import { apiKeyAuth } from './middleware/auth';
import { healthRouter } from './routes/health';
import { scanRouter } from './routes/scan';
import { reportsRouter } from './routes/reports';
import { emailRouter } from './routes/email';
import { dashboardRouter } from './routes/dashboard';
import { threatsRouter } from './routes/threats';
import { initDatabase, disconnectDatabase } from './services/database';
import { disconnectRedis } from './services/cache';

const app = express();

// ─── Core middleware ──────────────────────────────────────────────────────────
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet());
app.use(securityHeaders());
app.use(cors({
  origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(',').map(s => s.trim()),
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', config.api.apiKeyHeader],
}));
app.use(express.json({ limit: '2mb' }));

// ─── Global rate limiter (all routes) ────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: true, message: 'Too many requests, please try again later.' },
});
app.use(globalLimiter);

// ─── Scan-specific tighter rate limiter ───────────────────────────────────────
const scanLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.scanMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: true, message: 'Scan rate limit exceeded. Max scans per minute reached.' },
  keyGenerator: (req) => req.ip ?? 'unknown',
});

// ─── Health (no auth – needed for k8s probes) ────────────────────────────────
app.use('/api/health', healthRouter);

// ─── Auth gate (applied to all protected routes below) ───────────────────────
app.use('/api', apiKeyAuth);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/scan',      scanLimiter, scanRouter);
app.use('/api/email',     scanLimiter, emailRouter);
app.use('/api/reports',   reportsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/threats',   threatsRouter);

// ─── 404 catch-all ────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: true, message: 'Route not found' });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Startup ──────────────────────────────────────────────────────────────────
async function start(): Promise<void> {
  await initDatabase();

  const server = app.listen(config.port, () => {
    logger.info({
      port: config.port,
      env: config.nodeEnv,
      features: config.features,
    }, 'Guardian AI API server started');
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutdown signal received');
    server.close(async () => {
      await Promise.allSettled([disconnectDatabase(), disconnectRedis()]);
      logger.info('Server closed cleanly');
      process.exit(0);
    });
    // Force exit after 15s
    setTimeout(() => process.exit(1), 15_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

start().catch(err => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
