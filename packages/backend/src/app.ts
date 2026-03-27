import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { applySecurityMiddleware } from './middleware/security';
import { authRouter } from './routes/auth';
import { adminRouter } from './routes/admin';
import { assessmentsRouter } from './routes/assessments';
import { attemptsRouter } from './routes/attempts';
import { statsRouter } from './routes/stats';
import { childrenRouter } from './routes/children';
import { topicsRouter, zonesRouter } from './routes/topics';
import { childHistoryRouter, attemptDetailRouter } from './routes/history';
import { parentRouter } from './routes/parent';

export function createApp(): express.Application {
  const app = express();

  // ISS-055: Security headers, secure cookies, trust proxy
  applySecurityMiddleware(app);

  app.use(cors({ origin: config.FRONTEND_URL, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get('/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
  });

  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/admin', adminRouter);
  app.use('/api/v1/assessments', assessmentsRouter);
  app.use('/api/v1/attempts', attemptsRouter);
  app.use('/api/v1/attempts', attemptDetailRouter);
  app.use('/api/v1/children', childrenRouter);
  app.use('/api/v1/children', statsRouter);
  app.use('/api/v1/children', childHistoryRouter);
  app.use('/api/v1/parent', parentRouter);
  app.use('/api/v1/topics', topicsRouter);
  app.use('/api/v1/zones', zonesRouter);

  return app;
}
