import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { authRouter } from './routes/auth';

export function createApp(): express.Application {
  const app = express();

  app.use(cors({ origin: config.FRONTEND_URL, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get('/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
  });

  app.use('/api/v1/auth', authRouter);

  // Future route modules
  // app.use('/api/v1/children', childrenRouter);

  return app;
}
