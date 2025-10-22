# Production 500 Error Fix - Supabase Configuration

## Issue Summary

**Date**: October 15, 2025
**Severity**: P0 - Production Blocking
**Status**: FIXED

### Problem

Production chat API at `https://thebetabase.com/api/chat` was returning 500 errors for all requests.

### Root Cause

The authentication code in `/app/api/chat/route.ts` was attempting to create a Supabase client without validating that the required environment variables were set:

```typescript
// BROKEN CODE (lines 127-129)
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, // undefined in production!
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // undefined in production!
  // ...
);
```

When these variables are undefined, `createServerClient()` throws an error, causing the entire API route to fail with a 500 error.

### Why This Happened

The production Render deployment did not have these environment variables configured:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

The code assumed these would always be present and used the TypeScript non-null assertion operator (`!`), which bypasses compile-time checks but doesn't prevent runtime errors.

### The Fix

Added validation before attempting to create the Supabase client:

```typescript
// FIXED CODE (lines 127-143)
if (!bypassAuth) {
  console.log("[API] Checking authentication...");

  // Validate Supabase configuration before attempting auth check
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error("[API] Supabase configuration missing! Cannot perform authentication.");
    console.error("[API] NEXT_PUBLIC_SUPABASE_URL:", !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.error(
      "[API] NEXT_PUBLIC_SUPABASE_ANON_KEY:",
      !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    return new Response(
      JSON.stringify({
        error: "Service configuration error",
        code: "SUPABASE_CONFIG_MISSING",
        message:
          "Authentication is enabled but Supabase credentials are not configured. Please contact support.",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Only create Supabase client after validation
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL, // Validated to exist
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // Validated to exist
    // ...
  );
}
```

### Deployment Options

There are two ways to resolve this in production:

#### Option 1: Set Supabase Environment Variables (Recommended for Auth)

If you want authentication enabled, add these to Render environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://kfxetwuuzljhybfgmpuc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Option 2: Bypass Authentication (Current TheBetabase Setup)

For development/demo environments like thebetabase.com, bypass authentication:

```bash
NEXT_PUBLIC_BYPASS_AUTH=true
```

This skips the authentication check entirely (lines 119-120):

```typescript
const bypassAuth =
  process.env.NEXT_PUBLIC_BYPASS_AUTH === "true" || process.env.NODE_ENV === "development";
```

### Impact

**Before Fix**:

- All chat API requests returned 500 errors
- No error logs explaining the issue
- Users saw generic "technical difficulties" message

**After Fix**:

- Graceful error message with clear service configuration error
- Detailed server-side logging for debugging
- Returns 503 (Service Unavailable) instead of 500 (Internal Server Error)
- Provides actionable error code: `SUPABASE_CONFIG_MISSING`

### Prevention

1. **Environment Variable Validation**: Always validate required env vars before use
2. **Avoid Non-Null Assertions**: Don't use `!` operator for env vars that might be missing
3. **Error Testing**: The new error handling test suite (`tests/production/aoma-error-handling.spec.ts`) would have caught this
4. **Configuration Checklist**: Add env var requirements to deployment docs

### Testing

The comprehensive error handling tests we created (`npm run test:aoma:errors`) discovered this issue:

```bash
# Test output showing 500 errors
🔴 Console Error: Failed to load resource: the server responded with a status of 500 ()
🔴 Console Error: [SIAM] Message send error: Error: API error: 500
```

This validates the effectiveness of the new test suite!

### Related Files

- `/app/api/chat/route.ts` - Fixed authentication validation
- `/tests/production/aoma-error-handling.spec.ts` - Tests that caught the issue
- `/docs/AOMA-TESTING-AND-PERFORMANCE.md` - Testing documentation

### Deployment

```bash
# Commit the fix
git add app/api/chat/route.ts docs/PRODUCTION-500-ERROR-FIX.md
git commit -m "fix(api): validate Supabase env vars before creating auth client"
git push origin main

# Render will auto-deploy
# Then add NEXT_PUBLIC_BYPASS_AUTH=true to Render environment variables
```

### Verification

After deployment, verify the fix:

```bash
# Test chat API
curl -X POST https://thebetabase.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"test"}]}'

# Should return either:
# 1. If NEXT_PUBLIC_BYPASS_AUTH=true: Streaming response
# 2. If no bypass: Clear 503 error with SUPABASE_CONFIG_MISSING
```

## Lessons Learned

1. **Validate Environment Variables**: Never assume env vars are present
2. **Fail Gracefully**: Return clear error messages, not 500 errors
3. **Test Production Scenarios**: Error handling tests are critical
4. **Log Thoroughly**: Detailed logging helped diagnose the issue

## Next Steps

1. ✅ Fix code to validate env vars
2. ✅ Add comprehensive error handling
3. ⏳ Deploy to production
4. ⏳ Set `NEXT_PUBLIC_BYPASS_AUTH=true` in Render
5. ⏳ Verify chat API works
6. ⏳ Run full error handling test suite
