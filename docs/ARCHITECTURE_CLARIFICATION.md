# SIAM Architecture Clarification - AOMA Mesh MCP Integration

**Date:** October 1, 2025

## Summary

SIAM uses a **hybrid architecture** combining AOMA Mesh MCP for context and OpenAI for response generation.

## Architecture Overview

```
User Message
    ↓
[SIAM /api/chat Endpoint]
    ↓
    ├─→ [AOMA Orchestrator] ──→ [AOMA Mesh MCP Server] (Railway/Render)
    │        ↓                      ↓
    │   Queries knowledge base   Uses OpenAI Assistant API
    │   Returns context          Returns enriched context
    │        ↓
    ├─→ [Combine Context]
    │        ↓
    └─→ [OpenAI Direct API]
             ↓
        Generate final response with AOMA context
             ↓
        Stream back to user
```

## Why Both OpenAI Integrations?

### 1. AOMA Mesh MCP (Deployed Server)
- **Purpose**: Knowledge base queries, Jira search, Git analysis
- **Uses**: OpenAI Assistant API with custom AOMA Assistant ID
- **URL**: `https://luminous-dedication-production.up.railway.app`
- **API Key**: Configured in AOMA server environment
- **Tools**: 
  - `query_aoma_knowledge` - Query 1000+ AOMA documents
  - `search_jira_tickets` - Semantic JIRA search
  - `search_git_commits` - Git history analysis
  - More specialized tools...

### 2. OpenAI Direct (SIAM App)
- **Purpose**: Generate final chat responses with AOMA context
- **Uses**: OpenAI Chat Completions API
- **API Key**: Configured in SIAM `.env.local`
- **Model**: `gpt-4o-mini` (or user-selected model)
- **Why needed**: 
  - AOMA Assistant is specialized for knowledge retrieval
  - Final response generation needs conversational model
  - Allows model selection by user

## Data Flow Example

**User asks**: "How do I configure the data pipeline?"

1. **SIAM receives message** → `/api/chat` endpoint
2. **AOMA Orchestrator called** → `aomaOrchestrator.executeOrchestration(query)`
3. **AOMA Mesh MCP queried** → POST to `/rpc` with `query_aoma_knowledge` tool
4. **AOMA Assistant searches** → Uses OpenAI Assistant API + vector search
5. **Context returned** → Relevant docs, procedures, code examples
6. **Enhanced prompt created** → System prompt + user message + AOMA context
7. **OpenAI Direct called** → `openai.chat.completions.create()` with enhanced prompt
8. **Response generated** → Conversational answer using AOMA knowledge
9. **Streamed to user** → Real-time response delivery

## Configuration Requirements

### AOMA Mesh MCP Server (.env)
```bash
OPENAI_API_KEY=sk-... # For AOMA Assistant API
AOMA_ASSISTANT_ID=asst_... # Custom AOMA assistant
NEXT_PUBLIC_SUPABASE_URL=... # Vector database
SUPABASE_SERVICE_ROLE_KEY=...
```

### SIAM App (.env.local)
```bash
OPENAI_API_KEY=sk-... # For chat completions ✅ NOW CONFIGURED
NEXT_PUBLIC_AOMA_MESH_SERVER_URL=https://luminous-dedication-production.up.railway.app
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Recent Fix: max_tokens → max_completion_tokens

**Problem**: OpenAI deprecated `max_tokens` parameter for newer models.

**Solution**: Updated `/app/api/chat/route.ts`:
```typescript
// Before
max_tokens: 4000,

// After  
max_completion_tokens: 4000, // ✅ Fixed
```

**Error was**: `400 Unsupported parameter: 'max_tokens' is not supported with this model`

## Benefits of This Architecture

1. **Separation of Concerns**
   - AOMA MCP: Specialized knowledge retrieval
   - Direct OpenAI: Conversational response generation

2. **Scalability**
   - AOMA server handles heavy vector searches
   - SIAM app focuses on user experience

3. **Flexibility**
   - Can switch chat models without affecting knowledge base
   - Can upgrade AOMA tools independently

4. **Performance**
   - Knowledge queries parallelized in AOMA server
   - Final response generation optimized for streaming

## Files Involved

### AOMA Integration
- `src/services/aomaOrchestrator.ts` - Orchestrates AOMA calls
- `src/services/aomaMeshMcp.ts` - AOMA MCP client
- `src/services/aomaParallelQuery.ts` - Parallel knowledge queries

### Chat API
- `app/api/chat/route.ts` - Main chat endpoint (uses both systems)
- `src/config/modelConfig.ts` - Model selection configuration

### Environment
- `.env.local` - SIAM app secrets (OpenAI key NOW configured ✅)
- `.env.local.example` - Template for required vars

## Status: ✅ ARCHITECTURE CORRECT

The dual OpenAI usage is **intentional and correct**:
- AOMA Mesh MCP uses OpenAI for specialized knowledge retrieval
- SIAM uses OpenAI for final conversational response generation
- Both are needed for the full AI assistant experience

## Next Steps

1. ✅ OpenAI API key configured in SIAM
2. ✅ max_completion_tokens parameter fixed
3. ⏳ Test full chat flow with real messages
4. 🔄 Verify AOMA orchestration performance
