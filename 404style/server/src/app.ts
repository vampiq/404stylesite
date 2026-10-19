import fs from 'node:fs';
import path from 'node:path';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env, isProd } from './env.js';
import { globalLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { AppError } from './lib/errors.js';
import authRoutes from './routes/auth.js';
import publicRoutes, { seoRouter } from './routes/public.js';
import meRoutes from './routes/me.js';
import adminRoutes from './routes/admin/index.js';

export function createApp() {
  const app = express();
  const whitelist = env.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean);

  app.disable('x-powered-by');
  if (isProd) app.set('trust proxy', 1); // за Railway/Nginx: корректный req.ip для rate limit

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
          'img-src': ["'self'", 'data:', 'https:'],
        },
      },
    }),
  );
  app.use(
    cors({
      credentials: true,
      origin: (origin, cb) => (!origin || whitelist.includes(origin) ? cb(null, true) : cb(new AppError(403, 'CORS', 'Origin не разрешён'))),
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  if (env.NODE_ENV !== 'test') app.use(morgan(isProd ? 'combined' : 'dev'));

  app.use(seoRouter);
  app.get('/api/health', (_req, res) => res.json({ ok: true, uptime: process.uptime() }));

  app.use('/api', globalLimiter);
  app.use('/api/auth', authRoutes);
  app.use('/api/me', meRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api', publicRoutes);
  app.use('/api', notFoundHandler);

  // В проде один процесс отдаёт и API, и собранный фронт (SPA fallback)
  const dist = path.resolve(process.cwd(), 'client/dist');
  if (isProd && fs.existsSync(dist)) {
    app.use(express.static(dist, { maxAge: '1y', index: false }));
    app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  app.use(errorHandler);
  return app;
}
