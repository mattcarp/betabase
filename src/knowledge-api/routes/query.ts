/**
 * Query Route for Knowledge API
 *
 * POST /v1/knowledge/query
 * Handles vector search with optional LLM synthesis
 */

import { Hono } from 'hono';
import type { QueryRequest, QueryResponse, SourceType } from '../types';
import { DEFAULT_LIMIT, DEFAULT_THRESHOLD, MAX_LIMIT } from '../types';
import { generateCacheKey, getCachedResponse, setCachedResponse } from '../services/cache';
import { generateEmbedding } from '../services/embedding';
import { searchMultiSource } from '../services/vectorSearch';
import { synthesizeAnswer } from '../services/synthesis';

const queryRoute = new Hono();

queryRoute.post('/', async (c) => {
  const totalStart = performance.now();

  try {
    // Parse and validate request
    const body = await c.req.json<QueryRequest>();

    if (!body.query || typeof body.query !== 'string' || body.query.trim().length === 0) {
      return c.json({ error: 'query is required and must be a non-empty string' }, 400);
    }

    const query = body.query.trim();
    const sources = body.sources as SourceType[] | undefined;
    const limit = Math.min(Math.max(body.limit || DEFAULT_LIMIT, 1), MAX_LIMIT);
    const threshold = Math.min(Math.max(body.threshold || DEFAULT_THRESHOLD, 0), 1);
    const synthesize = body.synthesize !== false; // Default true

    // Check response cache (Tier 1)
    const cacheKey = generateCacheKey(query, sources, limit, threshold, synthesize);
    const cachedResponse = getCachedResponse(cacheKey);

    if (cachedResponse) {
      return c.json({
        ...cachedResponse,
        metrics: {
          ...cachedResponse.metrics,
          total_ms: Math.round(performance.now() - totalStart),
          cache_hit: true,
        },
      } satisfies QueryResponse);
    }

    // Generate embedding (checks Tier 2 cache internally)
    const embeddingResult = await generateEmbedding(query);

    // Multi-source vector search (siam_vectors + wiki_documents)
    const searchResult = await searchMultiSource(embeddingResult.embedding, query, {
      sources,
      limit,
      threshold,
    });

    // Build response
    const response: QueryResponse = {
      results: searchResult.results,
      metrics: {
        total_ms: 0, // Will be set at end
        cache_hit: false,
        embedding_ms: embeddingResult.duration_ms,
        search_ms: searchResult.duration_ms,
      },
    };

    // Synthesize if requested
    if (synthesize && searchResult.results.length > 0) {
      const synthesisResult = await synthesizeAnswer(query, searchResult.results);
      response.synthesis = synthesisResult.text;
      response.metrics.synthesis_ms = synthesisResult.duration_ms;
    }

    // Finalize timing
    response.metrics.total_ms = Math.round(performance.now() - totalStart);

    // Cache the response
    setCachedResponse(cacheKey, response);

    return c.json(response);
  } catch (error) {
    console.error('Query error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json(
      {
        error: message,
        metrics: {
          total_ms: Math.round(performance.now() - totalStart),
          cache_hit: false,
          embedding_ms: 0,
          search_ms: 0,
        },
      },
      500
    );
  }
});

export default queryRoute;
