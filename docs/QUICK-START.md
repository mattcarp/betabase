# SIAM Quick Start Guide

**Get productive in 5 minutes.** Essential commands and workflows for SIAM development.

## Prerequisites

```bash
# Required
Node.js 18+, npm or pnpm
Git configured with user.name and user.email

# Optional but recommended
gh CLI (GitHub), render CLI (deployments)
```

## Initial Setup

```bash
# 1. Clone and install
git clone <repo-url>
cd siam
npm install

# 2. Environment setup
cp .env.local.example .env.local
# Edit .env.local with your credentials

# 3. Start development server
npx kill-port 3000  # Always kill port 3000 first
npm run dev         # Runs on http://localhost:3000
```

## Daily Development Workflow

### 1. Before You Start Coding

```bash
# Pull latest changes
git pull origin main

# Check current status
git status

# Kill port 3000 and start dev server
npx kill-port 3000 && npm run dev
```

### 2. While Coding

```bash
# Test auth bypass (for development)
NEXT_PUBLIC_BYPASS_AUTH=true npm run dev

# Check for errors
npm run lint:quick          # Quick lint check
npm run type-check          # TypeScript errors
```

### 3. Before Committing

```bash
# MANDATORY quality checks (auto-run via hooks, but good to check)
npm run pre-pr-check        # Runs prettier, lint, conflict detection

# Fix formatting if needed
npm run format              # Auto-fix all formatting
npm run lint:fix           # Auto-fix lint issues
```

### 4. Commit & Push

```bash
# Use git acm alias (add all + commit with message)
git acm "feat: add new feature"

# Bump version before push to main (triggers deployment)
npm version patch           # 0.13.5 -> 0.13.6

# Push to remote
git push origin <branch-name>
```

## Essential Testing Commands

```bash
# P0 Critical Tests (MUST PASS before PR)
npm run test:aoma                    # AOMA anti-hallucination tests
npm run test:visual                  # Visual regression (MAC + dark theme)
npm run test:e2e                     # E2E smoke tests

# Specific test suites
npx playwright test tests/curate-tab-test.spec.ts  # File upload/delete
npx playwright test tests/e2e/smoke/smoke.spec.ts  # Critical paths

# With auth bypass for local testing
NEXT_PUBLIC_BYPASS_AUTH=true npx playwright test <test-file>
```

## Deployment Workflow

```bash
# Full deployment with monitoring
./scripts/deploy-with-monitoring.sh

# Or manual deployment
git push origin main        # Auto-deploys to Render

# Monitor deployment
render logs <service-name> --tail 50
gh run watch               # Watch GitHub Actions
```

## Common Issues - Quick Fixes

### Permission Errors (EACCES)

```bash
# Usually Docker permissions - check Dockerfile
# Make sure directories created BEFORE USER nextjs
```

### Merge Conflicts in package-lock.json

```bash
./scripts/fix-package-lock-conflict.sh  # Auto-resolves
```

### Port 3000 Already in Use

```bash
npx kill-port 3000
npm run dev
```

### TypeScript Errors

```bash
# Check errors in YOUR changed files only
git diff --name-only main...HEAD | xargs npm run type-check
```

### Console Errors in Browser

```bash
# Test with Playwright
node check-site-console.js

# Or manually
playwright_navigate url="http://localhost:3000"
playwright_console_logs type="error"
```

## Key File Locations

```bash
# Main app
src/app/                    # Next.js App Router
src/components/             # React components
src/services/               # Business logic

# Configuration
.env.local                  # Local environment variables
next.config.js              # Next.js configuration
playwright.config.ts        # Playwright test config

# Documentation
CLAUDE.md                   # AI assistant quick reference
docs/INDEX.md              # Full documentation index
docs/development/           # Development guides
docs/deployment/            # Deployment guides
```

## YOLO Mode (Skip Approval Prompts)

```bash
./scripts/yolo-mode.sh on   # Enable YOLO mode
./scripts/yolo-mode.sh off  # Disable YOLO mode
./scripts/yolo-mode.sh      # Check status
```

## Critical Reminders

- Always kill port 3000 before starting dev server
- Always test before claiming PR-ready
- Always bump version before pushing to main
- Always check console for errors
- Use `git acm` alias for add + commit
- Don't use emojis in code or commits
- AOMA = "Asset and Offering Management Application" (no dash)

## Get Help

```bash
# Full documentation
cat docs/INDEX.md

# Specific guides
cat docs/development/TESTING-STRATEGY.md
cat docs/deployment/DEPLOYMENT-GUIDE.md
cat docs/troubleshooting/COMMON-ISSUES.md
```

## What's Next?

- **For development workflows**: See [docs/development/](development/)
- **For deployment process**: See [docs/deployment/](deployment/)
- **For design compliance**: See [docs/design/](design/)
- **For agent usage**: See [docs/agents/](agents/)
- **For troubleshooting**: See [docs/troubleshooting/](troubleshooting/)

---

**You're ready to go!** Start with `npm run dev` and check the [documentation index](INDEX.md) for detailed guides.
