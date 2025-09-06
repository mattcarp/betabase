# RAILWAY TO RENDER MIGRATION - SEPTEMBER 2024

## Executive Summary

On September 4, 2024, the SIAM project was fully migrated from Railway.com to Render.com. This document serves as a permanent record of this migration for future reference.

## Migration Rationale

- Consolidation of deployment infrastructure
- Single deployment platform for all services
- Simplified CI/CD pipeline
- Better integration with existing Render MCP tools

## What Was Removed

### Files Deleted (27 total):
```
check-railway.sh
fix-railway-deploy.sh
RAILWAY-DEPLOYMENT-SOLUTION.md
set-railway-dev-mode.sh
railway.toml.bak
test-railway-deployment.sh
complete-railway-fix.sh
cleanup-vite-railway.sh
.railway-cache-bust
next.config.railway.js
.env.railway
trigger-railway.sh
force-railway-deploy.sh
.railway-cache-bust-v2
check-railway-status.sh
railway.json
railway-deployment-monitor.log
manual-railway-deploy.sh
deploy-railway.sh
fix-railway-env.sh
.railwayignore
RAILWAY_ENV_VARS.txt
railway-env-template.txt
setup-railway-domains.sh
set-railway-env.sh
monitor-railway.sh
RAILWAY_DEV_MODE_VARS.txt
```

### Directory Removed:
- `.railway/` - Complete Railway configuration directory

### Code Changes:
- `src/services/aomaContentAggregator.ts` - Updated URLs to Render
- `src/services/aomaConversationIntegration.ts` - Updated URLs to Render
- `src/services/aomaOrchestrator.ts` - Updated deployment URLs
- `src/services/aomaParallelRouter.ts` - Removed Railway provider logic
- `playwright.config.ts` - Updated baseURL to siam.onrender.com

## New Render Configuration

### Production URLs:
- Main Application: `https://siam.onrender.com`
- AOMA MCP Service: `https://aoma-mesh-mcp.onrender.com`
- Health Check: `https://siam.onrender.com/api/health`

### Deployment Configuration:
- **Service Type**: Web Service
- **Runtime**: Docker
- **Plan**: Starter (upgradeable to Standard)
- **Region**: Oregon (US West)
- **Auto-Deploy**: Enabled on main branch

### New Helper Scripts:

#### `check-render-status.sh`
Quick health check for Render deployment status.

#### `run-render-tests.sh`
Orchestrates Playwright test execution against Render deployment:
- Smoke tests
- Auth tests
- Visual tests
- Full test suite

#### `playwright.config.render.ts`
Dedicated Playwright configuration for Render production testing with:
- Multiple browser support (Chrome, Firefox, Safari)
- Mobile viewport testing
- Proper retry logic
- Video/screenshot capture on failure

## Testing Infrastructure

### Playwright Test Orchestration:
```bash
# Local development
npm run test:local

# Render production
npm run test:render
./run-render-tests.sh

# Specific test suites
./run-render-tests.sh smoke
./run-render-tests.sh auth
./run-render-tests.sh visual
```

### Test Configuration Files:
- `playwright.config.ts` - Default (Render production)
- `playwright.config.render.ts` - Explicit Render config
- `playwright.config.local.ts` - Local development

## Environment Variables

All environment variables are now managed through Render Dashboard:

### Required Variables:
```
NODE_ENV=production
PORT=10000
HOSTNAME=0.0.0.0
NEXT_TELEMETRY_DISABLED=1

# Cognito
NEXT_PUBLIC_COGNITO_USER_POOL_ID=<value>
NEXT_PUBLIC_COGNITO_CLIENT_ID=<value>
NEXT_PUBLIC_COGNITO_REGION=us-east-2

# API Keys
OPENAI_API_KEY=<value>
ANTHROPIC_API_KEY=<value>
PERPLEXITY_API_KEY=<value>

# AOMA Mesh
NEXT_PUBLIC_AOMA_MESH_SERVER_URL=https://aoma-mesh-mcp.onrender.com
NEXT_PUBLIC_AOMA_MESH_RPC_URL=https://aoma-mesh-mcp.onrender.com/rpc
NEXT_PUBLIC_AOMA_MESH_HEALTH_URL=https://aoma-mesh-mcp.onrender.com/health
```

## Deployment Process

### Automatic Deployment:
```bash
git add -A
git commit -m "Your changes"
git push origin main
# Render auto-deploys on push to main
```

### Manual Deployment:
1. Log into Render Dashboard
2. Navigate to siam-app service
3. Click "Manual Deploy" → "Deploy latest commit"

### Monitoring:
```bash
# Check status
./check-render-status.sh

# View logs (via Render Dashboard)
https://dashboard.render.com

# Run health check
curl https://siam.onrender.com/api/health
```

## Rollback Instructions

If issues arise with Render deployment:

1. **Via Render Dashboard**:
   - Navigate to siam-app service
   - Go to "Events" tab
   - Find previous successful deploy
   - Click "Rollback to this deploy"

2. **Via Git**:
   ```bash
   git revert HEAD
   git push origin main
   # Render will auto-deploy the reverted commit
   ```

## Post-Migration Checklist

- [x] All Railway files removed
- [x] Source code updated with Render URLs
- [x] Playwright tests configured for Render
- [x] Helper scripts created
- [x] Documentation updated
- [x] CLAUDE.md updated
- [x] render.yaml verified
- [ ] Team notified of migration
- [ ] Old Railway account can be closed

## Support and Troubleshooting

### Common Issues:

1. **Cold starts on Render free tier**:
   - First request may take 30-60 seconds
   - Consider upgrading to paid plan for always-on service

2. **Environment variables not loading**:
   - Verify in Render Dashboard
   - Restart service after adding new variables

3. **Build failures**:
   - Check Dockerfile configuration
   - Verify Node.js version compatibility
   - Review Render build logs

### Contact:
- Render Support: https://render.com/support
- Render Status: https://status.render.com
- Documentation: https://render.com/docs

---

*Migration completed by: Matt Carpenter*
*Date: September 4, 2024*
*Verified working: All Playwright tests passing against Render deployment*
