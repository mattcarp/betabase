# Render.com Environment Variables - REQUIRED

**CRITICAL:** These environment variables must be set in the Render.com dashboard for SIAM to work properly.

---

## AOMA Mesh MCP Server (CRITICAL - Railway URLs!)

**IMPORTANT:** aoma-mesh-mcp is deployed to **Railway**, NOT Render!

```bash
NEXT_PUBLIC_AOMA_ENDPOINT=https://luminous-dedication-production.up.railway.app
NEXT_PUBLIC_AOMA_MESH_SERVER_URL=https://luminous-dedication-production.up.railway.app
NEXT_PUBLIC_AOMA_MESH_RPC_URL=https://luminous-dedication-production.up.railway.app/rpc
NEXT_PUBLIC_AOMA_MESH_HEALTH_URL=https://luminous-dedication-production.up.railway.app/health
```

**Why Railway?** 
- aoma-mesh-mcp has always been deployed to Railway
- Railway URL: https://luminous-dedication-production.up.railway.app
- Health check: https://luminous-dedication-production.up.railway.app/health

---

## AWS Cognito (Authentication)

```bash
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-2_A0veaJRLo
NEXT_PUBLIC_COGNITO_CLIENT_ID=5c6ll37299p351to549lkg3o0d
NEXT_PUBLIC_AWS_REGION=us-east-2
NEXT_PUBLIC_COGNITO_REGION=us-east-2
```

---

## OpenAI API (Required for Chat)

```bash
OPENAI_API_KEY=<your-production-openai-key>
NEXT_PUBLIC_OPENAI_API_KEY=<your-production-openai-key>
```

**Get from:** OpenAI dashboard

---

## Supabase (Database & Vector Store)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://kfxetwuuzljhybfgmpuc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from-supabase-dashboard>
SUPABASE_SERVICE_ROLE_KEY=<from-supabase-dashboard>
```

**Get from:** Supabase project settings → API

---

## Optional: ElevenLabs (Voice)

```bash
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=agent_01jz1ar6k2e8tvst14g6cbgc7m
ELEVENLABS_API_KEY=<your-elevenlabs-key>
```

**Get from:** ElevenLabs dashboard

---

## Build Configuration

```bash
NODE_ENV=production
PORT=10000
HOSTNAME=0.0.0.0
NEXT_TELEMETRY_DISABLED=1
```

---

## MCP Integration Flags

```bash
NEXT_PUBLIC_ENABLE_MCP_INTEGRATION=true
NEXT_PUBLIC_MCP_AUTO_REGISTER=true
NEXT_PUBLIC_MCP_HEALTH_CHECK_INTERVAL=30000
```

---

## Debug Settings (Production)

```bash
NEXT_PUBLIC_DEBUG_MODE=false
NEXT_PUBLIC_LOG_LEVEL=info
NEXT_PUBLIC_BYPASS_AUTH=false  # NEVER set to true in production!
```

---

## How to Set in Render Dashboard

1. Go to https://dashboard.render.com/
2. Select your **siam-app** service
3. Click **Environment** tab
4. Click **Add Environment Variable**
5. Add each variable from above

**Test with:**
```bash
curl https://your-siam-app.onrender.com/api/health
```

Should return:
```json
{
  "status": "ok",
  "aomaConnection": "https://luminous-dedication-production.up.railway.app"
}
```

---

## Verification Checklist

After setting environment variables in Render:

- [ ] SIAM app builds successfully
- [ ] SIAM app starts and responds to health check
- [ ] Can reach aoma-mesh-mcp at Railway URL
- [ ] Chat functionality works
- [ ] AOMA knowledge queries return results
- [ ] Authentication flow works (if not bypassed)

**Test AOMA connection:**
```bash
curl https://luminous-dedication-production.up.railway.app/health
```

Should return:
```json
{
  "status": "healthy",
  "version": "2.7.0-railway_20251002-152554",
  "services": {
    "openai": { "status": true },
    "supabase": { "status": true },
    "vectorStore": { "status": true }
  }
}
```

---

## Common Mistakes to Avoid

1. ❌ **Using Render URL for aoma-mesh-mcp** 
   - aoma-mesh-mcp is NOT deployed to Render
   - Must use Railway URL

2. ❌ **Missing NEXT_PUBLIC_ prefix**
   - Frontend needs NEXT_PUBLIC_* vars
   - Backend can use without prefix

3. ❌ **Wrong Cognito region**
   - Must be us-east-2 (not us-east-1)

4. ❌ **Bypass auth in production**
   - Never set NEXT_PUBLIC_BYPASS_AUTH=true in production
   - Only for local development

---

## Need Help?

**Check logs:**
```bash
# From Render dashboard → Logs tab
# Or via CLI:
render logs <service-name> --tail 100
```

**Test endpoints:**
```bash
# SIAM health
curl https://your-siam-app.onrender.com/api/health

# AOMA mesh health  
curl https://luminous-dedication-production.up.railway.app/health
```

**Debug connection:**
```bash
# Check if SIAM can reach aoma-mesh-mcp
curl https://your-siam-app.onrender.com/api/aoma/health
```

---

Last Updated: October 2, 2025
