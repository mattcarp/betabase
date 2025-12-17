# Architecture Validation Tests

These tests verify the fundamental architecture of SIAM remains correct and performant.

## 🎯 Purpose

Prevent architectural regressions that would slow down or break the application.

## 🧪 Tests

### `no-railway-in-chat.spec.ts`

**Critical Test:** Validates that chat interactions do NOT call the Railway AOMA MCP server.

**Why This Matters:**
- Railway adds 2.5+ seconds of latency
- We optimized to use Supabase-only (sub-100ms responses)
- This test catches if someone accidentally re-introduces the slow path

**What It Checks:**
1. ✅ No Railway calls during chat
2. ✅ Only OpenAI and Supabase are called
3. ✅ Response times stay under 2 seconds
4. ✅ Health check API still works (but isn't used in chat)
5. ✅ Performance across multiple queries

**Test Categories:**

#### Chat Architecture Validation
- Network request monitoring
- API call verification
- Performance timing

#### AOMA Orchestrator Behavior
- Supabase-only path confirmation
- Vector search validation

#### Network Performance Validation
- Zero Railway calls assertion
- Average response time checks
- Performance metrics

## 🚀 Running Architecture Tests

### Standalone
```bash
pnpm playwright test tests/architecture/
```

### With All Tests
```bash
./tests/run-all-tests.sh
```

### With UI Tests
```bash
./tests/run-ui-tests.sh
```

## ⚠️ If Tests Fail

### Railway Call Detected
```
❌ UNEXPECTED Railway calls detected
```

**Cause:** Code is calling `luminous-dedication-production.up.railway.app`

**Fix:**
1. Check `aomaOrchestrator.ts` - ensure `executeOrchestrationInternal` uses Supabase path
2. Verify `callAOMATool` method is NOT being called
3. Check for any direct Railway fetch calls

### Slow Response Times
```
⚠️ Response took 2500ms - investigate performance
```

**Cause:** Likely calling Railway or external API

**Fix:**
1. Review network logs in test output
2. Check if `aomaOrchestrator` is using cached results
3. Verify Supabase vector search is working

## 📊 Expected Results

### Network Calls (Per Query)
- `/api/chat-vercel`: 1 call ✅
- `api.openai.com`: 1+ calls (streaming) ✅
- `supabase.co`: 0-1 calls (may be cached) ✅
- `railway.app`: **0 calls** ✅

### Performance Benchmarks
- Time to first token: < 2000ms ✅
- Average response time: < 1500ms ✅
- Supabase query time: < 100ms ✅

## 🔍 Debugging

Enable verbose logging:
```bash
DEBUG=1 pnpm playwright test tests/architecture/no-railway-in-chat.spec.ts
```

Check network trace:
```bash
pnpm playwright test tests/architecture/no-railway-in-chat.spec.ts --trace on
```

## 📝 Maintenance

### When to Update These Tests

1. **New API Endpoints:** Add validation for new endpoints
2. **Performance Changes:** Update benchmarks if optimization improves speed
3. **Architecture Changes:** If we add new services, validate they're called correctly

### Adding New Architecture Tests

Template:
```typescript
test("should validate [architecture concern]", async ({ page }) => {
  // Monitor network
  const calls: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("concern-url")) {
      calls.push(request.url());
    }
  });

  // Perform action
  // ... test code ...

  // Assert architecture is correct
  expect(calls).toHaveLength(expectedCount);
});
```

## 🎓 Related Documentation

- [AOMA Orchestrator](../../src/services/aomaOrchestrator.ts) - Implementation
- [Chat API](../../app/api/chat-vercel/route.ts) - Main chat endpoint
- [Knowledge Search](../../src/services/knowledgeSearchService.ts) - Supabase queries

## 🏆 Test Goals

- ✅ Prevent slow Railway calls
- ✅ Maintain sub-second responses
- ✅ Validate correct service usage
- ✅ Catch architectural regressions early

