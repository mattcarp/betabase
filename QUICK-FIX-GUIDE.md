# SIAM Chat Module - Quick Fix Guide

**🚨 CRITICAL: These fixes must be deployed within 24 hours**

This guide provides copy-paste code snippets to fix the most critical issues.

---

## Prerequisites

```bash
# Navigate to project
cd ~/Documents/projects/siam

# Create a feature branch
git checkout -b fix/critical-chat-security

# Install dependencies if needed
npm install zod
npm install @upstash/ratelimit @upstash/redis  # For rate limiting (optional)
```

---

## Fix #1: Add Authentication (P0 - CRITICAL)

**File**: `app/api/chat/route.ts`

**Add at line 1** (imports):
```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
```

**Replace the entire `POST` function** (starting at line 79):
```typescript
export async function POST(req: Request) {
  const chatStartTime = Date.now();

  try {
    // ========================================
    // AUTHENTICATION CHECK (ADDED)
    // ========================================
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.warn('[API] Unauthorized chat attempt');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`[API] Authenticated request from user: ${session.user.email}`);
    // ========================================
    // END AUTHENTICATION CHECK
    // ========================================

    // Check for API key first
    if (!process.env.OPENAI_API_KEY && !process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      console.error("[API] OPENAI_API_KEY is not set in environment variables");
      return new Response(
        JSON.stringify({
          error: "OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment."
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // ... rest of existing code unchanged ...
```

---

## Fix #2: Remove Client-Side API Key Exposure (P0 - CRITICAL)

**File**: `app/api/chat/route.ts`

**Find line 14** (around line 12-16):
```typescript
// BEFORE (INSECURE):
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});
```

**Replace with**:
```typescript
// AFTER (SECURE):
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Validate API key is set
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required');
}
```

---

## Fix #3: Disable AOMA Bypass (P0 - CRITICAL)

**File**: `app/api/chat/route.ts`

**Find line 156** (around line 155-157):
```typescript
// BEFORE (FEATURE DISABLED):
const bypassAOMA = process.env.NEXT_PUBLIC_BYPASS_AOMA === 'true';
console.log(`🔧 AOMA bypass flag: ${bypassAOMA} (env: ${process.env.NEXT_PUBLIC_BYPASS_AOMA})`);
```

**Replace with**:
```typescript
// AFTER (FEATURE ENABLED):
// Only bypass AOMA in development if explicitly requested
const bypassAOMA =
  process.env.NODE_ENV === 'development' &&
  process.env.NEXT_PUBLIC_BYPASS_AOMA === 'true';

console.log(`🔧 AOMA bypass: ${bypassAOMA} (dev=${process.env.NODE_ENV === 'development'}, flag=${process.env.NEXT_PUBLIC_BYPASS_AOMA})`);
```

---

## Fix #4: Add Input Validation (P1 - HIGH)

**File**: `app/api/chat/route.ts`

**Add at line 7** (after other imports):
```typescript
import { z } from 'zod';
```

**Add before the POST function** (around line 50):
```typescript
// Input validation schema
const MessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1).max(10000), // 10KB limit per message
  parts: z.array(z.any()).optional(), // For AI SDK v5 format
});

const ChatRequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(50), // Max 50 messages in history
  model: z.enum(['gpt-5', 'gpt-5-pro', 'gpt-4o', 'gpt-4o-mini', 'o3', 'o3-pro', 'o4-mini']).optional(),
  temperature: z.number().min(0).max(2).optional(),
  systemPrompt: z.string().max(5000).optional(), // 5KB limit for system prompt
});
```

**In POST function, after authentication check** (around line 97):
```typescript
const body = await req.json();

// ========================================
// INPUT VALIDATION (ADDED)
// ========================================
const validation = ChatRequestSchema.safeParse(body);
if (!validation.success) {
  console.warn('[API] Invalid request:', validation.error.errors);
  return new Response(
    JSON.stringify({
      error: 'Invalid request format',
      details: process.env.NODE_ENV === 'development'
        ? validation.error.errors
        : undefined
    }),
    {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

const { messages, model, temperature = 0.7, systemPrompt } = validation.data;
// ========================================
// END INPUT VALIDATION
// ========================================

// Remove the old destructuring line:
// const { messages = [], model, temperature = 0.7, systemPrompt } = body;
```

---

## Fix #5: Improve Error Messages (P2 - MEDIUM)

**File**: `app/api/chat/route.ts`

**Find error handling** (around line 86-94 and 276-323):

**Replace verbose error messages**:
```typescript
// BEFORE (LEAKS INFO):
return new Response(
  JSON.stringify({
    error: "OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment."
  }),
  { status: 503 }
);

// AFTER (SECURE):
// Log detailed error server-side
console.error("[API] OPENAI_API_KEY is not set in environment variables");

// Return generic error to client
return new Response(
  JSON.stringify({
    error: "Service temporarily unavailable",
    code: "CONFIG_ERROR"
  }),
  { status: 503, headers: { "Content-Type": "application/json" } }
);
```

**Apply to all error returns** in the catch block (around line 276-323).

---

## Fix #6: Update Environment Variables

### Development (.env.local)

**Keep these**:
```bash
# OpenAI (server-side only)
OPENAI_API_KEY=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

# Assistant
OPENAI_ASSISTANT_ID=asst_VvOHL1c4S6YapYKun4mY29fM

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://kfxetwuuzljhybfgmpuc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmeGV0d3V1emxqaHliZmdtcHVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYyOTYzMzMsImV4cCI6MjA1MTg3MjMzM30.2doKvph3M-JltbRy-RpqmglECqqivqbakwzdTloQBxg
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmeGV0d3V1emxqaHliZmdtcHVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjI5NjMzMywiZXhwIjoyMDUxODcyMzMzfQ.LX04PQaQFJ7Tz_USQcbMPiuROMEEVaDFywoOLTjE4xk

# Development: Enable auth bypass if needed
NEXT_PUBLIC_BYPASS_AUTH=true

# AOMA Configuration
NEXT_PUBLIC_AOMA_MESH_SERVER_URL=https://luminous-dedication-production.up.railway.app
```

**REMOVE these** (security risks):
```bash
# ❌ REMOVE - Exposes API key to client
# NEXT_PUBLIC_OPENAI_API_KEY=...

# ❌ REMOVE - Disables core feature
# NEXT_PUBLIC_BYPASS_AOMA=true
```

### Production (Render Dashboard)

**Set these in Render Environment Variables**:
```bash
NODE_ENV=production
OPENAI_API_KEY=<your-key-here>
OPENAI_ASSISTANT_ID=asst_VvOHL1c4S6YapYKun4mY29fM
NEXT_PUBLIC_SUPABASE_URL=https://kfxetwuuzljhybfgmpuc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-key>
NEXT_PUBLIC_AOMA_MESH_SERVER_URL=https://luminous-dedication-production.up.railway.app
```

**DO NOT SET** in production:
```bash
# These should NOT be set in production:
# NEXT_PUBLIC_BYPASS_AUTH
# NEXT_PUBLIC_BYPASS_AOMA
# NEXT_PUBLIC_OPENAI_API_KEY
```

---

## Testing Changes

### 1. Test Locally

```bash
# Start dev server
npm run dev

# In another terminal, test authentication:
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"test"}]}'

# Expected: 401 Unauthorized (no auth cookie)
```

### 2. Test with Authentication

```bash
# Open http://localhost:3000 in browser
# Log in with matt@mattcarpenter.com
# Open DevTools → Console:

fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{role: 'user', content: 'What is AOMA?'}]
  })
}).then(r => r.text()).then(console.log);

# Expected: Streaming response with AOMA context
```

### 3. Test Input Validation

```bash
# Test invalid model
fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{role: 'user', content: 'test'}],
    model: 'gpt-1000' // Invalid
  })
}).then(r => r.json()).then(console.log);

# Expected: 400 Bad Request with validation error
```

### 4. Test AOMA Integration

```bash
# Check that AOMA is NOT bypassed
# Look for "AOMA bypass: false" in server logs

# Test a knowledge question
fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{role: 'user', content: 'What is USM in Sony Music?'}]
  })
}).then(r => r.text()).then(console.log);

# Expected: Response includes AOMA context with sources
```

---

## Deployment Checklist

### Pre-Deployment:

- [ ] All code changes committed
- [ ] Tests pass locally
- [ ] Environment variables updated in Render
- [ ] .gitignore includes `.env` and `.env.local`
- [ ] Confirmed `.env.local` is NOT in git history

### Post-Deployment:

- [ ] Test authentication on production URL
- [ ] Test AOMA integration on production
- [ ] Monitor Render logs for errors
- [ ] Check OpenAI usage dashboard for anomalies
- [ ] Run Playwright tests: `npm run test:aoma`

---

## Git Workflow

```bash
# Commit changes
git add app/api/chat/route.ts
git commit -m "fix: add authentication and input validation to chat API

- Add Supabase authentication check
- Remove client-side API key exposure
- Add Zod input validation
- Disable AOMA bypass in production
- Improve error message security

Fixes: CVE-SIAM-2025-001, CVE-SIAM-2025-002, SIAM-SEC-004"

# Push to remote
git push origin fix/critical-chat-security

# Create PR
gh pr create --title "CRITICAL: Fix chat API security vulnerabilities" \
  --body "See SECURITY-FINDINGS.md for details. Fixes 3 critical issues."

# After review, merge and deploy
git checkout main
git pull
git push origin main  # Triggers Render auto-deploy
```

---

## Monitoring After Deployment

### Check Render Logs:

```bash
# Via Render CLI
render logs siam-app --tail 100

# Or use Render MCP
# In Claude Code:
# "Show me the latest Render logs for siam-app"
```

**Look for**:
- `✅ Authenticated request from user: <email>`
- `🔧 AOMA bypass: false`
- `✅ AOMA orchestration successful`
- No `401` or `403` errors for legitimate users

### Check OpenAI Dashboard:

1. Go to https://platform.openai.com/usage
2. Check for usage spikes (indicates attack or leak)
3. Verify requests match expected volume
4. Check error rates

### Check Railway AOMA Server:

```bash
curl https://luminous-dedication-production.up.railway.app/health

# Expected: High success rate (>90%)
```

---

## Rollback Plan (If Issues Arise)

### Quick Rollback:

```bash
# In Render Dashboard:
# 1. Go to "Deploys" tab
# 2. Find previous working deploy
# 3. Click "Rollback to this deploy"

# Or via CLI:
render deploys list siam-app
render deploys rollback siam-app <deploy-id>
```

### Emergency Bypass (If AOMA is broken):

```bash
# In Render environment variables, temporarily set:
NEXT_PUBLIC_BYPASS_AOMA=true

# Redeploy
# Remember to remove after fixing!
```

---

## Support & Questions

- **Security Issues**: matt@mattcarpenter.com
- **Deployment Help**: Check Render dashboard
- **AOMA Issues**: Check Railway health endpoint
- **Test Failures**: Run `npm run test:aoma:all` locally first

---

## Summary of Changes

### Files Modified:
1. `app/api/chat/route.ts` - Added auth, validation, security fixes

### Environment Variables:
- **Added**: `OPENAI_ASSISTANT_ID`
- **Removed**: `NEXT_PUBLIC_OPENAI_API_KEY`, `NEXT_PUBLIC_BYPASS_AOMA`
- **Modified**: AOMA bypass logic (production-safe)

### Dependencies Added:
- `zod` - Input validation

### Expected Impact:
- ✅ Chat API secured with authentication
- ✅ API key no longer exposed to client
- ✅ AOMA integration enabled in production
- ✅ Input validation prevents abuse
- ✅ Improved error handling

### Breaking Changes:
- **⚠️ Unauthenticated requests will be rejected** - Expected behavior
- **⚠️ Invalid input will return 400 errors** - Expected behavior

---

**Last Updated**: 2025-10-10
**Status**: Ready for deployment
**Estimated Time**: 1-2 hours (including testing)

---

**END OF QUICK FIX GUIDE**
