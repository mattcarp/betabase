# SIAM MCP Performance Analysis Report

**Date**: August 19, 2025  
**Issue**: 30-45 second response times for AOMA queries

## Executive Summary

Production AOMA queries take 30-45 seconds, creating a poor user experience. Root cause identified as OpenAI Assistant API latency, not infrastructure issues.

## Performance Measurements

### Direct Railway MCP Server Tests

- **System Health Check**: 1.3 seconds ✅
- **AOMA Query (rapid strategy)**: 36 seconds ❌
- **AOMA Query (focused strategy)**: 16 seconds ⚠️
- **AOMA Query (comprehensive)**: 21-30 seconds ❌

### Infrastructure Status

- **Railway Serverless Mode**: DISABLED (no cold starts)
- **Railway Server Health**: Healthy, no memory/CPU issues
- **Network Latency**: ~200ms to Railway (normal)
- **Average Response Time**: 10.4 seconds (from metrics)

### Request Flow Analysis

1. User query → SIAM frontend (Render)
2. SIAM → Railway MCP server: ~200ms
3. Railway MCP → Supabase vector search: ~1-2 seconds
4. Railway MCP → OpenAI Assistant API: **15-35 seconds** ⚠️
5. Response processing: ~500ms
6. Total time: 20-45 seconds

### Multiple Query Problem

The chat route can make up to 3-4 sequential queries:

1. Original query with default strategy
2. Enhanced queries if "generic" response detected
3. Comprehensive strategy retry

- **Worst case**: 3 queries × 20 seconds = 60+ seconds

## Root Cause Analysis

### Primary Bottleneck

**OpenAI Assistant API** is the sole bottleneck:

- Creates new thread for each query
- Runs assistant with large vector store (1000+ documents)
- Waits for completion (synchronous)
- Known to be slow with large knowledge bases

### Not Contributing to Slowness

- ✅ Railway cold starts (serverless already disabled)
- ✅ Network infrastructure
- ✅ Supabase vector search
- ✅ Frontend/backend communication

## Proposed Solutions

### Immediate (Quick Wins)

1. Change default strategy from "focused" to "rapid"
2. Disable retry logic for first query
3. Reduce timeout from 45s to 25s
4. Add loading states with progress indicators

### Short-term (1-2 weeks)

1. Implement Redis caching for common queries
2. Pre-warm cache with top 50 queries
3. Add query result streaming
4. Implement parallel query strategies (not sequential)

### Long-term (1-2 months)

1. Migrate to Vercel AI SDK for vendor flexibility
2. Replace Assistant API with direct LLM + vector search
3. Implement edge caching with Cloudflare
4. Consider hybrid approach: fast cache + slow accurate fallback

## Cost-Benefit Analysis

- Current user experience: Unacceptable (30-45s wait)
- Redis on Railway: ~$5-10/month
- Expected improvement with caching: 80% queries < 2 seconds
- ROI: Massive improvement for minimal cost

## Testing Commands for Future Reference

```bash
# Test system health (baseline)
time curl -X POST https://luminous-dedication-production.up.railway.app/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_system_health"}}'

# Test AOMA query performance
time curl -X POST https://luminous-dedication-production.up.railway.app/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"query_aoma_knowledge","arguments":{"query":"What is USM?","strategy":"rapid"}}}'
```

## Next Steps

1. Create Task Master task for performance optimization
2. Implement quick wins first
3. Monitor improvements
4. Gradually implement caching layer

---

_This document should be referenced when resuming performance optimization work._
