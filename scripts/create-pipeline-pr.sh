#!/bin/bash

# Create PR for CI/CD Pipeline Overhaul

gh pr create \
  --title "feat: CI/CD Pipeline Overhaul with P0 Test Validation" \
  --body "$(cat <<'EOF'
## 🚀 CI/CD Pipeline Overhaul

This PR implements a comprehensive overhaul of our CI/CD pipeline with proper deployment gating and P0 test validation.

### 🎯 Key Improvements

#### Critical Fixes
- ✅ **Removed all silent test failures** - No more `|| true` or `continue-on-error` on critical tests
- ✅ **Fixed job dependency bug** - `validate` job now correctly depends on `validate-deployment`
- ✅ **Added AOMA anti-hallucination tests** - P0 CRITICAL tests now run before every deployment
- ✅ **Added deployment quality gate** - ALL tests must pass before deployment proceeds

#### New 7-Stage Pipeline Architecture

**Stage 1: Code Quality & Security**
- TypeScript type checking (FAIL on errors)
- ESLint checking (FAIL on errors)
- Security audit (high/critical vulnerabilities)
- Secret scanning (TruffleHog)

**Stage 2: Build Application**
- Next.js production build
- Generate build info
- Upload artifacts

**Stage 3: Critical Tests (P0 - MUST PASS)** 🆕
- AOMA Anti-Hallucination Tests (prevents AI misinformation)
- Visual Regression Tests (prevents UI breaks)
- E2E Smoke Tests (validates critical paths)
- File Upload/Curation Tests (validates core functionality)

**Stage 4: Pre-Deployment Quality Gate** 🆕
- Explicit authorization checkpoint
- Only runs if ALL tests pass

**Stage 5: Deployment Validation** (main branch only)
- Wait for Render auto-deployment
- Health checks with 20 retries
- Automatic issue creation on failure

**Stage 6: Post-Deployment Validation** (main branch only)
- Production smoke tests
- Performance checks (<5s fail, <3s warn)
- Console error detection

**Stage 7: PR Feedback** 🆕
- Automatic PR comment with test results table

#### Safety Features
- 🚨 Automatic issue creation on AOMA test failures (P0 CRITICAL)
- 🚨 Automatic issue creation on deployment failures
- ⚡ Emergency rollback workflow (manual trigger)
- ⚡ Skip tests option for critical hotfixes
- 📊 Performance budgets enforced

### 🧪 Testing This PR

This PR will test the new pipeline end-to-end. Watch for:

- [ ] All test stages execute correctly
- [ ] PR comment appears with test results table
- [ ] Tests complete in ~5-8 minutes
- [ ] Clear pass/fail indicators
- [ ] Artifacts uploaded successfully

### 📚 Documentation

**Comprehensive documentation added:**
- `docs/CI-CD-PIPELINE-IMPROVEMENTS.md` - Full pipeline architecture and improvements
- `docs/CI-CD-TESTING-PLAN.md` - Step-by-step testing and validation guide
- `tsconfig.ci.json` - Stricter TypeScript config for CI

### ⚠️ Important Notes

- This PR will NOT deploy to production (not merging to main yet)
- Purely validates the pipeline works correctly
- All changes are backward compatible
- No breaking changes to deployment process

### 🎯 Expected Pipeline Flow

\`\`\`
Code Quality & Security (~2 min)
        ↓
Build Application (~3 min)
        ↓
┌───────────────────────────────┐
│ Critical Tests (Parallel)     │ (~5 min)
├───────────────────────────────┤
│ • AOMA Validation             │
│ • Visual Regression           │
│ • E2E Smoke Tests             │
│ • Curate Functionality        │
└───────────────────────────────┘
        ↓
PR Comment with Results Table
\`\`\`

**Total Expected Time:** ~8-10 minutes

### 📋 Before/After Comparison

| Before | After |
|--------|-------|
| ❌ Tests fail silently | ✅ Tests FAIL the build |
| ❌ No AOMA validation | ✅ P0 CRITICAL AOMA tests |
| ❌ No deployment gating | ✅ ALL tests must pass |
| ❌ Manual issue creation | ✅ Auto-create issues |
| ❌ Poor visibility | ✅ PR comments with results |
| ❌ Job dependency bugs | ✅ Fixed dependencies |

### 🚀 Deployment Gating

After this PR merges to main, deployments will be gated by:
1. Code quality passing
2. Build succeeding
3. **AOMA anti-hallucination tests passing** (prevents AI misinformation)
4. Visual regression tests passing
5. E2E smoke tests passing
6. File upload/curation tests passing

**Result:** Only fully tested, validated code reaches production.

---

**Testing Status:**
- [ ] TypeScript check
- [ ] ESLint check
- [ ] Build succeeds
- [ ] AOMA tests execute
- [ ] Visual regression tests execute
- [ ] E2E smoke tests execute
- [ ] Curate tests execute
- [ ] PR comment posted

/cc @mattcarp
EOF
)" \
  --base main \
  --head claude/review-ci-pipeline-011CULLAfwHxiJTbCj6Ciwgi

echo ""
echo "✅ PR Created!"
echo ""
echo "📊 Monitor the pipeline at:"
echo "https://github.com/mattcarp/siam/actions"
echo ""
echo "⏱️  Expected completion time: ~8-10 minutes"
echo ""
