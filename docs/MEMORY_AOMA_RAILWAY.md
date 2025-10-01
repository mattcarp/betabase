# 🧠 MEMORY: AOMA Mesh MCP Deployment

**CRITICAL:** Remember this for all future sessions

## AOMA Mesh MCP Server Deployment

**✅ DEPLOYED TO:** Railway  
**❌ NOT DEPLOYED TO:** Render

### Railway Server Details
- **Primary URL:** `https://luminous-dedication-production.up.railway.app`
- **Health Endpoint:** `/health` (verified working)
- **RPC Endpoint:** `/rpc` (verified working)
- **Status:** ✅ ACTIVE and responding

### Important Notes
1. **Railway is the ONLY deployment** - Don't waste time checking Render
2. **Default URL in code should be Railway** - Not Render
3. **Never bypass AOMA for testing** - It's the core system functionality
4. **Health check works:** Returns status, latency, version info

### Configuration
```typescript
// Correct:
NEXT_PUBLIC_AOMA_MESH_SERVER_URL=https://luminous-dedication-production.up.railway.app

// Wrong (don't use):
// https://aoma-mesh-mcp.onrender.com (not deployed)
```

### Files to Remember
- `src/services/aomaParallelQuery.ts` - Must use Railway URL
- `src/services/aomaMeshMcp.ts` - Already configured correctly
- `.env.local` - Should have Railway URL

## Why This Matters
- Prevents wasting time debugging non-existent Render deployment
- Ensures AOMA queries go to the correct working server
- Avoids timeout issues from trying wrong endpoints

**Last Updated:** October 1, 2025
