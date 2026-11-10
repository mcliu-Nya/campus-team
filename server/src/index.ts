import cors from 'cors';
import express from 'express';

import { env } from './config/env.js';
import { ok } from './lib/http.js';
import { prisma } from './lib/prisma.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { meRouter } from './modules/me/me.routes.js';
import { notificationRouter } from './modules/notifications/notification.routes.js';
import { recruitmentRouter } from './modules/recruitments/recruitment.routes.js';

export const app = express();

app.disable('x-powered-by');
app.use(
  cors({
    origin:
      env.CORS_ORIGIN === '*'
        ? true
        : env.CORS_ORIGIN.split(',')
            .map((item) => item.trim())
            .filter(Boolean),
  }),
);
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  ok(res, { status: 'ok', env: env.NODE_ENV, time: new Date().toISOString() });
});

// 直接访问 API 根路径时给个说明，避免误以为服务没起来
app.get(['/api', '/api/'], (_req, res) => {
  ok(res, {
    name: 'campus-team-api',
    version: '1.0.1',
    status: 'ok',
    health: '/api/health',
    docs: [
      'GET  /api/health',
      'POST /api/auth/login',
      'GET  /api/auth/me',
      'GET  /api/recruitments',
      'POST /api/recruitments',
      'GET  /api/recruitments/:id',
      'GET  /api/my/teams',
      'GET  /api/my/recruitments',
      'GET  /api/my/ended',
      'GET  /api/notifications',
    ],
  });
});

app.use('/api/auth', authRouter);
app.use('/api/recruitments', recruitmentRouter);
app.use('/api/my', meRouter);
app.use('/api/notifications', notificationRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(env.PORT, () => {
  console.log(`[api] listening on http://localhost:${env.PORT}/api (${env.NODE_ENV})`);
});

async function shutdown(signal: string): Promise<void> {
  console.log(`[api] ${signal} received, shutting down`);
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
