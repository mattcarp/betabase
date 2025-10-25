# ElevenLabs Integration - Issues to Resolve

**Date**: October 24, 2025
**Status**: ⚠️ TWO CRITICAL ISSUES

---

## Issue 1: Microphone Input Stopped Working ❌

### Symptoms
- Input level showing 0% (was working at 5-22% earlier)
- WebSocket connection errors: "WebSocket is already in CLOSING or CLOSED state"
- Auto-reconnection loop occurring
- Connected on Bluetooth headphones (Matties XM5 Over-Ear) but not capturing audio

### What Changed
The microphone was working perfectly after we disabled the custom audio processor. Something has caused the WebSocket connection to become unstable.

### Possible Causes
1. **Bluetooth device switching** - The system may have switched audio input devices
2. **WebSocket connection timeout** - Long-running connection may have timed out
3. **Browser audio context suspended** - Chrome/Safari may have suspended the audio context
4. **ElevenLabs session expired** - The conversation session may have a time limit

### Immediate Fix Needed
1. Stop the current conversation completely
2. Hard refresh the browser (Cmd+Shift+R)
3. Start a new conversation with fresh WebSocket connection
4. Verify Bluetooth headphones are selected as default input in System Preferences

### Long-term Solution
Add better error handling and automatic recovery:
```typescript
// In useElevenLabsConversation.ts
onError: (err) => {
  console.error("❌ ElevenLabs: Conversation error:", err);
  setError(err);
  setStatus("error");

  // Auto-recovery for specific error types
  if (err.message.includes("WebSocket")) {
    console.log("🔄 WebSocket error detected, attempting reconnection...");
    setTimeout(() => reconnect(), 3000);
  }
}
```

---

## Issue 2: Agent Has No Access to AOMA Knowledge ❌

### Root Cause Discovered
The ElevenLabs knowledge base is **completely empty**.

**API Response**:
```json
{
  "documents": [],
  "next_cursor": null,
  "has_more": false
}
```

### Why RAG Isn't Working
Even though we enabled RAG (`"rag": { "enabled": true }`), there are **no documents** for the agent to retrieve from.

### The MCP Server Misconception
The MCP server (`uR5cKaU7GOZQyS04RVXP`) is connected, but:
- MCP servers provide **tools** for the agent to call
- They don't automatically populate the RAG knowledge base
- The knowledge base needs documents uploaded via ElevenLabs API

### Architecture Clarification

**What We Thought**:
```
User Question
    ↓
Agent with RAG
    ↓
MCP Server (reads from Supabase)
    ↓
Returns AOMA knowledge
```

**What Actually Happens**:
```
User Question
    ↓
Agent with RAG
    ↓
ElevenLabs Knowledge Base (EMPTY!)
    ↓
No documents found
    ↓
Agent responds generically
```

The MCP server exists but RAG doesn't query it - RAG queries the **ElevenLabs-hosted knowledge base**.

---

## Solution: Upload AOMA Documents to ElevenLabs Knowledge Base

### Step 1: Export AOMA Documents from Supabase

We need to get AOMA documents from our Supabase database and upload them to ElevenLabs.

```bash
# Query Supabase for AOMA documents
SELECT id, title, content, metadata
FROM documents
WHERE title ILIKE '%aoma%'
OR content ILIKE '%aoma%'
LIMIT 100;
```

### Step 2: Upload Documents to ElevenLabs

Use the ElevenLabs Knowledge Base API:

```bash
# Upload a document
curl -X POST "https://api.elevenlabs.io/v1/convai/knowledge-base" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "AOMA Overview",
    "content": "AOMA (Asset and Offering Management Application) is...",
    "document_type": "text"
  }'
```

### Step 3: Associate Documents with Agent

Once uploaded, documents need to be linked to the agent:

```bash
# Update agent to use knowledge base documents
curl -X PATCH "https://api.elevenlabs.io/v1/convai/agents/agent_01jz1ar6k2e8tvst14g6cbgc7m" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_config": {
      "agent": {
        "prompt": {
          "knowledge_base": ["<document_id_1>", "<document_id_2>", ...]
        }
      }
    }
  }'
```

---

## Alternative Solution: Use MCP Tools Instead of RAG

### The MCP Approach

Instead of RAG (which requires uploading documents), we can make the agent **call MCP tools** to query Supabase directly.

### How It Works

1. **Register MCP Tools**: The MCP server exposes tools like `query_aoma_knowledge`
2. **Agent Calls Tool**: When asked about AOMA, agent calls `query_aoma_knowledge(question="What is AOMA?")`
3. **MCP Server Queries Supabase**: Lambda queries Supabase vector database
4. **Returns Results**: Tool returns AOMA information to agent
5. **Agent Responds**: Agent uses tool results to answer user

### Advantages of MCP Tools
- ✅ No document upload needed
- ✅ Always up-to-date (queries live database)
- ✅ More flexible querying
- ✅ Can return structured data

### Disadvantages
- ⚠️ Requires approval for each tool call (unless we fix the approval policy)
- ⚠️ Slower than RAG (network round-trip to Lambda)
- ⚠️ More complex error handling

### Enable MCP Tools

1. **Check what tools the MCP server provides**:
```bash
curl "https://ochwh4pvfaigb65koqxgf33ruy0rxnhy.lambda-url.us-east-2.on.aws/rpc" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}'
```

2. **Set approval policy to allow automatic tool use**:
   - Change from `require_approval_all` to `no_approval`
   - Or pre-approve specific tool hashes

3. **Update agent prompt to use tools**:
```
You are an expert on AOMA. When asked about AOMA, use the query_aoma_knowledge tool to retrieve accurate information from the knowledge base.
```

---

## Recommended Approach

### Short-term (Quick Fix)
1. **Fix microphone** - Hard refresh and reconnect
2. **Use MCP tools** - Configure tools for direct Supabase querying

### Long-term (Production Ready)
1. **Upload AOMA documents to ElevenLabs** - Full RAG with fast retrieval
2. **Keep MCP tools as fallback** - For complex queries RAG can't handle
3. **Add connection monitoring** - Better error handling and recovery

---

## Current Agent Configuration

**What's Configured**:
- ✅ Agent ID: `agent_01jz1ar6k2e8tvst14g6cbgc7m`
- ✅ MCP Server Connected: `uR5cKaU7GOZQyS04RVXP`
- ✅ RAG Enabled: `true`
- ✅ AOMA-Aware Prompt: Updated
- ❌ Knowledge Base: **EMPTY**
- ❌ MCP Tools: Approval required

**What Needs Fixing**:
1. Upload AOMA documents to knowledge base, OR
2. Configure MCP tools with automatic approval
3. Fix WebSocket connection stability

---

## Next Steps

### Option A: Upload Documents (Better for Production)
1. Export AOMA docs from Supabase
2. Upload to ElevenLabs via API
3. Link documents to agent
4. Test RAG retrieval

### Option B: Enable MCP Tools (Faster to Test)
1. List MCP server tools
2. Set approval policy to `no_approval`
3. Update agent prompt to use tools
4. Test tool calling

### Option C: Both (Best of Both Worlds)
1. Implement Option B first (quick test)
2. Implement Option A in background (better UX)
3. Use tools for complex queries, RAG for simple ones

---

## Testing Checklist

Once knowledge base is populated:

- [ ] Ask "What is AOMA?" - Should get accurate answer
- [ ] Ask "What does AOMA stand for?" - Should expand acronym correctly
- [ ] Ask "Tell me about AOMA2 vs AOMA3" - Should distinguish versions
- [ ] Ask "How do I create an asset in AOMA?" - Should provide workflow steps
- [ ] Verify agent cites sources (if using RAG)
- [ ] Verify agent shows tool calls (if using MCP tools)
- [ ] Microphone input working (5-25% input level)
- [ ] Audio output clear and responsive

---

## Summary

**Two separate problems**:

1. **Microphone stopped working** - WebSocket connection issue, needs reconnection
2. **No AOMA knowledge** - Knowledge base is empty, needs documents uploaded OR MCP tools configured

Both are fixable, but require different approaches. The microphone is a technical connectivity issue. The knowledge base is an architectural/configuration issue.
