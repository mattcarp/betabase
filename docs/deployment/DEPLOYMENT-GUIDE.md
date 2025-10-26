# Deployment Guide

Complete deployment guide for SIAM including automated workflows, monitoring, and production verification.

## Deployment Platform

**IMPORTANT**: SIAM uses **Render.com EXCLUSIVELY** for all deployments.

- **Main app (SIAM)**: Deployed to Render.com
- **AOMA MCP Server**: Deployed to Railway.com (separate service)
- **Railway purged**: All Railway references for main app removed September 2024

**Production URL**: https://thebetabase.com

## Quick Deploy

### Automated Deployment (Recommended)

```bash
./scripts/deploy-with-monitoring.sh  # Full deployment with monitoring
```

This handles EVERYTHING:

- Git branch management (merges to main)
- Version bumping (triggers Render deploy)
- Render MCP monitoring
- GitHub Actions tracking
- Health checks and verification
- Console error detection
- Full logging and error recovery

### Alternative Deploy Methods

```bash
./scripts/deploy.sh                      # Basic deployment
python3 ./scripts/monitor-deployment.py  # Monitor existing deployment
```

## Automated PR Merge → Production Pipeline

**FULLY AUTOMATED**: When you merge a PR to `main`, production deployment happens automatically!

### How It Works

1. **Merge PR to main** - GitHub detects the merge event
2. **GitHub Actions runs** - `.github/workflows/pr-merge-deploy.yml` triggers
3. **Render deploys** - Auto-deploy from main branch (configured in `render.yaml`)
4. **Health monitoring** - Automated health checks verify deployment
5. **PR comment** - Status posted back to the merged PR
6. **Branch cleanup** - `claude/*` branches auto-deleted after merge

### What Gets Monitored

- Health endpoint (`/api/health`)
- Main page load
- Build timestamp verification
- Stable response checks (3 consecutive healthy checks)
- Console error detection

### Workflow Files

- `.github/workflows/pr-merge-deploy.yml` - PR merge detection & deployment
- `.github/workflows/ci-cd.yml` - Full CI/CD pipeline with tests
- `render.yaml` - Render service configuration with auto-deploy

## Manual Deployment

### Step 1: Pre-Deployment Checks

```bash
# Run quality checks
npm run pre-pr-check

# Run critical tests
npm run test:aoma
npm run test:visual
npx playwright test tests/e2e/smoke/smoke.spec.ts

# Type check
npm run type-check

# Build check
npm run build
```

### Step 2: Version Bump

**CRITICAL**: Always bump version before pushing to main - triggers Render deployment!

```bash
# Bump patch version (0.13.5 -> 0.13.6)
npm version patch

# Bump minor version (0.13.6 -> 0.14.0)
npm version minor

# Bump major version (0.14.0 -> 1.0.0)
npm version major
```

### Step 3: Push to Main

```bash
# Using git acm alias
git acm "deploy: your deployment message"

# Push to trigger deployment
git push origin main
```

### Step 4: Monitor Deployment

```bash
# Watch GitHub Actions
gh run watch

# Check Render logs (via MCP or CLI)
render logs siam-app --tail 50

# Check production health
curl https://thebetabase.com/api/health
```

## Deployment Verification

### Health Check Endpoint

```bash
# Check health endpoint
curl https://thebetabase.com/api/health

# Expected response
{
  "status": "healthy",
  "timestamp": "2025-10-26T12:00:00Z",
  "version": "0.13.6"
}
```

### Build Timestamp Verification

```bash
# Check build timestamp on production
curl https://thebetabase.com/api/health | jq '.timestamp'

# Should be recent (within last few minutes of deployment)
```

### Console Error Check

```bash
# Use Playwright to check for console errors
node check-site-console.js

# Or use Playwright MCP
playwright_navigate url="https://thebetabase.com"
playwright_console_logs type="error"
```

## Production Testing

**MANDATORY**: No deployment is complete without full production testing.

### Run Production Tests

```bash
# Full production E2E tests
PLAYWRIGHT_BASE_URL=https://thebetabase.com npx playwright test

# With Mailinator magic link
NEXT_PUBLIC_BYPASS_AUTH=false PLAYWRIGHT_BASE_URL=https://thebetabase.com npx playwright test

# Critical user flow
PLAYWRIGHT_BASE_URL=https://thebetabase.com npx playwright test tests/e2e/critical-user-flow.spec.ts
```

### Production Test Checklist

- [ ] Health endpoint responds
- [ ] Main page loads without errors
- [ ] Authentication flow works (Mailinator magic link)
- [ ] AOMA chat responds correctly
- [ ] File upload/delete works
- [ ] No console errors
- [ ] Build timestamp is current
- [ ] All API endpoints respond

## Render Configuration

### Environment Variables

Must be set in Render dashboard:

```bash
NODE_ENV=production
NEXT_PUBLIC_DEBUG_MODE=false
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-2_A0veaJRLo
NEXT_PUBLIC_COGNITO_CLIENT_ID=5c6ll37299p351to549lkg3o0d
NEXT_PUBLIC_SUPABASE_URL=<supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
ELEVENLABS_API_KEY=<elevenlabs-key>
```

### Render Deploy Hook (Optional)

For faster manual deployments:

1. Get Render Deploy Hook URL:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Select service (siam-app)
   - Go to Settings → Deploy Hook
   - Copy the deploy hook URL

2. Add to GitHub as repository variable:

   ```bash
   gh variable set RENDER_DEPLOY_HOOK_URL --body "https://api.render.com/deploy/srv-xxxxx?key=xxxxx"
   ```

3. Workflow will automatically use it if present

## Monitoring Deployment

### Using Render MCP

```bash
# In Claude Code, use natural language:
"Check deployment status for siam-app"
"Show recent logs for SIAM service"
"Why isn't thebetabase.com responding?"
"List my Render services"
```

### Using Render CLI

```bash
# Install Render CLI
brew install render

# Login
render login

# List services
render services list

# View logs
render logs siam-app --tail 50

# View deployments
render deploys list siam-app
```

### Using GitHub CLI

```bash
# Watch current run
gh run watch

# List recent runs
gh run list

# View specific run
gh run view <run-id>

# View workflow logs
gh run view <run-id> --log
```

## Rollback Procedure

### Quick Rollback via Render Dashboard

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select siam-app service
3. Go to "Deploys" tab
4. Find last known good deployment
5. Click "Redeploy"

### Rollback via Git

```bash
# Find last good commit
git log --oneline

# Revert to specific commit
git revert <bad-commit-hash>

# Push to trigger new deployment
git push origin main
```

## Common Deployment Issues

### Build Failures

**Check build logs:**

```bash
render logs siam-app --type build --tail 100
```

**Common causes:**

- TypeScript errors (run `npm run type-check` locally)
- Missing dependencies (check package.json)
- Environment variables not set
- Build script failures

### Health Check Timeouts

**Issue**: Render health check timing out

**Solution:**

1. Check health endpoint locally: `curl http://localhost:3000/api/health`
2. Verify Next.js dev mode compilation time
3. Increase health check timeout in Render dashboard settings

### Permission Errors (EACCES)

**Issue**: `Error: EACCES: permission denied, mkdir '/app/.next'`

**Solution**: In Dockerfile, create directories BEFORE switching to nextjs user:

```dockerfile
RUN mkdir -p .next && chown -R nextjs:nodejs .next
RUN touch next-env.d.ts && chown nextjs:nodejs next-env.d.ts
USER nextjs  # Switch user AFTER creating directories
```

### Build Timestamp Not Updating

**Issue**: Build time shows old timestamp

**Solution:**

1. Verify `scripts/generate-build-info.js` runs in Dockerfile
2. Check `.env.production.local` for NEXT_PUBLIC_BUILD_TIME
3. Ensure script runs BEFORE build, not at import time

## Deployment Best Practices

1. **Always bump version** before pushing to main
2. **Run tests locally** before deploying
3. **Monitor deployment** until health checks pass
4. **Verify production** with E2E tests
5. **Check console errors** on production site
6. **Keep deploy notes** for significant changes
7. **Use feature flags** for risky deployments
8. **Rollback quickly** if issues detected

## Reference

- **Monitoring**: See [MONITORING.md](MONITORING.md) for health checks and metrics
- **CI/CD Pipeline**: See [CI-CD-PIPELINE.md](CI-CD-PIPELINE.md) for automation details
- **Production Testing**: See `docs/PRODUCTION_TESTING.md` for comprehensive testing guide

---

_For quick reference, see [QUICK-START.md](../QUICK-START.md)_
