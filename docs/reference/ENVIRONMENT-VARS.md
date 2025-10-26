# Environment Variables

Complete environment variable reference for SIAM.

## Production Variables (Render)

Set in Render dashboard:

```bash
NODE_ENV=production
NEXT_PUBLIC_DEBUG_MODE=false
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-2_A0veaJRLo
NEXT_PUBLIC_COGNITO_CLIENT_ID=5c6ll37299p351to549lkg3o0d
NEXT_PUBLIC_SUPABASE_URL=<supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
ELEVENLABS_API_KEY=<elevenlabs-key>
RENDER_API_KEY=<render-api-key>
```

## Development Variables (.env.local)

```bash
NEXT_PUBLIC_BYPASS_AUTH=true
NEXT_PUBLIC_SUPABASE_URL=<supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

## Variable Prefixes

- `NEXT_PUBLIC_*` - Exposed to browser (client-side)
- Others - Server-side only

---

_For quick reference, see [QUICK-START.md](../QUICK-START.md)_
