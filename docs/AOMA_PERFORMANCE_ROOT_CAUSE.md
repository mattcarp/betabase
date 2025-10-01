# 🔴 AOMA Performance Root Cause - FOUND!

**Date:** October 1, 2025  
**Status:** ROOT CAUSE IDENTIFIED

## Diagnostic Results

```
✅ Network RTT:              1,798ms  (normal for Railway)
✅ RPC Overhead:               661ms  (acceptable)
❌ AOMA Knowledge Query:    24,987ms  (CRITICAL - 25 SECONDS!)
```

## Root Cause

**The OpenAI Assistant API is taking 23+ seconds to respond.**

### Breakdown
- Network latency: ~1.8s
- RPC overhead: ~0.7s  
- **OpenAI Assistant processing: ~22.5s** ← THE PROBLEM

### Why So Slow?

The `query_aoma_knowledge` tool uses OpenAI's Assistant API which involves:

1. **Railway → OpenAI** (network hop)
2. **OpenAI Assistant initialization** (if cold)
3. **Vector store query** (searching 1000+ documents)
4. **Assistant reasoning/processing**
5. **Response generation**
6. **OpenAI → Railway** (network hop back)

**Total: 23+ seconds of OpenAI Assistant API time**

## Solutions (Ordered by Impact)

### 🔥 IMMEDIATE (Do This Now)

#### 1. Switch from Assistant API to Direct Completions
**Impact:** 10-20x faster (2-3s instead of 25s)

**Current (slow):**
```typescript
// Uses OpenAI Assistant API (25s)
await openai.beta.assistants.retrieve(AOMA_ASSISTANT_ID);
await openai.beta.threads.create();
await openai.beta.threads.messages.create();
await openai.beta.threads.runs.create(); // ← This is slow!
await polling for completion...
```

**Better (fast):**
```typescript
// Use direct completions with embeddings (2-3s)
const embedding = await openai.embeddings.create({ input: query });
const docs = await supabase.rpc('match_documents', { embedding, limit: 5 });
const completion = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    { role: 'system', content: 'Context: ' + docs.join('\n') },
    { role: 'user', content: query }
  ]
});
```

**File to modify:** `/Users/mcarpent/Documents/projects/aoma-mesh-mcp/src/tools/aoma-knowledge.tool.ts`

#### 2. Add Keep-Alive Service
**Impact:** Eliminates Railway cold starts

```bash
# Add to cron or create simple service
*/5 * * * * curl https://luminous-dedication-production.up.railway.app/health
```

**Create:** `scripts/keep-aoma-warm.sh`

#### 3. Aggressive Response Caching
**Impact:** Instant for repeated queries

**Already implemented but can improve:**
```typescript
// Cache for longer (currently works well)
aomaCache.set(query, response, 'rapid', TTL_1_HOUR);

// Add semantic similarity matching
// "What is AOMA?" should hit cache for "Tell me about AOMA"
```

### 🚀 SHORT-TERM (This Week)

#### 4. Optimize Vector Search
- Reduce similarity threshold
- Limit results to top 3-5 (not 10)
- Pre-filter by source type

#### 5. Implement Streaming
- Start streaming AOMA context while still processing
- User sees partial results faster

#### 6. Add Query Classification
- Skip AOMA for simple queries ("hello", "thanks")
- Only use AOMA for knowledge-requiring queries

### 💰 MEDIUM-TERM (Upgrade Required)

#### 7. Upgrade Railway Plan
**Cost:** ~$20/month  
**Benefit:** Faster CPU, no cold starts, more memory

#### 8. Add Redis Cache Layer
**Benefit:** Persistent cache across deployments

#### 9. Optimize OpenAI Assistant Configuration
- Review assistant instructions (shorter = faster)
- Reduce vector store scope
- Use function calling for targeted queries

## Implementation Priority

### P0 - DO NOW (Biggest Impact)
1. ✅ Add performance monitoring (DONE - created tests)
2. ⏭️ **Switch to direct completions API** (20x faster)
3. ⏭️ Add keep-alive pings

### P1 - This Week
4. Optimize vector search queries
5. Add query classification
6. Implement response streaming

### P2 - Future
7. Upgrade Railway plan
8. Add Redis caching
9. Fine-tune OpenAI settings

## Expected Results

### Current State
- Cold query: 25 seconds
- Warm query (cached): <1 second

### After P0 Changes
- Cold query: 2-3 seconds (8-10x improvement!)
- Warm query: <1 second
- Railway always warm: <2 seconds consistently

### After All Changes
- Cold query: 1-2 seconds
- Warm query: <500ms
- 99th percentile: <3 seconds

## Action Items

### For AOMA Mesh MCP Server
```bash
cd ~/Documents/projects/aoma-mesh-mcp

# 1. Update aoma-knowledge.tool.ts
# Replace Assistant API with direct completions + vector search

# 2. Test performance
npm run test

# 3. Deploy to Railway
git add .
git commit -m "perf: switch from Assistant API to direct completions (20x faster)"
git push origin main
```

### For SIAM
```bash
cd ~/Documents/projects/siam

# 1. Add performance tests to CI
npm run test:performance

# 2. Add keep-alive cron
# Create scripts/keep-aoma-warm.sh

# 3. Monitor metrics
node scripts/diagnose-aoma-performance.js
```

## Files to Modify

### AOMA Mesh MCP
1. `src/tools/aoma-knowledge.tool.ts` - Replace Assistant API
2. `src/services/openai.service.ts` - Add direct completion method
3. `src/services/supabase.service.ts` - Optimize vector queries

### SIAM
1. ✅ `tests/performance/aoma-performance.spec.ts` - DONE
2. ✅ `scripts/diagnose-aoma-performance.js` - DONE
3. ⏭️ `scripts/keep-aoma-warm.sh` - TODO
4. ⏭️ `.github/workflows/performance.yml` - TODO

## Monitoring

### Run Performance Tests
```bash
# Automated (add to CI)
npm run test:performance

# Manual diagnostic
node scripts/diagnose-aoma-performance.js

# Watch trends
npm run test:performance -- --reporter=json > perf-results-$(date +%Y%m%d).json
```

### Performance Alerts
Set up alerts if:
- AOMA query > 10s (should be <3s)
- Health check > 2s (should be <1s)
- Error rate > 5%

## Conclusion

**Root cause: OpenAI Assistant API takes 23+ seconds**

**Solution: Switch to direct completions API**

**Expected improvement: 8-10x faster (25s → 2-3s)**

**Status:** Ready to implement - code changes identified, tests created, path forward clear.
