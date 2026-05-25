import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { trpcServer } from '@hono/trpc-server';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'node:http';

import { auth } from '@repo/auth';
import { getServerEnv } from '@repo/config';
import { appRouter } from './routers/index.js';
import { createContextFactory } from './context.js';
import { setupSocketHandlers } from './socket.js';
import { startNotificationWorker } from './queues/worker.js';

// ============================================================
// Hono Application
// ============================================================

const env = getServerEnv();

const app = new Hono();

// --- Middleware ---
app.use('*', logger());
app.use('*', secureHeaders());
app.use(
  '*',
  cors({
    origin: [
      'http://localhost:3000', // web
      'http://localhost:3002', // admin
      'http://localhost:19006', // expo web
    ],
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  }),
);

// --- Health check ---
app.get('/health', (c) =>
  c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
  }),
);

// --- Better-Auth routes ---
app.all('/api/auth/**', (c) => auth.handler(c.req.raw));

// --- tRPC routes (injected after io is created) ---
// Note: io is wired in after httpServer creation below

// --- 404 handler ---
app.notFound((c) => c.json({ error: 'Not Found' }, 404));

// --- Error handler ---
app.onError((err, c) => {
  console.error('[API Error]', err);
  return c.json(
    { error: 'Internal Server Error', message: err.message },
    500,
  );
});

// ============================================================
// HTTP Server + Socket.io
// ============================================================

const httpServer = createServer((req, res) => {
  // Delegate to Hono
  const requestInfo = new Request(`http://localhost${req.url}`, {
    method: req.method || 'GET',
    headers: req.headers as any,
  });

  Promise.resolve(app.fetch(requestInfo))
    .then((response: any) => {
      res.writeHead(response.status, Object.fromEntries(response.headers));
      response.body?.pipeTo(
        new WritableStream({
          write(chunk) { res.write(chunk); },
          close() { res.end(); },
        }),
      );
    })
    .catch(() => {
      res.writeHead(500);
      res.end('Internal Server Error');
    });
});

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3002'],
    credentials: true,
  },
});

setupSocketHandlers(io);

// Wire tRPC with the io instance so routers can emit socket events
app.use(
  '/api/trpc/**',
  trpcServer({
    router: appRouter,
    createContext: ((_opts: any, c: any) => createContextFactory(io)(c.req)) as any,
  }),
);

// Start BullMQ notification worker
startNotificationWorker();

// ============================================================
// Start
// ============================================================

httpServer.listen(env.PORT, () => {
  console.log('');
  console.log('🚀 FoodHub API Server');
  console.log(`   Running on: http://localhost:${env.PORT}`);
  console.log(`   tRPC:       http://localhost:${env.PORT}/api/trpc`);
  console.log(`   Auth:       http://localhost:${env.PORT}/api/auth`);
  console.log(`   Health:     http://localhost:${env.PORT}/health`);
  console.log(`   Socket.io:  ws://localhost:${env.PORT}`);
  console.log(`   Env:        ${env.NODE_ENV}`);
  console.log('');
});

export { app, io };
export type { AppRouter } from './routers/index.js';
