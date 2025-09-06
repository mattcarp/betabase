# MCP Configuration Update

## Summary

Fixed `.mcp.json` configuration to properly support both local development and production environments for AOMA MCP.

## Changes Made

### Cleaned Up MCP Configuration:

1. **Removed failing servers** - playwright, browser-tools, task-master-ai (had placeholder keys)
2. **Removed hardcoded API keys** - Testsprite API key removed (was exposed in config)
3. **Kept local aoma-mesh** - For development and testing as we develop this server
4. **Environment variables** - All sensitive keys should be in .env file, not in .mcp.json

### Current Configuration:

- **aoma-mesh-local** - Points to local development server (when built)
  - Path: `/Users/matt/Documents/projects/aoma-mesh-mcp/dist/aoma-mesh-server.js`
  - The server will read API keys from system environment variables

## AOMA MCP Server Access

The AOMA MCP functionality is accessed through:

1. **Web API Proxy** (Currently Working):
   - Endpoint: `https://iamsiam.ai/api/aoma-mcp`
   - Proxies to: `https://luminous-dedication-production.up.railway.app`
   - Status: ✅ Healthy

2. **Direct Service Connection** (Already Configured):
   - The `aomaMeshMcp.ts` service already uses the hosted server
   - URL: `https://luminous-dedication-production.up.railway.app`
   - Health endpoint confirmed working

## How AOMA MCP Works Now

1. **Frontend (Browser)** → Makes requests to `/api/aoma-mcp`
2. **Next.js API Route** → Proxies to Railway hosted server
3. **Railway Server** → Processes AOMA knowledge queries
4. **Response** → Returns through the proxy chain

## Testing MCP Connection

To test if AOMA MCP is working:

```bash
# Check health
curl https://iamsiam.ai/api/aoma-mcp

# Test query (will timeout but confirms connection attempt)
curl -X POST https://iamsiam.ai/api/aoma-mcp \
  -H "Content-Type: application/json" \
  -d '{"action": "tools/call", "tool": "query_aoma_knowledge", "args": {"query": "test"}}'
```

## Required Environment Variables

Add these to your `.env` file (never commit actual keys):

```bash
# For AOMA MCP Server (if running locally)
OPENAI_API_KEY=your_openai_api_key_here
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_key_here

# For Testsprite MCP (if needed)
TESTSPRITE_API_KEY=your_testsprite_key_here
```

## Notes

- The hosted AOMA MCP server at Railway is healthy and running
- Local MCP server is for development/testing of aoma-mesh-mcp
- The web application uses the API proxy for production
- Never hardcode API keys in .mcp.json - use environment variables
- Claude Code will read from system environment when launching MCP servers
