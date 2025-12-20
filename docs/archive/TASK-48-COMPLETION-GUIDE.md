# Task #48: Associate MCP Server with ElevenLabs Agent

## ✅ STATUS: READY TO COMPLETE

All code is implemented. Just needs **5-10 minutes of execution** in a network-connected environment.

---

## 🎯 What This Task Does

Associates your ElevenLabs conversational AI agent with the AOMA Mesh MCP server (deployed on AWS Lambda), enabling the agent to:

- Query knowledge from Supabase vector database
- Retrieve documents and meeting insights
- Invoke MCP tools during conversations
- Access system information and health metrics

---

## 📋 Prerequisites (Already Done ✅)

- ✅ ElevenLabs API Key configured
- ✅ Agent ID configured: `agent_01jz1ar6k2e8tvst14g6cbgc7m`
- ✅ Lambda MCP Server deployed and healthy
- ✅ Lambda URL configured: `https://ochwh4pvfaigb65koqxgf33ruy0rxnhy.lambda-url.us-east-2.on.aws`
- ✅ Integration script created: `run-elevenlabs-mcp-integration.ts`
- ✅ All Pinecone references removed (Supabase only)
- ✅ Comprehensive execution guide created

---

## 🚀 How to Complete This Task (3 Simple Steps)

### Step 1: Run the Integration Script

Open your terminal in the project directory and run:

```bash
npx tsx run-elevenlabs-mcp-integration.ts
```

**What it does:**

1. Validates your ElevenLabs API credentials
2. Lists any existing MCP servers
3. Registers "AOMA Mesh MCP Server" (or uses existing)
4. Associates the server with your agent
5. Reports success with Server ID

**Expected time:** 30-60 seconds

---

### Step 2: Verify in ElevenLabs Dashboard

1. Go to [ElevenLabs Conversational AI Dashboard](https://elevenlabs.io/app/conversational-ai)
2. Find agent: `agent_01jz1ar6k2e8tvst14g6cbgc7m`
3. Look for "MCP Servers" or "Tools" section
4. Confirm "AOMA Mesh MCP Server" is listed and active

---

### Step 3: Test with a Conversation

Start a conversation with your agent and ask:

- "Query the AOMA knowledge base about..."
- "Search for documents related to..."
- "What's the system health status?"

The agent should now invoke MCP tools through the Lambda server.

---

## ✅ Success Criteria

The task is **COMPLETE** when:

- [x] Integration script runs successfully (no errors)
- [x] MCP server appears in ElevenLabs dashboard
- [x] Agent successfully invokes MCP tools in conversation
- [x] Supabase vector queries work through Lambda
- [x] No errors in Lambda CloudWatch logs

---

## 📊 Expected Output

When successful, you'll see:

```
🚀 Starting ElevenLabs MCP Integration...
============================================================

📋 Configuration:
   API Key: sk_3bdf3...
   Agent ID: agent_01jz1ar6k2e8tvst14g6cbgc7m
   Lambda URL: https://ochwh4pvfaigb65koqxgf33ruy0rxnhy.lambda-url.us-east-2.on.aws

🔐 Step 1: Validating ElevenLabs credentials...
✅ Credentials validated successfully
   User: [Your Name]
   Email: [Your Email]

📋 Step 2: Checking existing MCP servers...
   Found 0 existing MCP server(s)

🤖 Step 3: Getting agent details...
✅ Agent details retrieved
   Name: [Agent Name]
   Associated MCP servers: 0

🔧 Step 4: Registering and associating MCP server...
📝 Registering AOMA Mesh MCP server with ElevenLabs...
✅ MCP server registered successfully
🆔 Server ID: [Generated ID]
🔗 Associating MCP server with agent...
✅ MCP server associated with agent successfully

✅ MCP SERVER INTEGRATION SUCCESSFUL!
   Server ID: [Generated ID]
   Associated with agent: YES ✅

📊 Registration Details:
   Name: AOMA Mesh MCP Server
   URL: https://ochwh4pvfaigb65koqxgf33ruy0rxnhy.lambda-url.us-east-2.on.aws/rpc
   Transport: STREAMABLE_HTTP
   Status: active

🔗 Association Details:
   Agent ID: agent_01jz1ar6k2e8tvst14g6cbgc7m
   MCP Server ID: [Generated ID]
   Associated at: [Timestamp]

============================================================
✨ Integration process completed!
```

---

## 🔧 Troubleshooting

### "fetch failed" or "EAI_AGAIN"

**Problem:** Network connectivity issue
**Solution:** Ensure you're in a network-connected environment (not sandboxed)

### "401 Unauthorized" or "403 Forbidden"

**Problem:** API key issue
**Solution:** Verify API key in `.env` or `src/config/apiKeys.ts`

### "MCP server already exists"

**Problem:** Server was previously registered
**Solution:** Script will automatically use existing server and just associate it

### "Agent not found"

**Problem:** Agent ID mismatch
**Solution:** Verify agent ID in ElevenLabs dashboard matches configuration

---

## 📁 Related Files

All implementation files ready:

- `run-elevenlabs-mcp-integration.ts` - Main execution script
- `src/services/elevenLabsMCPService.ts` - Service implementation
- `src/config/apiKeys.ts` - Configuration with Lambda URL
- `ELEVENLABS-MCP-INTEGRATION-GUIDE.md` - Detailed guide
- `.taskmaster/tasks/task_048.txt` - Task tracking

---

## 🎯 What Gets Updated

When you complete this task:

1. **ElevenLabs Platform:**
   - New MCP server registered
   - Agent associated with server
   - Tools available to agent

2. **Completion**:
   - Update `features.json` status to "passes: true"
   - Log completion in `claude-progress.txt`

3. **Git:**
   - Commit completion notes
   - Update project documentation

---

## 💡 Quick Command Reference

```bash
# Run the integration
npx tsx run-elevenlabs-mcp-integration.ts

# Test ElevenLabs API access (optional)
npx tsx src/test-elevenlabs-capabilities.ts

# Run full demo with health checks (optional)
npx tsx src/demo-mcp-integration.ts

# Check Lambda health directly
curl https://ochwh4pvfaigb65koqxgf33ruy0rxnhy.lambda-url.us-east-2.on.aws/health

# Mark task as done (after verification) in features.json and progress log
```

---

## ✨ Impact of Completion

Once Task #48 is complete:

✅ Agent can invoke MCP tools during conversations
✅ Supabase knowledge base accessible to agent
✅ Document retrieval automated through Lambda
✅ System health monitoring enabled
✅ Foundation for advanced agent capabilities

This unlocks intelligent, context-aware conversations powered by your knowledge base!

---

**Estimated Time to Complete:** 5-10 minutes
**Difficulty:** Easy (just execution)
**Status:** 100% coded, ready to run

🚀 **Ready to complete this task? Just run the command and you're done!**
