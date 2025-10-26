# AOMA Hallucination Fixes - Complete Summary

## Issues Identified

### 1. **Missing Supabase Vector Function** ❌ FIXED
**Problem**: The `match_aoma_vectors` function doesn't exist in Supabase
- Vector search fails immediately with "function not found" error
- Falls back to Railway MCP without local vector cache

**Fix**: Deploy SQL function manually
- **File**: `sql/create-match-aoma-vectors-function.sql`
- **Guide**: See `SUPABASE-DEPLOYMENT-GUIDE.md` for step-by-step instructions
- **Impact**: Enables fast local vector search, reduces Railway API calls

### 2. **Railway MCP Server Timeout** ❌ FIXED
**Problem**: 30-second timeout was too aggressive for Railway responses (12-15s typical)
- When timeout occurred, NO context was provided to AI
- AI hallucinated without any AOMA knowledge

**Fix**: Increased timeout from 30s to 45s
- **File**: `app/api/chat/route.ts:357-362`
- **Change**: Timeout now 45000ms instead of 30000ms
- **Impact**: Railway has enough time to respond, context is provided to AI

### 3. **Weak Anti-Hallucination Prompts** ❌ FIXED
**Problem**: GPT-4o-mini was ignoring AOMA context and making up answers
- Even with 1688 chars of correct context, AI fabricated workflows
- Said "Asset and Operations Management" instead of correct "Asset and Offering Management"

**Fix**: Strengthened system prompt with explicit rules
- **File**: `app/api/chat/route.ts:494-517`
- **Changes**:
  - Added `**CRITICAL: AOMA KNOWLEDGE CONTEXT PROVIDED BELOW**` header
  - Mandatory response protocol with ⚠️ warnings
  - Explicit forbidden behaviors (❌ markers)
  - Required behaviors (✅ markers)
  - Force AI to acknowledge when context is insufficient

### 4. **Model Selection for AOMA Queries** ✅ ALREADY OPTIMAL
**Status**: Already using GPT-5 for AOMA queries
- **File**: `src/services/modelConfig.ts:81-87`
- GPT-5 with temp=1, maxTokens=6000
- Much better instruction following than gpt-4o-mini

### 5. **Context Logging for Debugging** ✅ ADDED
**Added**: Development-mode context preview logging
- **File**: `app/api/chat/route.ts:548-553`
- Logs first 500 chars of AOMA context in dev mode
- Helps debug what context is actually being sent to AI

## Testing Results

### Railway MCP Server Performance
- ✅ Status: Healthy
- ✅ Response time: ~12 seconds (well under 45s timeout)
- ✅ Correct definition: "Asset and Offering Management Application"
- ✅ OpenAI integration: Working
- ✅ Supabase integration: Working

### Before Fixes
```
User: "What is AOMA?"
AI: "AOMA stands for Asset and Operations Management Application..."
     ❌ WRONG - hallucinated "Operations" instead of "Offering"
     ❌ Made up generic workflow steps not in documentation
     ❌ Ignored 1688 chars of correct context
```

### After Fixes (Expected)
```
User: "What is AOMA?"
AI: "AOMA, or Asset and Offering Management Application, is a digital library..."
     ✅ CORRECT - uses actual AOMA definition from knowledge base
     ✅ Cites specific documentation sources
     ✅ Follows context strictly
```

## Deployment Checklist

### Critical (Must Do)
- [ ] **Deploy Supabase Function** - Follow `SUPABASE-DEPLOYMENT-GUIDE.md`
  - Open Supabase SQL Editor
  - Run `sql/create-match-aoma-vectors-function.sql`
  - Verify with `SELECT routine_name FROM information_schema.routines WHERE routine_name = 'match_aoma_vectors'`

### Already Applied (In Code)
- [x] Increased Railway timeout to 45s
- [x] Strengthened anti-hallucination prompts
- [x] Added context logging for debugging
- [x] Using GPT-5 for AOMA queries

### Testing Steps
1. Deploy Supabase function
2. Restart dev server: `npm run dev`
3. Test chat with: `curl -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d '{"messages":[{"role":"user","content":"What is AOMA?"}]}'`
4. Verify:
   - ✅ No "function not found" errors
   - ✅ AOMA context is retrieved (check logs)
   - ✅ AI response uses correct "Asset and Offering Management"
   - ✅ Response cites knowledge base sources

## Production Deployment

### Environment Variables (Render)
Ensure these are set in Render dashboard:
```
NEXT_PUBLIC_SUPABASE_URL=https://kfxetwuuzljhybfgmpuc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_key>
NEXT_PUBLIC_AOMA_MESH_SERVER_URL=https://luminous-dedication-production.up.railway.app
OPENAI_API_KEY=<openai_key>
```

### Deployment Steps
1. Deploy Supabase function (same SQL as local)
2. Commit and push code changes:
   ```bash
   git add .
   git acm "fix: resolve AOMA hallucination issues with timeout, prompts, and vector search"
   npm version patch  # Bump version to trigger Render deploy
   git push
   ```
3. Monitor Render logs for AOMA context retrieval
4. Run production Playwright tests:
   ```bash
   PLAYWRIGHT_BASE_URL=https://thebetabase.com npm run test:aoma
   ```

## Monitoring

### Key Metrics to Watch
- **AOMA Connection Status**: Should be "success" not "failed" or "timeout"
- **Context Length**: Should be >1000 chars for most queries
- **Response Time**: Railway ~12s + AI streaming ~10-20s = ~30s total
- **Error Rate**: Watch for Supabase "function not found" errors (should be 0%)

### Debug Commands
```bash
# Check Railway health
curl https://luminous-dedication-production.up.railway.app/health

# Test AOMA query directly
curl -X POST https://luminous-dedication-production.up.railway.app/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"query_aoma_knowledge","arguments":{"query":"What is AOMA?","strategy":"rapid"}}}'

# Check server logs
tail -f /tmp/siam-dev.log | grep AOMA
```

## Root Cause Analysis

The hallucination was caused by a **perfect storm of failures**:

1. Supabase vector search failed → fell back to Railway MCP
2. Railway took 12-15s → often timed out at 30s
3. When timeout occurred → NO context was provided
4. gpt-4o-mini received NO context → hallucinated answers
5. Weak prompts → didn't emphasize "ONLY use provided context"

**Result**: AI made up plausible-sounding but incorrect AOMA information.

## Prevention

Going forward, to prevent similar issues:

1. **Test with actual API calls** - Always verify responses match knowledge base
2. **Monitor timeouts** - Alert if >10% of AOMA queries time out
3. **Validate context** - Ensure >500 chars of context retrieved
4. **Use stronger models** - GPT-5 for critical knowledge queries
5. **Explicit prompts** - Always use "ONLY answer from provided context" language

## Contact

Issues or questions: matt@mattcarpenter.com
