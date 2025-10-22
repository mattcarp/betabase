# SIAM → aoma-mesh-mcp Connection Configuration

## Summary

**SIAM (Render deployment)** connects to **aoma-mesh-mcp (Railway deployment)** via HTTP/RPC calls.

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│ SIAM Web App (Next.js)                               │
│ Deployed on: Render.com                              │
│ URL: https://siam.onrender.com (or your domain)      │
│                                                       │
│  ┌────────────────────────────────────────────────┐  │
│  │ Frontend (Browser)                             │  │
│  │ - React components                             │  │
│  │ - Chat interface                               │  │
│  │ - AOMA knowledge panels                        │  │
│  └────────────┬───────────────────────────────────┘  │
│               │                                       │
│               │ HTTP requests with                    │
│               │ NEXT_PUBLIC_AOMA_MESH_SERVER_URL      │
│               ▼                                       │
│  ┌────────────────────────────────────────────────┐  │
│  │ Backend API Routes                             │  │
│  │ - /api/aoma-mcp/route.ts                       │  │
│  │ - src/services/aomaParallelQuery.ts            │  │
│  │ - src/services/aomaMeshMcp.ts                  │  │
│  └────────────┬───────────────────────────────────┘  │
└────────────────┼───────────────────────────────────────┘
                 │
                 │ HTTP POST to /rpc
                 │ (JSON-RPC protocol)
                 │
                 ▼
┌──────────────────────────────────────────────────────┐
│ aoma-mesh-mcp Server                                 │
│ Deployed on: Railway.com                             │
│ URL: https://luminous-dedication-production         │
│      .up.railway.app                                 │
│                                                       │
│  ┌────────────────────────────────────────────────┐  │
│  │ MCP Server (Node.js/TypeScript)                │  │
│  │ - /rpc endpoint (JSON-RPC 2.0)                 │  │
│  │ - /health endpoint                             │  │
│  │ - query_aoma_knowledge tool                    │  │
│  └────────────┬───────────────────────────────────┘  │
│               │                                       │
│               ▼                                       │
│  ┌────────────────────────────────────────────────┐  │
│  │ GPT-5 Assistant API + OpenAI Vector Store      │  │
│  │ - Handles large AOMA documents                 │  │
│  │ - Returns comprehensive answers                │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

---

## Connection Configuration

### In SIAM (Render Environment Variables)

**MUST SET in Render.com Dashboard:**

```bash
NEXT_PUBLIC_AOMA_MESH_SERVER_URL=https://luminous-dedication-production.up.railway.app
NEXT_PUBLIC_AOMA_MESH_RPC_URL=https://luminous-dedication-production.up.railway.app/rpc
NEXT_PUBLIC_AOMA_MESH_HEALTH_URL=https://luminous-dedication-production.up.railway.app/health
```

**File:** `.env.render` (now corrected)

---

## How SIAM Connects to aoma-mesh-mcp

### 1. Frontend Components

Components like `AOMAKnowledgePanel.tsx` and `ai-sdk-chat-panel.tsx` make API calls:

```typescript
// Example from src/services/aomaParallelQuery.ts
private readonly RAILWAY_URL =
  process.env.NEXT_PUBLIC_AOMA_MESH_SERVER_URL ||
  "https://luminous-dedication-production.up.railway.app";
```

### 2. Backend Services

Services like `aomaParallelQuery.ts` and `aomaMeshMcp.ts` handle the actual HTTP communication:

```typescript
async queryEndpoint(query: string, strategy: string) {
  const response = await fetch(`${this.RAILWAY_URL}/rpc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'query_aoma_knowledge',
        arguments: { query, strategy }
      }
    })
  });

  return await response.json();
}
```

### 3. RPC Protocol

Uses JSON-RPC 2.0 format:

**Request:**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "query_aoma_knowledge",
    "arguments": {
      "query": "What are the steps for AOMA cover hot swap?",
      "strategy": "focused"
    }
  }
}
```

**Response:**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"response\": \"The steps for...\", \"metadata\": {...}}"
      }
    ]
  }
}
```

---

## Files Involved in Connection

### SIAM Files

| File                                       | Purpose                                 |
| ------------------------------------------ | --------------------------------------- |
| `src/services/aomaParallelQuery.ts`        | Main connection logic, parallel queries |
| `src/services/aomaMeshMcp.ts`              | MCP client wrapper                      |
| `src/services/aomaOrchestrator.ts`         | Orchestrates AOMA queries               |
| `src/components/ui/AOMAKnowledgePanel.tsx` | UI component                            |
| `src/components/ai/ai-sdk-chat-panel.tsx`  | Chat integration                        |
| `.env.render`                              | Render environment config               |
| `.env.local`                               | Local development config                |

### aoma-mesh-mcp Files

| File                               | Purpose                         |
| ---------------------------------- | ------------------------------- |
| `src/index.ts`                     | MCP server entry point          |
| `src/tools/aoma-knowledge.tool.ts` | Query handler                   |
| `src/services/openai.service.ts`   | GPT-5 Assistant API integration |
| `src/services/supabase.service.ts` | Vector search fallback          |

---

## Testing the Connection

### From Local (SIAM Development)

```bash
cd ~/Documents/projects/siam
npm run dev

# In browser: http://localhost:3000
# Open chat, ask: "What is AOMA cover hot swap?"
```

### From Render (Production SIAM)

```bash
# Health check
curl https://siam.onrender.com/api/health

# Should show aoma connection status
curl https://siam.onrender.com/api/aoma/health
```

### Direct aoma-mesh-mcp Test

```bash
# Health check
curl https://luminous-dedication-production.up.railway.app/health

# Direct query test
curl -X POST https://luminous-dedication-production.up.railway.app/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "query_aoma_knowledge",
      "arguments": {
        "query": "What is AOMA?",
        "strategy": "rapid"
      }
    }
  }'
```

---

## Common Issues and Solutions

### Issue 1: "Cannot connect to aoma-mesh-mcp"

**Symptom:** SIAM shows connection errors in browser console

**Fix:**

1. Check environment variables in Render dashboard
2. Ensure `NEXT_PUBLIC_AOMA_MESH_SERVER_URL` is set to Railway URL
3. Verify aoma-mesh-mcp is running: `curl https://luminous-dedication-production.up.railway.app/health`

### Issue 2: "404 Not Found on /rpc"

**Symptom:** RPC endpoint returns 404

**Fix:**

1. Verify aoma-mesh-mcp is deployed and running on Railway
2. Check Railway logs for errors
3. Ensure `/rpc` endpoint is exposed in aoma-mesh-mcp

### Issue 3: "Timeout waiting for AOMA response"

**Symptom:** Queries take >60s and timeout

**Fix:**

1. Expected: 30-75s for complex queries (using GPT-5 Assistant API)
2. Increase timeout in `aomaParallelQuery.ts` if needed
3. Use "rapid" strategy for faster responses

### Issue 4: "CORS errors in browser"

**Symptom:** Browser blocks requests to aoma-mesh-mcp

**Fix:**

1. aoma-mesh-mcp should have CORS headers set
2. Check `src/index.ts` in aoma-mesh-mcp for CORS config
3. Ensure Railway URL is in allowed origins

---

## Performance Expectations

| Query Type | Strategy      | Expected Time | Quality       |
| ---------- | ------------- | ------------- | ------------- |
| Simple     | rapid         | 10-20s        | Good          |
| Workflow   | focused       | 30-45s        | Excellent     |
| Complex    | comprehensive | 60-75s        | Very detailed |

**Note:** These times are with GPT-5 Assistant API. Future migration to Supabase + LangGraph should reduce to 10-15s.

---

## Security Considerations

### 1. API Keys

- OpenAI API key stored in aoma-mesh-mcp (Railway)
- Not exposed to SIAM frontend
- Only backend-to-backend communication

### 2. Network

- All connections over HTTPS
- Railway provides SSL certificates automatically
- No authentication required between SIAM and aoma-mesh-mcp (public endpoints)

### 3. Rate Limiting

- Consider adding rate limiting to aoma-mesh-mcp `/rpc` endpoint
- Prevent abuse of expensive GPT-5 queries

---

## Deployment Checklist

When deploying SIAM to Render:

- [ ] Set `NEXT_PUBLIC_AOMA_MESH_SERVER_URL` to Railway URL
- [ ] Set `NEXT_PUBLIC_AOMA_MESH_RPC_URL` to `/rpc` endpoint
- [ ] Set `NEXT_PUBLIC_AOMA_MESH_HEALTH_URL` to `/health` endpoint
- [ ] Verify aoma-mesh-mcp is running on Railway
- [ ] Test connection from Render to Railway
- [ ] Check CORS headers allow Render domain
- [ ] Monitor query response times
- [ ] Set up error tracking for failed queries

---

## Future Improvements

### Short Term

1. Add caching for common queries
2. Implement request retry logic
3. Add connection health monitoring

### Long Term (per ROADMAP.md)

1. Migrate from OpenAI Vector Store to Supabase
2. Replace GPT-5 Assistant API with LangGraph pipeline
3. Reduce response times from 30-75s to 10-15s
4. Add streaming responses for better UX

---

Last Updated: October 2, 2025  
Status: ✅ Connection configured and working
