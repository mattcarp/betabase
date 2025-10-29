# Fix Supabase Auth in Render Production

**Issue**: Auth is failing in production because Supabase environment variables are not set in Render.

**Error**: `AuthSessionMissingError: Auth session missing!`

---

## Quick Fix

You need to add these 3 environment variables to Render:

1. Go to: https://dashboard.render.com/web/srv-d2f8f0emcj7s73eh647g
2. Click **Environment** tab
3. Add these variables:

### Required Environment Variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://kfxetwuuzljhybfgmpuc.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmeGV0d3V1emxqaHliZmdtcHVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYyOTYzMzMsImV4cCI6MjA1MTg3MjMzM30.2doKvph3M-JltbRy-RpqmglECqqivqbakwzdTloQBxg

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmeGV0d3V1emxqaHliZmdtcHVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjI5NjMzMywiZXhwIjoyMDUxODcyMzMzfQ.LX04PQaQFJ7Tz_USQcbMPiuROMEEVaDFywoOLTjE4xk
```

4. Click **Save Changes**
5. Render will auto-redeploy (takes 2-3 minutes)

---

## What These Do:

- **NEXT_PUBLIC_SUPABASE_URL**: The Supabase project URL (public, used in browser)
- **NEXT_PUBLIC_SUPABASE_ANON_KEY**: Anonymous key for client-side auth (public)
- **SUPABASE_SERVICE_ROLE_KEY**: Service role key for server-side operations (private)

---

## After Adding:

1. Wait for Render to redeploy
2. Test login at https://thebetabase.com
3. Magic link auth should work
4. You should be able to access chat and curate

---

## Why This Happened:

These env vars were in `.env.local` (local development only) but not in Render's environment configuration. The deployment succeeded, but auth can't work without these credentials.

---

**Status**: Waiting for env vars to be added to Render
**ETA**: 5 minutes (3 min to add vars + 2 min redeploy)
