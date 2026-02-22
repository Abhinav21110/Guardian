/**
 * Guardian AI Backend
 * Main Express Server
 */

import express, { Application, Request, Response } from 'express';
import { corsMiddleware, helmetMiddleware, rateLimiter, sanitizeInput } from './middleware/security';
import { errorHandler } from './middleware/error';
import logger from './config/logger';
import config from './config/env';

// Import routes
import healthRoutes from './routes/health';
import scanRoutes from './routes/scan';
import emailRoutes from './routes/email';
import dashboardRoutes from './routes/dashboard';

// Initialize Express app
const app: Application = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(corsMiddleware);
app.use(helmetMiddleware);
app.use(sanitizeInput);

// Apply rate limiting to API routes
app.use('/api', rateLimiter);

// Health check (no rate limit)
app.use('/api/health', healthRoutes);

// API Routes
app.use('/api/scan', scanRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Guardian AI API',
    version: '1.0.0',
    description: 'Hybrid Real-Time Phishing & Social Engineering Detection Engine',
    endpoints: {
      health: '/api/health',
      scan: '/api/scan',
      email: '/api/email',
      dashboard: '/api/dashboard'
    },
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = config.port;

const server = app.listen(PORT, () => {
  logger.info(`🛡️  Guardian AI Backend started on port ${PORT}`);
  logger.info(`📊 Environment: ${config.nodeEnv}`);
  logger.info(`🌐 CORS Origin: ${config.security.corsOrigin}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export default app;
