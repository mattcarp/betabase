# 🚀 SIAM Deployment & CI/CD Guide

## Overview

SIAM uses an automated CI/CD pipeline with GitHub Actions and Railway for seamless deployments.

## 🔄 Automated Deployment Pipeline

### Pipeline Stages

1. **Quality Check** → TypeScript, ESLint, Security audit
2. **Build & Test** → Application build verification
3. **E2E Testing** → Playwright tests on PRs
4. **Deploy to Railway** → Automatic deployment with health checks
5. **Validation** → Smoke tests and performance monitoring
6. **Rollback** → Automatic rollback on failure

### Deployment Flow

```mermaid
Push to main → GitHub Actions → Quality Checks → Build → Deploy → Validate
                                      ↓                         ↓
                                   [Failed]                  [Failed]
                                      ↓                         ↓
                                 Stop Pipeline              Rollback
```

## 🔑 GitHub Secrets Configuration

### Required Secrets

Add these in GitHub → Settings → Secrets → Actions:

| Secret Name                        | Value                        | Description                       |
| ---------------------------------- | ---------------------------- | --------------------------------- |
| `RAILWAY_TOKEN`                    | Get from Railway dashboard   | Deployment authentication         |
| `NEXT_PUBLIC_COGNITO_USER_POOL_ID` | `us-east-2_A0veaJRLo`        | AWS Cognito Pool ID               |
| `NEXT_PUBLIC_COGNITO_CLIENT_ID`    | `5c6ll37299p351to549lkg3o0d` | AWS Cognito Client                |
| `NEXT_PUBLIC_CLOUDFRONT_URL`       | Your CDN URL                 | Optional: CloudFront distribution |

### Getting Railway Token

1. Go to [Railway Dashboard](https://railway.app)
2. Account Settings → Tokens
3. Create new token with deployment permissions
4. Copy and add to GitHub secrets

## 🚂 Railway Configuration

### Environment Variables (Railway Dashboard)

```env
# Core Configuration
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

# Authentication
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-2_A0veaJRLo
NEXT_PUBLIC_COGNITO_CLIENT_ID=5c6ll37299p351to549lkg3o0d
NEXT_PUBLIC_AWS_REGION=us-east-2

# AOMA MCP Server
NEXT_PUBLIC_AOMA_ENDPOINT=https://luminous-dedication-production.up.railway.app
NEXT_PUBLIC_AOMA_MESH_SERVER_URL=https://luminous-dedication-production.up.railway.app
NEXT_PUBLIC_AOMA_MESH_RPC_URL=https://luminous-dedication-production.up.railway.app/rpc
NEXT_PUBLIC_AOMA_MESH_HEALTH_URL=https://luminous-dedication-production.up.railway.app/health

# Features
NEXT_PUBLIC_ENABLE_MCP_INTEGRATION=true
NEXT_PUBLIC_MCP_AUTO_REGISTER=true
NEXT_PUBLIC_DEBUG_MODE=false

# API Keys (keep secure!)
ELEVENLABS_API_KEY=<your-key>
```

### Custom Domain

- **Domain**: `thebetabase.com`
- **SSL**: Automatic via Railway
- **DNS**: CNAME to Railway domain

## 📋 Deployment Checklist

### Pre-deployment

- [ ] Code committed to main branch
- [ ] TypeScript passes: `npx tsc --noEmit`
- [ ] Linting passes: `npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] Tests pass locally
- [ ] Environment variables set in Railway
- [ ] GitHub secrets configured

### Post-deployment

- [ ] Health check passes
- [ ] Main page loads
- [ ] Authentication works
- [ ] AOMA integration functional
- [ ] Performance acceptable (<3s load time)

## 🛠️ Deployment Commands

### Automatic Deployment (Recommended)

```bash
# Push to main triggers auto-deploy
git add .
git commit -m "feat: your changes"
git push origin main

# Monitor deployment
node scripts/deploy-monitor.js
```

### Manual Deployment

```bash
# Deploy current branch
railway up --service siam --environment production

# Deploy specific commit
git checkout <commit-sha>
railway up --service siam --environment production
```

### Monitoring

```bash
# Real-time monitoring
node scripts/deploy-monitor.js

# Check status
railway status

# View logs
railway logs --tail 50

# Stream logs
railway logs --follow
```

## 🔍 Health Monitoring

### Endpoints

- **Health Check**: https://thebetabase.com/api/health
- **Main Site**: https://thebetabase.com

### Manual Health Check

```bash
# Check health endpoint
curl -I https://thebetabase.com/api/health

# Check response time
curl -o /dev/null -s -w "Response time: %{time_total}s\n" https://thebetabase.com

# Full diagnostic
node scripts/deploy-monitor.js
```

## 🔄 Rollback Procedures

### Option 1: GitHub Actions (Recommended)

1. Go to GitHub → Actions
2. Select "CI/CD Pipeline"
3. Click "Run workflow"
4. Choose "rollback" option

### Option 2: Manual via CLI

```bash
# Rollback to previous commit
git checkout HEAD~1
railway up --service siam --environment production
```

### Option 3: Railway Dashboard

1. Go to Railway dashboard
2. Select deployment history
3. Click on previous successful deployment
4. Select "Redeploy"

## 🚨 Troubleshooting

### Common Issues

#### Build Fails

```bash
# Check TypeScript errors
npx tsc --noEmit

# Check ESLint
npm run lint

# Check build locally
npm run build
```

#### Health Check Timeout

- Increase timeout in workflow (`.github/workflows/ci-cd.yml`)
- Check Next.js compilation time
- Verify environment variables

#### Permission Errors

```dockerfile
# In Dockerfile, ensure directories created before USER change
RUN mkdir -p .next && chown -R nextjs:nodejs .next
USER nextjs
```

### Debug Commands

```bash
# Check Railway logs
railway logs --tail 100 | grep -E "Error|Failed|Warning"

# Check deployment status
railway status

# Test locally with production build
npm run build && npm start
```

## 📊 Performance Monitoring

### Key Metrics

- **Response Time**: < 1s (optimal), < 3s (acceptable)
- **Health Check**: Must respond within 30s
- **Build Time**: < 5 minutes
- **Deploy Time**: < 10 minutes total

### Performance Check

```bash
# Basic performance test
for i in {1..10}; do
  curl -o /dev/null -s -w "%{time_total}\n" https://thebetabase.com
done | awk '{sum+=$1} END {print "Average:", sum/NR "s"}'
```

## 🎯 Best Practices

### Development Workflow

1. **Feature Branches**

   ```bash
   git checkout -b feature/your-feature
   # Make changes
   git push origin feature/your-feature
   # Create PR for review
   ```

2. **Testing Before Deploy**

   ```bash
   npm run build
   npm run dev
   # Test all critical paths
   ```

3. **Commit Messages**
   ```bash
   # Use conventional commits
   feat: Add new feature
   fix: Fix bug in component
   docs: Update documentation
   chore: Update dependencies
   ```

### Security

- Never commit secrets to code
- Use GitHub secrets for CI/CD
- Use Railway environment variables
- Rotate tokens regularly
- Monitor for exposed secrets

## 📈 CI/CD Pipeline Details

### Quality Stage

- TypeScript type checking
- ESLint code quality
- Security vulnerability scan
- Secret exposure detection

### Build Stage

- Install dependencies
- Build Next.js application
- Generate build artifacts
- Upload for deployment

### E2E Stage (PRs only)

- Playwright browser tests
- Screenshot capture
- Test report generation
- Performance metrics

### Deploy Stage (main only)

- Railway deployment
- Health check retries (15 attempts)
- Automatic rollback on failure
- Status notifications

### Validation Stage

- Smoke tests
- Performance checks
- Endpoint verification
- Deployment notifications

## 🆘 Emergency Contacts

- **Railway Support**: https://railway.app/help
- **GitHub Status**: https://githubstatus.com
- **AWS Cognito**: AWS Console → Cognito
- **Domain/DNS**: Your registrar's support

## 📝 Deployment Log Template

```markdown
## Deployment [Date]

**Commit**: abc123
**Message**: feat: Add new feature
**Deployed by**: GitHub Actions
**Status**: ✅ Success

### Changes

- Added new component
- Fixed authentication bug
- Updated dependencies

### Metrics

- Build time: 2m 30s
- Deploy time: 4m 15s
- Response time: 800ms

### Notes

- No issues encountered
- Performance improved by 20%
```

---

Last updated: August 2025
For issues, check [GitHub Issues](https://github.com/your-repo/siam/issues)
