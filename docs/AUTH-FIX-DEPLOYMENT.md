# Authentication Fix Deployment Guide

## Issue
Authentication bypass wasn't working in production because `NEXT_PUBLIC_BYPASS_AUTH` is a client-side variable and is not available in API routes.

## Fix Applied
**Commit**: b39917e3
**Version**: 0.18.3
**File**: `app/api/chat/route.ts`

Added `BYPASS_AUTH` as a server-side environment variable that API routes can access.

```typescript
const bypassAuth =
  process.env.BYPASS_AUTH === "true" ||
  process.env.NEXT_PUBLIC_BYPASS_AUTH === "true" ||
  process.env.NODE_ENV === "development";
```

## Deployment Steps

### 1. Code Changes (COMPLETED)
- [x] Updated `app/api/chat/route.ts` to check `BYPASS_AUTH`
- [x] Committed changes
- [x] Bumped version to 0.18.3
- [x] Pushed to main

### 2. Render Environment Variable (REQUIRED)
**Action Required**: Add environment variable to Render service

**Steps:**
1. Go to Render Dashboard: https://dashboard.render.com
2. Select the SIAM service (thebetabase)
3. Navigate to **Environment** tab
4. Add new environment variable:
   - **Key**: `BYPASS_AUTH`
   - **Value**: `true`
5. Click **Save Changes**
6. Render will automatically redeploy with the new variable

**Alternative (CLI)**:
```bash
# If render CLI is configured
render services env set BYPASS_AUTH=true --service-id <service-id>
```

### 3. Verification
Once deployed, test the API:

```bash
# Should return 200 with streaming response (not 401)
curl -X POST https://thebetabase.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"test"}]}'
```

Expected: Streaming response or actual response content
**NOT**: `{"error":"Authentication required"}`

## Testing Results

### Local Testing (PASSED)
```
[API] BYPASS_AUTH: true
[API] BYPASS_AUTH enabled - skipping authentication check
[API] ✅ Authentication check complete
POST /api/chat 200 in 37056ms
```

### Production Testing (PENDING)
Waiting for Render environment variable to be added.

## Notes
- This fix allows development/testing without authentication
- For production security, set `BYPASS_AUTH=false` or remove entirely
- The fallback to `NODE_ENV === "development"` ensures local dev always bypasses auth
- `NEXT_PUBLIC_BYPASS_AUTH` still works for client-side code

## Related Files
- `/Users/mcarpent/Documents/projects/siam/app/api/chat/route.ts`
- `.env.local` (local development)
- Render environment variables (production)

## Deployment Date
2025-10-29

## Status
- [x] Code fix committed and pushed
- [ ] Render environment variable added (REQUIRES MANUAL STEP)
- [ ] Production verification completed

---
**Next Action**: Add `BYPASS_AUTH=true` to Render environment variables
