import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/error-handler';
import { authRouter } from './routes/auth';
import { cycleRouter, symptomRouter } from './routes/cycle';
import { journalRouter } from './routes/journal';
import { pairingRouter } from './routes/pairing';
import { partnerRouter } from './routes/partner';
import { aiRouter } from './routes/ai';
import { adminRouter } from './routes/admin';

const app = express();

app.use(helmet());
app.use(cors({
  origin: env.CLIENT_APP_URL,
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// Winston HTTP request logging
app.use((req, res, next) => {
  const start = Date.now();
  const { method, originalUrl } = req;
  
  res.on('finish', () => {
    const { statusCode } = res;
    const responseTime = Date.now() - start;
    
    logger.http('Request', {
      method,
      url: originalUrl,
      status: statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  });
  
  next();
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/auth', authRouter);
app.use('/cycles', cycleRouter);
app.use('/symptoms', symptomRouter);
app.use('/journals', journalRouter);
app.use('/pairings', pairingRouter);
app.use('/partner', partnerRouter);
app.use('/ai', aiRouter);
app.use('/admin', adminRouter);

app.use(errorHandler);

export default app;
