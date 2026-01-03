/**
 * Unified Knowledge API
 *
 * Fast, standalone Hono service for vector search across AOMA knowledge base.
 * Port: 3006 (separate from betabase:3000, SIAM:3005)
 *
 * Endpoints:
 * - GET  /health              Health check
 * - POST /v1/knowledge/query  Vector search with optional LLM synthesis
 */

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import queryRoute from './routes/query';
import detailRoute from './routes/detail';
import { getCacheStats } from './services/cache';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: ['http://localhost:3000', 'https://thebetabase.com'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);

// Health check
app.get('/health', (c) => {
  const stats = getCacheStats();
  return c.json({
    status: 'healthy',
    service: 'knowledge-api',
    version: '1.0.0',
    cache: stats,
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
app.route('/v1/knowledge/query', queryRoute);
app.route('/v1/knowledge/detail', detailRoute);

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      error: 'Not Found',
      path: c.req.path,
      hint: 'Try POST /v1/knowledge/query or GET /health',
    },
    404
  );
});

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json(
    {
      error: 'Internal Server Error',
      message: err.message,
    },
    500
  );
});

// Start server
const PORT = parseInt(process.env.KNOWLEDGE_API_PORT || '3006', 10);

console.log(`
========================================
  Unified Knowledge API
  Port: ${PORT}
  Endpoints:
    GET  /health
    POST /v1/knowledge/query
    GET  /v1/knowledge/detail/:type/:id
    POST /v1/knowledge/detail/batch
========================================
`);

serve({
  fetch: app.fetch,
  port: PORT,
});
