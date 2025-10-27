# CI/CD Pipeline Testing & Validation Plan

## 🎯 Objective

Thoroughly test the new CI/CD pipeline before merging to main to ensure:

- All test stages execute correctly
- Deployment gating works as expected
- Failure scenarios are handled properly
- No surprises on the first production deployment

---

## ✅ Pre-Flight Checks (COMPLETED)

### Test Files Verification

- ✅ **AOMA Tests**: 4 test files found
  - `tests/production/aoma-anti-hallucination.spec.ts` (16KB)
  - `tests/production/aoma-chat-test.spec.ts` (18KB)
  - `tests/production/aoma-error-handling.spec.ts` (17KB)
  - `tests/production/aoma-knowledge-validation.spec.ts` (18KB)

- ✅ **Visual Regression Tests**: Found
  - `tests/visual/dark-theme-regression.spec.ts` (11KB)

- ✅ **E2E Smoke Tests**: Found
  - `tests/e2e/smoke/smoke.spec.ts` (4KB)

- ✅ **Curate Tests**: Found
  - `tests/curate-tab-test.spec.ts` (5KB)

- ✅ **TypeScript CI Config**: Created
  - `tsconfig.ci.json` (stricter settings for CI)

---

## 🧪 Phase 1: Pre-PR Validation (Local Testing)

### Step 1.1: Verify TypeScript Check Works

```bash
# Test TypeScript compilation
npx tsc --noEmit -p tsconfig.ci.json

# Expected: Should complete without errors
# If errors: Fix before proceeding
```

**What to check:**

- No TypeScript errors in source code
- CI config properly excludes test files
- Compilation completes successfully

---

### Step 1.2: Verify ESLint Works

```bash
# Run ESLint
npm run lint

# Expected: Should pass or show fixable issues
# If errors: Fix before proceeding
```

**What to check:**

- No critical ESLint errors
- Warnings are acceptable
- Config is valid

---

### Step 1.3: Test Build Success

```bash
# Verify build works
npm run build

# Expected: Build completes successfully
# Output: .next/ directory created
```

**What to check:**

- Build completes without errors
- All pages compile correctly
- No missing dependencies

---

### Step 1.4: Verify AOMA Tests Exist and Run

```bash
# Run AOMA knowledge validation (local)
npm run test:aoma:knowledge -- --project=chromium --headed

# Run AOMA anti-hallucination (local)
npm run test:aoma:hallucination -- --project=chromium --headed

# Expected: Tests execute (may fail if not configured for local)
```

**What to check:**

- Tests can be found by Playwright
- No import/syntax errors
- Tests attempt to run (results don't matter yet)

---

### Step 1.5: Quick Smoke Test

```bash
# Start dev server
npm run dev &
DEV_PID=$!

# Wait for server
sleep 10

# Run smoke tests locally
npx playwright test tests/e2e/smoke/smoke.spec.ts --project=chromium

# Cleanup
kill $DEV_PID
```

**What to check:**

- Dev server starts successfully
- Smoke tests can connect to localhost:3000
- Basic functionality works

---

## 📝 Phase 2: Create Test PR

### Step 2.1: Create Pull Request

```bash
# Create PR using GitHub CLI
gh pr create \
  --title "feat: CI/CD Pipeline Overhaul with P0 Test Validation" \
  --body "$(cat << 'EOF'
## 🚀 CI/CD Pipeline Overhaul

This PR implements a comprehensive overhaul of our CI/CD pipeline with proper deployment gating and P0 test validation.

### 🎯 Key Improvements

**Critical Fixes:**
- ✅ Removed all silent test failures (no more `|| true`)
- ✅ Fixed job dependency bug (validate → validate-deployment)
- ✅ Added AOMA anti-hallucination tests (P0 CRITICAL)
- ✅ Added deployment quality gate (all tests must pass)

**New Test Stages:**
1. Code Quality & Security
2. Build Application
3. Critical Tests (AOMA, Visual, E2E, Curate)
4. Pre-Deployment Quality Gate
5. Deployment Validation
6. Post-Deployment Validation
7. PR Feedback

**Safety Features:**
- Automatic issue creation on failures
- Performance budgets (<5s fail, <3s warn)
- Emergency rollback workflow
- Skip tests option for critical hotfixes

### 🧪 Testing This PR

This PR itself will test the new pipeline. Watch for:

- [ ] All test stages execute
- [ ] PR comment appears with test results
- [ ] Tests complete in ~5-8 minutes
- [ ] Clear pass/fail indicators

### 📚 Documentation

- See `docs/CI-CD-PIPELINE-IMPROVEMENTS.md` for full details
- All changes are backward compatible
- No breaking changes to deployment process

### ⚠️ Note

This PR will NOT deploy to production (it's not merging to main yet). It's purely to validate the pipeline works correctly.

---

**Testing Checklist:**
- [ ] TypeScript check passes
- [ ] ESLint check passes
- [ ] Build succeeds
- [ ] AOMA tests execute
- [ ] Visual regression tests execute
- [ ] E2E smoke tests execute
- [ ] Curate tests execute
- [ ] PR comment is posted

/cc @mattcarp
EOF
)" \
  --base main \
  --head claude/review-ci-pipeline-011CULLAfwHxiJTbCj6Ciwgi
```

---

### Step 2.2: Monitor PR Pipeline

**Immediately after creating PR:**

1. **Go to GitHub Actions tab**

   ```
   https://github.com/mattcarp/siam/actions
   ```

2. **Watch for new workflow run**
   - Should start within ~30 seconds
   - Named "CI/CD Pipeline"

3. **Monitor each stage:**

   ```
   Expected Flow:

   ┌─────────────────────────────────┐
   │ Code Quality & Security         │ (~2 min)
   ├─────────────────────────────────┤
   │ ✓ TypeScript check              │
   │ ✓ ESLint check                  │
   │ ✓ Security audit                │
   │ ✓ Secret scanning               │
   └─────────────────────────────────┘
              ↓
   ┌─────────────────────────────────┐
   │ Build Application               │ (~3 min)
   ├─────────────────────────────────┤
   │ ✓ Install dependencies          │
   │ ✓ Generate build info           │
   │ ✓ Build Next.js                 │
   │ ✓ Upload artifacts              │
   └─────────────────────────────────┘
              ↓
   ┌─────────────────────────────────┐
   │ Critical Tests (Parallel)       │ (~5 min)
   ├─────────────────────────────────┤
   │ ✓ AOMA Validation               │
   │ ✓ Visual Regression             │
   │ ✓ E2E Smoke Tests               │
   │ ✓ Curate Functionality          │
   └─────────────────────────────────┘
              ↓
   ┌─────────────────────────────────┐
   │ PR Comment                      │ (~10 sec)
   ├─────────────────────────────────┤
   │ ✓ Post test results to PR       │
   └─────────────────────────────────┘
   ```

---

### Step 2.3: Validate PR Comment

**Check the PR page for automatic comment:**

Expected comment format:

```markdown
## 🧪 Test Results

### ✅ All Tests Passed!

| Test Suite                   | Status     |
| ---------------------------- | ---------- |
| Code Quality & Security      | ✅ success |
| Build                        | ✅ success |
| AOMA Anti-Hallucination (P0) | ✅ success |
| Visual Regression            | ✅ success |
| E2E Smoke Tests              | ✅ success |
| File Upload/Curation         | ✅ success |

🚀 **Ready to merge!** All quality gates passed.

[View Details](...)
```

**If comment doesn't appear:**

- Check Actions tab for `pr-comment` job
- Look for errors in job logs
- Verify GITHUB_TOKEN permissions

---

## 🔴 Phase 3: Test Failure Scenarios

### Why Test Failures?

We need to verify that:

- Tests actually fail when they should
- Failed tests block the pipeline
- Issues are created automatically
- Clear error messages are shown

---

### Step 3.1: Test TypeScript Failure

**Create intentional TypeScript error:**

```bash
# Create a new branch for testing failures
git checkout -b test/typescript-failure

# Add intentional error
echo "const x: number = 'string'; // Type error" >> app/page.tsx

# Commit and push
git add app/page.tsx
git commit -m "test: intentional TypeScript error"
git push origin test/typescript-failure

# Create PR
gh pr create \
  --title "TEST: TypeScript Failure" \
  --body "Testing TypeScript check failure handling" \
  --base claude/review-ci-pipeline-011CULLAfwHxiJTbCj6Ciwgi \
  --head test/typescript-failure
```

**Expected Result:**

- ❌ Quality stage fails
- ❌ Build stage doesn't run (blocked by quality)
- ❌ PR shows failed status
- ❌ Red X on GitHub

**Cleanup:**

```bash
# Close PR and delete branch
gh pr close test/typescript-failure --delete-branch
git checkout claude/review-ci-pipeline-011CULLAfwHxiJTbCj6Ciwgi
```

---

### Step 3.2: Test Build Failure (Optional)

**Create intentional build error:**

```bash
git checkout -b test/build-failure

# Add syntax error
echo "This is not valid JavaScript!!!!" >> app/layout.tsx

git add app/layout.tsx
git commit -m "test: intentional build error"
git push origin test/build-failure

gh pr create \
  --title "TEST: Build Failure" \
  --body "Testing build failure handling" \
  --base claude/review-ci-pipeline-011CULLAfwHxiJTbCj6Ciwgi \
  --head test/build-failure
```

**Expected Result:**

- ✅ Quality passes
- ❌ Build fails
- ❌ Tests don't run (blocked by build)
- ❌ PR shows failed status

**Cleanup:**

```bash
gh pr close test/build-failure --delete-branch
git checkout claude/review-ci-pipeline-011CULLAfwHxiJTbCj6Ciwgi
```

---

## ✅ Phase 4: Validate Quality Gates

### Step 4.1: Verify Deployment Gating

**What to check in workflow logs:**

1. **Pre-deployment gate should NOT run on PR**
   - ✅ Correct: Only runs on `push` to `main`
   - ❌ Error: Runs on PR

2. **Tests run in parallel**
   - ✅ Correct: AOMA, Visual, E2E, Curate start simultaneously
   - ❌ Error: Tests run sequentially (slow)

3. **Failed tests block pipeline**
   - ✅ Correct: If any test fails, pipeline stops
   - ❌ Error: Pipeline continues despite failures

---

### Step 4.2: Check Artifact Uploads

**Verify artifacts are uploaded:**

1. Go to Actions run
2. Scroll to bottom: "Artifacts"
3. Should see:
   - `build-artifacts` (from build stage)
   - `aoma-test-results` (if AOMA tests ran)
   - `visual-regression-results` (if visual tests ran)
   - `e2e-test-results` (if E2E tests ran)
   - `curate-test-results` (if curate tests ran)

---

## 🚀 Phase 5: Merge to Main (If All Tests Pass)

### Step 5.1: Final Pre-Merge Checklist

Before merging, confirm:

- [ ] All PR tests passed
- [ ] PR comment was posted
- [ ] Artifacts uploaded successfully
- [ ] No unexpected errors in logs
- [ ] Timing is acceptable (~5-8 min)
- [ ] Failure scenarios tested (optional but recommended)

---

### Step 5.2: Merge PR

```bash
# Squash merge (recommended for clean history)
gh pr merge claude/review-ci-pipeline-011CULLAfwHxiJTbCj6Ciwgi \
  --squash \
  --delete-branch

# Or via GitHub UI with "Squash and merge" button
```

---

### Step 5.3: Monitor Main Branch Deployment

**This is CRITICAL - watch the first deployment closely!**

**What happens when merged to main:**

```
Merge to main
    ↓
Stage 1-3: Same as PR (Quality, Build, Tests)
    ↓
Stage 4: Pre-Deployment Quality Gate (NEW!)
    ↓
    ✅ All tests passed?
    ↓
Render Auto-Deploy
    ↓
Stage 5: Deployment Validation
    ↓
    Health checks (20 retries, 15s between)
    ↓
Stage 6: Post-Deployment Validation
    ↓
    Production smoke tests
    Performance checks
    Console error detection
    ↓
    ✅ Success notification
```

---

### Step 5.4: Watch Deployment Logs

**Monitor these key points:**

1. **Pre-deployment gate:**

   ```
   ==========================================
   ✅ PRE-DEPLOYMENT QUALITY GATE PASSED
   ==========================================

   All critical tests have passed:
     ✅ Code Quality & Security
     ✅ Build Success
     ✅ AOMA Anti-Hallucination Tests (P0)
     ✅ Visual Regression Tests
     ✅ E2E Smoke Tests
     ✅ File Upload/Curation Tests

   🚀 DEPLOYMENT AUTHORIZED
   ==========================================
   ```

2. **Render deployment:**

   ```
   🚀 Waiting for Render to auto-deploy...
   ⏳ Waiting 60 seconds for deployment to stabilize...
   ```

3. **Health checks:**

   ```
   Attempt 1 of 20...
     Health endpoint: 200
     Main page: 200

   ✅ Health check passed!
   ✅ Main page loads successfully!
   ```

4. **Post-deployment:**

   ```
   🔥 PRODUCTION SMOKE TESTS
   ✅ Passed: https://thebetabase.com (HTTP 200)
   ✅ Passed: https://thebetabase.com/api/health (HTTP 200)
   ✅ Passed: https://thebetabase.com/chat (HTTP 200)

   ⚡ PERFORMANCE CHECK
   Response time: 1234ms (1.234s)
   ✅ Performance: Good
   ```

---

## 🚨 Failure Handling

### If Health Checks Fail

**What happens:**

1. Health check retries 20 times
2. Creates GitHub issue with P0 priority
3. Issue auto-assigned to @mattcarp
4. Deployment marked as failed

**What to do:**

1. Check Render dashboard immediately
2. Review Render logs for errors
3. Check if site is accessible manually
4. Follow issue instructions for rollback

---

### If AOMA Tests Fail on Main

**What happens:**

1. AOMA test failure blocks deployment
2. Pre-deployment gate never runs
3. Creates CRITICAL issue
4. Deployment does NOT proceed

**What to do:**

1. Review AOMA test failures in artifacts
2. Fix knowledge base or AI configuration
3. Do NOT merge again until fixed
4. Consider reverting the commit if needed

---

## 📊 Success Metrics

### Pipeline Performance

**Target Metrics:**

- Total PR pipeline time: 5-8 minutes
- Total main pipeline time: 8-12 minutes
- Health check success rate: >95%
- Test pass rate: >95%

**Monitor:**

- Pipeline duration trends
- Test flakiness
- Deployment success rate
- Time to deploy (commit → production)

---

### Test Coverage

**Verify:**

- All P0 tests running on every deployment
- AOMA tests preventing hallucination
- Visual tests catching regressions
- E2E tests validating critical paths

---

## 🎯 Phase 6: Post-Deployment Validation

### Step 6.1: Verify Production

**Manual checks after first deployment:**

```bash
# Check health endpoint
curl https://thebetabase.com/api/health

# Expected: {"status":"ok",...}

# Check main page
curl -I https://thebetabase.com

# Expected: HTTP/2 200

# Check response time
time curl -s https://thebetabase.com > /dev/null

# Expected: <3 seconds
```

---

### Step 6.2: Test AOMA in Production

**Verify AOMA functionality:**

1. Visit https://thebetabase.com/chat
2. Ask AOMA a question from knowledge base
3. Verify accurate response (no hallucination)
4. Check console for errors

---

### Step 6.3: Review GitHub Issues

**Check if any auto-created issues exist:**

```bash
# List recent issues
gh issue list --label "P0" --limit 5

# Should be empty if deployment succeeded
```

---

## 📋 Final Checklist

### Before Declaring Success

- [ ] PR pipeline completed successfully
- [ ] PR comment was posted
- [ ] Failure scenarios tested (optional)
- [ ] Merged to main
- [ ] Main branch pipeline completed
- [ ] Pre-deployment gate passed
- [ ] Health checks succeeded
- [ ] Post-deployment validation passed
- [ ] Production site is accessible
- [ ] AOMA works correctly in production
- [ ] No auto-created issues
- [ ] Performance is acceptable
- [ ] No console errors in production

---

## 🎉 Success Criteria

The pipeline is considered successful when:

1. ✅ All PR tests pass on first try
2. ✅ PR comment appears correctly
3. ✅ Main branch deployment completes
4. ✅ Health checks pass (20/20 or high success rate)
5. ✅ Production site works correctly
6. ✅ No critical issues created
7. ✅ Pipeline completes in reasonable time
8. ✅ Clear visibility into test results

---

## 🛠️ Troubleshooting

### Common Issues

#### Issue: Tests timeout

**Solution:** Increase timeout in workflow or optimize tests

#### Issue: AOMA tests fail

**Solution:** Check if production AOMA endpoint is configured

#### Issue: Health checks fail

**Solution:** Increase retry count or check Render logs

#### Issue: PR comment not posted

**Solution:** Check GITHUB_TOKEN permissions

#### Issue: Artifacts not uploaded

**Solution:** Check paths in workflow match actual file locations

---

## 📝 Documentation Updates

After successful deployment, update:

1. **CLAUDE.md**
   - Add CI/CD pipeline overview
   - Document emergency procedures
   - Link to detailed docs

2. **README.md**
   - Add CI/CD status badge
   - Document deployment process

3. **Team Wiki/Docs**
   - Deployment runbook
   - Failure scenarios
   - Rollback procedures

---

## 🎯 Next Steps After Validation

Once pipeline is solid:

1. **Add more tests** to increase coverage
2. **Set up notifications** (Slack, email)
3. **Add performance monitoring** (Lighthouse CI)
4. **Implement canary deployments** (gradual rollout)
5. **Add security scanning** (Snyk, Dependabot)
6. **Monitor metrics** and iterate

---

**Document Created:** October 21, 2025
**Last Updated:** October 21, 2025
**Status:** 🎯 Ready for Testing
