# Render Production Environment Variables

**CRITICAL**: These environment variables must be set in the Render dashboard before deploying to production.

## Access Render Dashboard

1. Go to https://dashboard.render.com
2. Select the SIAM web service
3. Navigate to "Environment" tab

## Required Environment Variables

Set these in Render dashboard:

```bash
# Node Environment
NODE_ENV=production

# OpenAI Configuration (Server-side only)
OPENAI_API_KEY=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
OPENAI_ASSISTANT_ID=asst_VvOHL1c4S6YapYKun4mY29fM

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://kfxetwuuzljhybfgmpuc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmeGV0d3V1emxqaHliZmdtcHVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYyOTYzMzMsImV4cCI6MjA1MTg3MjMzM30.2doKvph3M-JltbRy-RpqmglECqqivqbakwzdTloQBxg
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmeGV0d3V1emxqaHliZmdtcHVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjI5NjMzMywiZXhwIjoyMDUxODcyMzMzfQ.LX04PQaQFJ7Tz_USQcbMPiuROMEEVaDFywoOLTjE4xk

# AOMA Configuration
NEXT_PUBLIC_AOMA_MESH_SERVER_URL=https://luminous-dedication-production.up.railway.app

# Render API (for MCP integration)
RENDER_API_KEY=rnd_HZU9KL6FIbLG8WizDstxIIZfBKDP
```

## CRITICAL: Variables That Must NOT Be Set

These variables should **NEVER** be set in production (security risks):

```bash
# ❌ DO NOT SET THESE IN PRODUCTION ❌
# NEXT_PUBLIC_BYPASS_AUTH          # Disables authentication
# NEXT_PUBLIC_BYPASS_AOMA          # Disables AOMA integration
# NEXT_PUBLIC_OPENAI_API_KEY       # Exposes API key to client
```

## Verification Checklist

After updating environment variables:

- [ ] All required variables are set
- [ ] No bypass flags are present
- [ ] OPENAI_API_KEY uses server-side variable (not NEXT_PUBLIC_)
- [ ] Trigger a manual deploy to apply changes
- [ ] Monitor deployment logs for errors
- [ ] Test authentication on production URL
- [ ] Test AOMA integration with a knowledge query
- [ ] Verify no console errors in browser

## Deployment Steps

1. Update environment variables in Render dashboard
2. Click "Manual Deploy" → "Clear build cache & deploy"
3. Monitor deployment logs in Render dashboard
4. Run production tests: `BASE_URL=https://thebetabase.com npm run test:aoma`
5. Verify zero console errors in browser DevTools

## Quick Access

- **Render Dashboard**: https://dashboard.render.com
- **SIAM Production**: https://thebetabase.com
- **AOMA MCP Server**: https://luminous-dedication-production.up.railway.app

---

**Last Updated**: 2025-10-10
**Status**: Ready for manual configuration
