# Railway MCP Performance Issue

## Problem

The aoma-mesh-mcp server deployed on Railway is taking 25-31 seconds to respond to certain queries, causing timeouts in the SIAM application.

## Symptoms

- Query: "How do I submit assets?" takes **31 seconds** to complete
- Query: "What is AOMA?" takes **1.2 seconds** (reasonable)
- Cached queries respond in **2-7ms** (excellent)

## Evidence

```
🎯 Direct AOMA Railway query: How do I submit assets?
POST /api/aoma 200 in 31144ms  ← TOO SLOW

🎯 Direct AOMA Railway query: What is AOMA?
⚡ Railway MCP responded in 1204ms  ← GOOD
```

## Root Cause Identified

The slowness is happening on the **Railway server itself**, not in the network or SIAM app.

### Confirmed Root Cause: OpenAI Assistants API

Testing reveals Railway is using **OpenAI Assistants API with threads**, which is inherently slower than direct Chat Completions API:

```json
{
  "metadata": {
    "threadId": "thread_1QvwLzQFqZCQcwAEelAkHxOH",
    "timestamp": "2025-10-29T10:33:32.742Z"
  }
}
```

**Performance comparison:**
- Direct Railway query: **12.6 seconds**
- Through SIAM localhost: **23 seconds** (includes network + Railway processing)
- Cached queries: **2-7ms** (excellent)

### Why Assistants API is Slow

1. **Thread Management Overhead**: Creating and managing persistent threads adds latency
2. **Multiple API Calls**: Assistants API requires multiple round-trips (create thread → add message → run → poll for completion)
3. **No Streaming**: Results aren't available until the entire response is complete

### Solution Options

1. **Switch to Chat Completions API** (recommended)
   - Direct API calls, no thread overhead
   - Supports streaming responses
   - 5-10x faster for simple queries

2. **Optimize Assistants API usage**
   - Reuse threads instead of creating new ones
   - Use streaming mode if available
   - Implement better caching

3. **Hybrid approach**
   - Use Chat Completions for simple queries ("rapid" strategy)
   - Use Assistants API only for complex multi-turn conversations ("comprehensive" strategy)

## Temporary Fix Applied

Added timeouts to prevent SIAM from hanging:
- `/api/chat` orchestrator: 30-second timeout
- `/api/aoma` direct queries: 25-second timeout with AbortController

## Action Items

1. **Monitor Railway logs** for the slow query
2. **Check OpenAI API** response times in Railway metrics
3. **Profile the Railway MCP server** to find the bottleneck
4. **Consider**:
   - Switching to a faster model (gpt-4o-mini instead of o1?)
   - Caching more aggressively
   - Optimizing vector search
   - Scaling Railway resources

## Testing

To reproduce:
```bash
curl -X POST http://localhost:3000/api/aoma \
  -H "Content-Type: application/json" \
  -d '{"query": "How do I submit assets?"}'
```

Expected: Should complete in under 5 seconds
Actual: Takes 25-31 seconds

## Related Commits

- `27dc3f30` - Added timeouts to prevent hanging
- `2d9055cd` - Fixed fallback error message
