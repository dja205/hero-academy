import express from 'express';
import cors from 'cors';
import { config } from './config';

export function createApp(): express.Application {
  const app = express();

  app.use(cors({ origin: config.FRONTEND_URL, credentials: true }));
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
  });

  // Route modules will be mounted here as they are built
  // app.use('/api/v1/auth', authRouter);
  // app.use('/api/v1/children', childrenRouter);

  return app;
}
