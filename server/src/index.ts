import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config/env';
import { logger } from './config/logger';
import { errorHandler } from './middleware/error';
import { securityHeaders } from './middleware/security';
import { healthRouter } from './routes/health';
import { scanRouter } from './routes/scan';
import { reportsRouter } from './routes/reports';

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(securityHeaders());
app.use(cors({ origin: config.corsOrigin, credentials: false }));
app.use(express.json({ limit: '1mb' }));

const limiter = rateLimit({ windowMs: 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false });
app.use(limiter);

app.use('/api/health', healthRouter);
app.use('/api/scan', scanRouter);
app.use('/api/reports', reportsRouter);

app.use(errorHandler);

const port = config.port;
app.listen(port, () => {
  logger.info({ port, env: config.nodeEnv }, 'Server started');
});
