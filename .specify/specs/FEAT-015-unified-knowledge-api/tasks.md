# FEAT-015: Unified Knowledge API - Tasks

## Completed

- [x] Create Hono server with middleware (CORS, logging)
- [x] Implement /health endpoint with cache stats
- [x] Implement POST /v1/knowledge/query endpoint
- [x] Build 2-tier caching (response + embedding)
- [x] Integrate Gemini embeddings (768d)
- [x] Multi-source search (siam_vectors + wiki_documents)
- [x] LLM synthesis with Gemini/Groq fallback
- [x] Request validation and error handling
- [x] E2E test suite (Playwright)
- [x] Startup scripts (shell + PM2)
- [x] Documentation (spec.md)

## Future Enhancements

- [ ] Streaming responses (`stream: true`)
- [ ] Migrate wiki_documents to vector(768)
- [ ] Semantic routing (skip irrelevant sources)
- [ ] Progressive streaming (fast sources first)
- [ ] Smart prefetching (cache follow-up queries)
- [ ] Redis cache for multi-instance deployment
- [ ] OpenTelemetry instrumentation
- [ ] Rate limiting per client
