# Missing Environment Variables in Render - CRITICAL

**Issue**: Production chat is giving generic answers instead of AOMA-specific knowledge

**Root Cause**: Missing environment variables in Render that are required for AOMA orchestrator and vector search

---

## Required Environment Variables

Add these to Render (Dashboard → Environment tab):

```bash
# OpenAI - REQUIRED for chat and embeddings
OPENAI_API_KEY=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

# OpenAI Assistant - REQUIRED for vector store
OPENAI_ASSISTANT_ID=asst_VvOHL1c4S6YapYKun4mY29fM

# AOMA Mesh Server - REQUIRED for AOMA knowledge
NEXT_PUBLIC_AOMA_MESH_SERVER_URL=https://luminous-dedication-production.up.railway.app

# Supabase - REQUIRED for auth (already added earlier)
NEXT_PUBLIC_SUPABASE_URL=https://kfxetwuuzljhybfgmpuc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmeGV0d3V1emxqaHliZmdtcHVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYyOTYzMzMsImV4cCI6MjA1MTg3MjMzM30.2doKvph3M-JltbRy-RpqmglECqqivqbakwzdTloQBxg
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmeGV0d3V1emxqaHliZmdtcHVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjI5NjMzMywiZXhwIjoyMDUxODcyMzMzfQ.LX04PQaQFJ7Tz_USQcbMPiuROMEEVaDFywoOLTjE4xk
```

---

## What Each Does:

### OPENAI_API_KEY
- Powers the chat responses
- Generates embeddings for vector search
- **Without this**: Chat will fail completely

### OPENAI_ASSISTANT_ID
- Links to OpenAI Assistant with vector store
- Contains AOMA knowledge embeddings
- **Without this**: No AOMA-specific answers

### NEXT_PUBLIC_AOMA_MESH_SERVER_URL
- Railway MCP server with AOMA context
- Provides additional AOMA knowledge
- **Without this**: Limited AOMA knowledge

### Supabase vars
- Authentication system
- Vector search database
- **Without these**: Can't login, vector search fails

---

## Current Symptoms:

- ✅ Local dev: Works perfectly (has all env vars)
- ❌ Production: Generic answers like "I don't have access to the AOMA documentation"
- ❌ Vector search may be working but AI doesn't have proper context

---

## Steps to Fix:

1. Go to: https://dashboard.render.com/web/srv-d2f8f0emcj7s73eh647g
2. Click **Environment** tab
3. Add all 6 environment variables above
4. Click **Save Changes**
5. Wait for auto-redeploy (~3 minutes)
6. Test chat with "How do I submit assets?"
7. Should get proper AOMA UST answer

---

**Priority**: CRITICAL - Production chat is broken without these
**ETA**: 5 minutes to add + 3 minutes redeploy = 8 minutes total
