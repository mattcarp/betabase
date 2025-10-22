# Deployment Testing Protocol - MANDATORY

**Created**: January 2025  
**Status**: ACTIVE - MUST FOLLOW ALWAYS  
**Priority**: CRITICAL

---

## 🚨 GOLDEN RULE: ALWAYS TEST LOCALHOST FIRST

**NEVER deploy without running P0 tests on localhost first.**

This is non-negotiable. No exceptions. No shortcuts.

---

## Why This Matters

1. **Catch breaking changes early** - Before they reach production
2. **Validate UI/UX** - Ensure dark theme, layouts, interactions work
3. **Test auth flows** - Magic link, session management, verification
4. **Verify file operations** - Upload, delete, knowledge base management
5. **Prevent regressions** - Visual and functional regressions
6. **Save time** - Fixing in dev is 10x faster than in production
7. **Maintain quality** - Production should always be stable

---

## 📋 Pre-Deployment Checklist

### **STEP 1: Start Local Dev Server**

```bash
cd ~/Documents/projects/siam
npm run dev
# Wait for "Local: http://localhost:3000"
# Server must be fully running before tests
```

**Verify server is ready**:

- Open http://localhost:3000 in browser
- Check console for errors
- Ensure page loads completely

### **STEP 2: Run P0 Critical Tests**

These tests **MUST PASS** before any deployment:

```bash
# P0-1: AOMA Chat Anti-Hallucination (CRITICAL)
npx playwright test tests/production/aoma-chat-test.spec.ts

# P0-2: File Upload/Delete to Knowledge Base (CRITICAL)
npx playwright test tests/curate-tab-test.spec.ts

# P0-3: Dark Theme Visual Regression (CRITICAL)
npx playwright test tests/visual/dark-theme-regression.spec.ts

# P0-4: Smoke Tests - Critical User Paths (CRITICAL)
npx playwright test tests/e2e/smoke/smoke.spec.ts
```

**Pass Criteria**: ALL 4 tests must pass with 0 failures

### **STEP 3: If Tests Fail - STOP AND FIX**

**DO NOT PROCEED TO DEPLOYMENT**

1. Review test failure logs
2. Check screenshots in `test-results/`
3. Fix the issues
4. Re-run the failing test
5. Once fixed, run full P0 suite again
6. Only proceed when ALL tests pass

### **STEP 4: Optional - Extended Test Suite**

If time permits or making significant changes:

```bash
# Full local test suite
npm run test:e2e:local

# Type checking
npm run type-check

# Linting
npm run lint

# Unit tests
npm test
```

### **STEP 5: Deploy ONLY After Tests Pass**

```bash
# Automated deployment with monitoring
./scripts/deploy-with-monitoring.sh

# OR basic deployment
./scripts/deploy.sh

# Monitor deployment
./scripts/deployment-status.sh
```

---

## ⚠️ What NOT To Do

### ❌ **NEVER**:

- Deploy without running localhost tests first
- Skip P0 tests "because it's just a small change"
- Assume production tests are enough
- Deploy if ANY P0 test fails
- Deploy if localhost server won't start
- Deploy if there are TypeScript errors
- Deploy if there are console errors on localhost

### ❌ **NEVER Say**:

- "It's just a config change, doesn't need testing"
- "I'll test in production"
- "The tests are flaky anyway"
- "We're in a hurry"
- "It worked on my machine" (without proving it with tests)

---

## 🎯 Test Priorities

### P0 - BLOCKER (Must pass before ANY deploy)

- ✅ AOMA chat anti-hallucination tests
- ✅ File upload/delete to knowledge base
- ✅ Dark theme visual regression
- ✅ Smoke tests (critical paths)

**If P0 fails → NO DEPLOY**

### P1 - HIGH (Should pass before deploy)

- ✅ Full production test suite
- ✅ Authentication flow
- ✅ Chat functionality
- ✅ Console error checks
- ✅ Type checking
- ✅ Linting

**If P1 fails → Fix before deploy or document known issues**

### P2 - MEDIUM (Run regularly)

- ✅ Assistant functionality
- ✅ API endpoint tests
- ✅ Performance tests
- ✅ Comprehensive test suite

**If P2 fails → Can deploy but create issue to fix**

---

## 🔄 Deployment Workflow

```
┌─────────────────────────────────────────────────────┐
│ 1. Code changes committed                           │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│ 2. Start localhost dev server                       │
│    npm run dev                                      │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│ 3. Run P0 Critical Tests                           │
│    - AOMA chat test                                │
│    - Curate functionality test                     │
│    - Dark theme regression test                    │
│    - Smoke tests                                   │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
         ┌────────┴────────┐
         │  Tests Pass?    │
         └────────┬────────┘
           ┌──────┴──────┐
           │             │
          YES            NO
           │             │
           ▼             ▼
    ┌──────────┐   ┌─────────────────┐
    │ Deploy   │   │ STOP - Fix      │
    │          │   │ issues first    │
    └────┬─────┘   └─────────────────┘
         │
         ▼
    ┌──────────────────────────────────┐
    │ Monitor deployment               │
    │ - Render MCP                     │
    │ - GitHub Actions                 │
    │ - Health checks                  │
    └──────────────────────────────────┘
```

---

## 🚨 Emergency Deployment Exception

**In rare emergencies ONLY** (production down, critical security patch):

1. **Document the emergency** in commit message
2. **Get explicit approval** from project owner
3. **Deploy with monitoring** using `./scripts/deploy-with-monitoring.sh`
4. **Test immediately in production** after deploy
5. **Have rollback ready** (previous commit hash)
6. **Run full P0 tests ASAP** after emergency is resolved

**Emergency criteria**:

- Production is completely down
- Critical security vulnerability being exploited
- Data loss in progress
- Legal/compliance requirement

**NOT emergencies**:

- "We need this feature today"
- "Client is waiting"
- "It's just a small change"
- "Tests are taking too long"

---

## 📝 Test Failure Response

### When P0 Tests Fail:

1. **STOP DEPLOYMENT IMMEDIATELY**
2. **Review failure logs**:
   ```bash
   npx playwright show-report
   ```
3. **Check screenshots** in `test-results/` directory
4. **Identify root cause**:
   - UI regression?
   - API error?
   - Auth issue?
   - Data problem?
5. **Fix the issue** in code
6. **Re-run failing test**:
   ```bash
   npx playwright test <failing-test-file>
   ```
7. **Run full P0 suite** to ensure no other breaks
8. **Only then proceed to deployment**

---

## 🔧 Test Environment Setup

### Prerequisites:

- Node.js 18+
- npm 10+
- Playwright browsers installed
- Environment variables configured
- Localhost port 3000 available

### Quick Setup:

```bash
# Install dependencies
npm install

# Install Playwright browsers (if not already done)
npx playwright install

# Verify setup
npm run type-check
npm run lint
```

### Environment Variables:

Ensure these are set in `.env.local`:

- `NEXT_PUBLIC_COGNITO_USER_POOL_ID`
- `NEXT_PUBLIC_COGNITO_CLIENT_ID`
- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `FIRECRAWL_API_KEY`

---

## 📊 Testing Best Practices

### Before Running Tests:

1. **Clear test artifacts**:
   ```bash
   rm -rf test-results/ playwright-report/
   ```
2. **Ensure clean state** - No running processes on port 3000
3. **Check git status** - Ensure all changes committed
4. **Verify environment variables** loaded

### During Tests:

1. **Monitor console output** for errors
2. **Watch for browser windows** (if headed mode)
3. **Check for hanging processes**
4. **Note any flaky tests** for investigation

### After Tests:

1. **Review HTML report**:
   ```bash
   npx playwright show-report
   ```
2. **Check screenshots** for visual issues
3. **Verify all assertions passed**
4. **Document any known issues**

---

## 🎓 Training New Team Members

When onboarding new developers:

1. **Show them this document FIRST**
2. **Walk through a complete deployment** with them
3. **Have them run P0 tests** on their local machine
4. **Explain WHY each test matters**
5. **Show them failure examples** and how to debug
6. **Practice rollback procedures**
7. **Review test logs together**

---

## 📚 Related Documentation

- **TESTING_FUNDAMENTALS.md** - Complete test documentation
- **tests/README.md** - Test suite overview
- **CLAUDE.md** - Deployment commands and scripts
- **docs/PRODUCTION_TESTING.md** - Production testing strategies

---

## ✅ Quick Reference Commands

```bash
# Start dev server
npm run dev

# Run P0 critical tests
npx playwright test tests/production/aoma-chat-test.spec.ts
npx playwright test tests/curate-tab-test.spec.ts
npx playwright test tests/visual/dark-theme-regression.spec.ts
npx playwright test tests/e2e/smoke/smoke.spec.ts

# Deploy after tests pass
./scripts/deploy-with-monitoring.sh

# Monitor deployment
./scripts/deployment-status.sh

# Emergency rollback
git revert HEAD
git push origin main --force
```

---

## 🔄 Version History

- **v1.0** (Jan 2025) - Initial protocol established
- Reason: Prevent deployments without localhost testing
- Impact: Improved production stability, reduced rollbacks

---

**REMEMBER**:

- ⏱️ 10 minutes of testing saves HOURS of debugging in production
- 🎯 Quality > Speed
- 🛡️ Production stability is paramount
- 📋 Follow the checklist EVERY TIME
- 🚨 No shortcuts, no exceptions

**Last Updated**: January 10, 2025  
**Owner**: SIAM Development Team  
**Status**: MANDATORY FOR ALL DEPLOYMENTS
