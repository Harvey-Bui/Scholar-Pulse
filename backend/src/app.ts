import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './env';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

export function createApp() {
  const app = express();

  // Behind a reverse proxy (Vercel, Railway, Render, ...) the real client IP
  // arrives via X-Forwarded-For; without this, express-rate-limit throws
  // instead of trusting that header, which crashed /api/auth/login in prod.
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);

  app.get('/', (_req, res) => res.json({ name: 'Scholar Pulse API', status: 'ok' }));
  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api', routes);

  app.use(errorHandler);
  return app;
}

// Vercel's zero-config Express detection can auto-discover this file as a
// serverless function in its own right (separate from api/index.ts) and
// invoke its default export directly — without one, that invocation crashes
// with "Invalid export found... default export must be a function".
export default createApp();
