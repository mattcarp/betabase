# SIAM Production Deployment Documentation

**Last Updated**: August 20, 2025  
**Status**: ✅ FULLY OPERATIONAL

## Production Domains

Both domains are live and accessible:

- **Primary**: https://iamsiam.ai
- **Secondary**: https://thebetabase.com

## Infrastructure Overview

### Hosting Platform

- **Provider**: Render.com
- **Service Type**: Next.js Web Service
- **Region**: US East (Ohio)
- **IP Address**: 216.24.57.1

### DNS Configuration

Both domains point to Render's IP address:

```
iamsiam.ai       → 216.24.57.1 (Render)
thebetabase.com  → 216.24.57.1 (Render)
```

### CDN & Security

- **CDN**: Cloudflare
- **SSL**: Automatic SSL certificates via Render
- **Headers**: CORS enabled for API access

## Deployment Status

### Current State (August 20, 2025)

✅ **Both domains are fully operational**

- No authentication blockers for public access
- Magic Link authentication system is active
- AOMA MCP connection is established
- All core features are functional

### Key Features

1. **Authentication**: Magic Link email system
   - Supported emails: \*@sonymusic.com, specific whitelisted addresses
   - No password required
2. **API Integrations**:
   - AOMA MCP Server: Connected via Railway deployment
   - OpenAI API: Active for chat functionality
   - Cognito: Configured for user management

3. **Environment**:
   - Production build with optimizations
   - Next.js 15.4.6
   - React 19.1.1

## Environment Variables (Render)

Required environment variables in Render dashboard:

```env
NODE_ENV=production
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-2_A0veaJRLo
NEXT_PUBLIC_COGNITO_CLIENT_ID=5c6ll37299p351to549lkg3o0d
NEXT_PUBLIC_AOMA_MESH_SERVER_URL=https://luminous-dedication-production.up.railway.app
OPENAI_API_KEY=[secret]
OPENAI_ASSISTANT_ID=asst_VvOHL1c4S6YapYKun4mY29fM
```

## Deployment Process

### Automatic Deployment

Render automatically deploys from the `main` branch on push:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

### Manual Deployment

Via Render Dashboard:

1. Navigate to the SIAM service
2. Click "Manual Deploy"
3. Select branch and commit
4. Deploy

## Monitoring & Health Checks

### Health Endpoint

- URL: `/api/health`
- Expected Response: 200 OK with JSON status

### Performance Metrics

- Average response time: ~2-3s
- AOMA query time: 10-15s (optimized with caching)
- Uptime: 99.9%

## Troubleshooting

### Common Issues

1. **WebSocket Errors in Console**
   - **Cause**: Development hot-reload attempting to connect
   - **Impact**: None - production functionality unaffected
   - **Fix**: Normal behavior, can be ignored

2. **AOMA Connection Issues**
   - **Check**: Railway deployment status
   - **Endpoint**: https://luminous-dedication-production.up.railway.app/rpc
   - **Test**: `curl -X POST [endpoint]/rpc -d '{"method":"tools/list"}'`

3. **Authentication Not Working**
   - **Check**: Email is in whitelist
   - **Check**: Mailgun/SendGrid API keys are configured
   - **Test**: Check Render logs for email sending errors

## Access URLs

### Production Sites

- https://iamsiam.ai - Primary domain
- https://thebetabase.com - Secondary domain

### Admin/Monitoring

- Render Dashboard: https://dashboard.render.com
- Railway Dashboard: https://railway.app (for AOMA MCP)
- Cloudflare Dashboard: https://dash.cloudflare.com

## Recent Updates

### August 20, 2025

- ✅ Verified both domains are accessible
- ✅ Confirmed no authentication blockers
- ✅ Tested magic link authentication system
- ✅ Validated AOMA connection status
- ✅ Documented current deployment configuration

### August 19, 2025

- Implemented AOMA query optimizations
- Added caching layer for faster responses
- Reduced timeout from 45s to 25s
- Changed default strategy to "rapid"

## Contact & Support

For deployment issues:

- Check Render service logs
- Monitor Railway AOMA MCP status
- Review Cloudflare analytics for traffic issues

---

_This document should be updated whenever deployment configuration changes._
