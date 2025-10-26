# CI/CD Pipeline

Automated continuous integration and deployment pipeline for SIAM.

## Pipeline Overview

**Automated workflows:**
1. Pre-commit hooks (local)
2. Pre-push hooks (local)
3. PR checks (GitHub Actions)
4. Merge to main → Auto-deploy (GitHub Actions + Render)
5. Post-deployment verification (GitHub Actions)
6. Health monitoring (automated)

## Pre-Commit Hooks

**Runs on**: Every `git commit`

**What runs**:
1. ESLint on staged `.js`, `.jsx`, `.ts`, `.tsx` files
2. Prettier on all staged files
3. MAC Design System compliance check

**Configuration**: `.husky/pre-commit`

**Bypass** (not recommended):
```bash
git commit --no-verify -m "emergency fix"
```

See [CODE-QUALITY.md](../development/CODE-QUALITY.md) for details.

## Pre-Push Hooks

**Runs on**: Every `git push`

**Phase 1: Code Quality** (~30 seconds)
- Merge conflict detection
- Prettier formatting validation
- ESLint linting

**Phase 2: Tests** (depends on branch)
- Feature branches: Smoke tests (~2 minutes)
- Main/develop: Critical tests (~5 minutes)

**Configuration**: `.husky/pre-push`

**Bypass** (not recommended):
```bash
git push --no-verify
```

## GitHub Actions Workflows

### PR Merge Deploy Workflow

**File**: `.github/workflows/pr-merge-deploy.yml`

**Triggers on**:
- Pull request merged to `main`

**Steps**:
1. Detect PR merge event
2. Trigger Render deployment (via deploy hook or auto-deploy)
3. Wait for deployment to complete
4. Run health checks
5. Verify build timestamp
6. Check for console errors
7. Post status comment on PR
8. Create issue if deployment fails
9. Clean up merged branch (if `claude/*`)

**Example PR comment**:
```markdown
## Deployment Status: ✅ Success

- Health: Healthy
- Build timestamp: 2025-10-26T12:34:56Z
- Console errors: None
- Deployment URL: https://thebetabase.com

Tests passed:
- Health endpoint responding
- Build timestamp current
- No console errors detected
```

### Full CI/CD Workflow

**File**: `.github/workflows/ci-cd.yml`

**Triggers on**:
- Push to any branch
- Pull request opened/updated

**Jobs**:

**1. Lint & Type Check**
```yaml
- Install dependencies
- Run ESLint
- Run Prettier check
- Run TypeScript type check
- Report errors as annotations
```

**2. Test**
```yaml
- Install dependencies
- Install Playwright browsers
- Run unit tests
- Run E2E tests (smoke suite)
- Upload test results
- Upload Playwright report on failure
```

**3. Build**
```yaml
- Install dependencies
- Generate build info
- Run Next.js build
- Check for build errors
- Report bundle size
```

**4. Deploy (main branch only)**
```yaml
- Trigger Render deployment
- Wait for deployment
- Run health checks
- Verify production
```

## Render Auto-Deploy

**Configuration**: `render.yaml`

**Auto-deploy settings**:
```yaml
services:
  - type: web
    name: siam-app
    env: node
    plan: starter
    branch: main          # Auto-deploy from this branch
    buildCommand: npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
    autoDeploy: true      # Enable auto-deploy
```

**How it works**:
1. GitHub webhook notifies Render of push to `main`
2. Render clones repository
3. Runs `buildCommand`
4. Starts service with `startCommand`
5. Health checks verify deployment
6. Traffic switches to new deployment

## Deployment Hooks

### Render Deploy Hook

**Optional but recommended for faster deployments**

**Setup**:
1. Get deploy hook URL from Render dashboard
2. Add as GitHub repository variable:
   ```bash
   gh variable set RENDER_DEPLOY_HOOK_URL --body "https://api.render.com/deploy/srv-xxxxx?key=xxxxx"
   ```
3. GitHub Actions will use it automatically

**Benefits**:
- Faster deployment trigger
- More reliable than push-based auto-deploy
- Can manually trigger from GitHub Actions

## Automated Testing in CI

### Test Suites

**Smoke Tests** (runs on all PRs):
```yaml
- Authentication flow
- Basic navigation
- Critical user paths
- API health checks
```

**Full E2E Tests** (runs on main):
```yaml
- AOMA chat validation
- Visual regression tests
- File upload/delete
- Complete user journeys
```

**Production Tests** (runs post-deploy):
```yaml
- Production health checks
- Mailinator magic link flow
- Console error detection
- Build timestamp verification
```

### Test Configuration

**Playwright config for CI**:
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: process.env.CI ? 2 : 0,  // Retry flaky tests in CI
  workers: process.env.CI ? 1 : undefined,  // Run serially in CI
  reporter: process.env.CI ? 'github' : 'html',  // GitHub annotations in CI
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',  // Capture trace on failure
    screenshot: 'only-on-failure',  // Screenshot on failure
  },
});
```

## Environment Variables in CI

### GitHub Secrets

**Required secrets**:
- `RENDER_API_KEY` - For Render MCP operations
- `RENDER_SERVICE_ID` - SIAM service ID
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

**Optional secrets**:
- `RENDER_DEPLOY_HOOK_URL` - Deploy hook for faster deployments
- `SLACK_WEBHOOK_URL` - Slack notifications

### GitHub Variables

**Configuration variables**:
- `PRODUCTION_URL` - Production URL (https://thebetabase.com)
- `STAGING_URL` - Staging URL (if applicable)

## Branch Protection Rules

**Main branch protections**:
- Require pull request before merging
- Require status checks to pass:
  - Lint & Type Check
  - Tests
  - Build
- Require branches to be up to date
- Do not allow force pushes
- Do not allow deletions

**Feature branch cleanup**:
- `claude/*` branches auto-deleted after PR merge
- Stale branches deleted after 90 days

## Monitoring CI/CD

### GitHub Actions

```bash
# Watch current run
gh run watch

# List recent runs
gh run list --limit 10

# View run details
gh run view <run-id>

# View job logs
gh run view <run-id> --job=<job-id>

# Re-run failed jobs
gh run rerun <run-id> --failed
```

### Render Deployment

```bash
# List deployments
render deploys list siam-app

# Check deployment status
render deploys get <deploy-id>

# View deployment logs
render logs siam-app --type build --tail 100
```

## Failure Handling

### Build Failures

**Automatic actions**:
1. GitHub Actions annotations on code
2. Comment on PR with error details
3. Prevent merge until fixed
4. Notify PR author

**Manual resolution**:
1. Check GitHub Actions logs
2. Fix errors locally
3. Push fix to branch
4. CI re-runs automatically

### Deployment Failures

**Automatic actions**:
1. Render keeps previous version running
2. GitHub Actions detects failure
3. Issue created and assigned to PR author
4. PR comment updated with failure status

**Manual resolution**:
1. Check Render logs: `render logs siam-app --type build`
2. Check deployment status: `render deploys list siam-app`
3. Fix issue and push to main
4. Or rollback: Redeploy previous version in Render dashboard

### Test Failures

**Automatic actions**:
1. Test results uploaded to GitHub
2. Playwright report generated (if E2E failed)
3. PR blocked from merging
4. Annotations on failing test files

**Manual resolution**:
1. Review test failure logs
2. Download Playwright report artifacts
3. Fix failing tests
4. Push fix to trigger re-run

## Performance Optimization

### Caching

**npm dependencies**:
```yaml
- uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

**Playwright browsers**:
```yaml
- uses: actions/cache@v3
  with:
    path: ~/.cache/ms-playwright
    key: ${{ runner.os }}-playwright-${{ hashFiles('**/package-lock.json') }}
```

### Parallel Jobs

```yaml
jobs:
  lint:
    # Runs in parallel with test and build
  test:
    # Runs in parallel with lint and build
  build:
    # Runs in parallel with lint and test
  deploy:
    needs: [lint, test, build]  # Waits for all to complete
```

## CI/CD Best Practices

1. **Keep builds fast** - Optimize dependencies and caching
2. **Test in parallel** - Run independent tests concurrently
3. **Fail fast** - Stop on first critical error
4. **Clear error messages** - Use GitHub annotations
5. **Monitor CI health** - Track build times and success rates
6. **Version everything** - Lock dependency versions
7. **Automate repetitive tasks** - Don't rely on manual steps

## Workflow Files Reference

```
.github/workflows/
├── pr-merge-deploy.yml    # Auto-deploy on PR merge
├── ci-cd.yml             # Full CI/CD pipeline
└── stale-branches.yml    # Branch cleanup (optional)

.husky/
├── pre-commit            # Local pre-commit checks
└── pre-push              # Local pre-push checks

render.yaml               # Render service configuration
```

## Reference

- **Deployment Guide**: See [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) for manual deployment
- **Monitoring**: See [MONITORING.md](MONITORING.md) for health checks and logs
- **Testing**: See [TESTING-STRATEGY.md](../development/TESTING-STRATEGY.md) for test details

---

*For quick reference, see [QUICK-START.md](../QUICK-START.md)*
