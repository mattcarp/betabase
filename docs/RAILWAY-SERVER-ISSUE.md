# Railway Server Performance Issue - Action Required

## Issue Summary

The aoma-mesh-mcp server deployed on Railway is experiencing severe performance degradation due to its use of OpenAI's Assistants API. Queries that should complete in 2-5 seconds are taking 12-31 seconds.

## Impact

- **User Experience**: 25-31 second wait times for AOMA queries
- **Timeout Rate**: High frequency of timeouts causing error messages
- **Production Readiness**: Not acceptable for production use

## Root Cause

Railway server is using **OpenAI Assistants API with persistent threads**:

```json
{
  "metadata": {
    "threadId": "thread_1QvwLzQFqZCQcwAEelAkHxOH",
    "timestamp": "2025-10-29T10:33:32.742Z"
  }
}
```

### Why This Is Slow

1. **Multiple API Round-Trips**: Assistants API requires:
   - Create/retrieve thread
   - Add message to thread
   - Create run
   - Poll for completion (multiple requests)

2. **No Streaming Support**: Must wait for complete response

3. **Thread Management Overhead**: Persistent thread state adds latency

### Performance Evidence

| Query Type | Response Time | Status |
|------------|--------------|--------|
| Cached queries | 2-7ms | ✅ Excellent |
| Simple query ("What is AOMA?") | 1.2s | ✅ Acceptable |
| Complex query ("How do I submit assets?") | 12-31s | ❌ Unacceptable |

## Recommended Solutions

### Option 1: Switch to Chat Completions API (RECOMMENDED)

**Expected Result**: 5-10x faster (2-5 seconds instead of 12-31 seconds)

**Implementation**:
```typescript
// Replace Assistants API implementation with:
const response = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: query }
  ],
  stream: true, // Enable streaming for even faster perceived response
  temperature: 0.7,
});
```

**Pros**:
- Direct API calls, minimal latency
- Supports streaming responses
- Simpler implementation
- Lower cost per query

**Cons**:
- Loses conversation context between queries
- Must implement custom context management if needed

### Option 2: Optimize Assistants API Usage

**Expected Result**: 2-3x faster (5-10 seconds)

**Implementation**:
- Reuse threads instead of creating new ones
- Enable streaming mode if available
- Implement aggressive caching at thread level
- Use thread pooling to reduce creation overhead

**Pros**:
- Keeps multi-turn conversation capability
- Maintains existing architecture

**Cons**:
- Still slower than Chat Completions
- More complex to optimize
- Higher cost

### Option 3: Hybrid Approach (RECOMMENDED FOR LONG-TERM)

**Implementation**:
```typescript
if (strategy === "rapid") {
  // Use Chat Completions API for simple queries
  return await chatCompletions(query);
} else if (strategy === "comprehensive") {
  // Use Assistants API for complex multi-turn conversations
  return await assistantsAPI(query);
}
```

**Expected Result**:
- Rapid queries: 2-5 seconds (Chat Completions)
- Comprehensive queries: 5-10 seconds (optimized Assistants)

**Pros**:
- Best of both worlds
- Optimal performance for common cases
- Maintains advanced features when needed

**Cons**:
- More code to maintain
- Need to define strategy selection logic

## Required Actions

### Immediate (This Week)

1. **Access Railway Deployment**
   - URL: `https://luminous-dedication-production.up.railway.app`
   - Locate OpenAI Assistants API implementation
   - Check Railway logs for query timing breakdown

2. **Implement Quick Fix**
   - Switch "rapid" strategy to Chat Completions API
   - Keep Assistants API only for "comprehensive" strategy
   - Deploy to Railway

3. **Verify Performance**
   - Test query: "How do I submit assets?"
   - Target: Complete in under 5 seconds
   - Verify cached queries still work (2-7ms)

### Near-Term (Next Sprint)

1. **Implement Hybrid Approach**
   - Chat Completions for rapid queries
   - Optimized Assistants for comprehensive queries
   - Add strategy selection logic

2. **Performance Monitoring**
   - Add timing metrics to Railway logs
   - Track 95th percentile response times
   - Set up alerts for >10s queries

3. **Caching Strategy**
   - Document current caching behavior
   - Expand cache coverage if possible
   - Implement cache warming for common queries

## Testing Checklist

After Railway changes are deployed:

- [ ] "What is AOMA?" completes in <2 seconds
- [ ] "How do I submit assets?" completes in <5 seconds
- [ ] Cached queries still respond in <10ms
- [ ] Error messages still work for actual failures
- [ ] No regression in response quality
- [ ] Console shows no new errors

## Files Modified in SIAM (Already Complete)

These changes handle Railway slowness gracefully:

- `app/api/chat/route.ts` - 30s timeout, honest error messages
- `app/api/aoma/route.ts` - 25s timeout with AbortController
- `docs/RAILWAY-PERFORMANCE-ISSUE.md` - Root cause analysis

## References

- **SIAM Repository**: `/Users/mcarpent/Documents/projects/siam`
- **Railway URL**: `https://luminous-dedication-production.up.railway.app`
- **Related Commits**:
  - `27dc3f30` - Added timeouts to prevent hanging
  - `2d9055cd` - Fixed fallback error message

## Priority

**🔥 HIGH PRIORITY** - This is blocking production use of AOMA chat functionality.

---

**Created**: 2025-10-29
**Last Updated**: 2025-10-29
**Status**: Investigation Complete, Awaiting Railway Server Fix
