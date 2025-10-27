# 🧪 SIAM Testing Fundamentals - CRITICAL REFERENCE

**IMPORTANT**: This test suite is fundamental to SIAM's quality assurance. These tests MUST be run before any deployment.

---

## 🎯 Core Test Categories

### 1. **AOMA Chat Intelligence Tests** 🤖

**Location**: `tests/production/aoma-chat-test.spec.ts`

**Purpose**: Validates that AOMA doesn't hallucinate and provides accurate answers from the knowledge base.

**What it tests**:

- ✅ Real AOMA questions (What is AOMA? USM? AOMA 3 features?)
- ✅ Complex queries (integration workflows, QC processes)
- ✅ Multi-turn conversations (context retention)
- ✅ Error handling (bad inputs, XSS attempts)
- ✅ Performance under load (rapid-fire queries)
- ✅ Special characters and Unicode
- ✅ Response quality metrics (structure, completeness, keywords)

**Why it's critical**:

- Prevents hallucination - ensures AI only answers from knowledge base
- Validates AOMA knowledge base integration
- Tests end-to-end chat functionality
- Ensures production-level quality

**How to run**:

```bash
# Full AOMA chat test suite
npx playwright test tests/production/aoma-chat-test.spec.ts

# Individual test groups
npx playwright test tests/production/aoma-chat-test.spec.ts -g "BASIC QUERIES"
npx playwright test tests/production/aoma-chat-test.spec.ts -g "COMPLEX QUERIES"
```

---

### 2. **File Upload & Curation Tests** 📁

**Location**:

- `tests/curate-tab-test.spec.ts`
- `tests/comprehensive/file-upload-curate.spec.ts`
- `tests/enhanced-curate-tab.spec.ts`

**Purpose**: Ensures users can upload files to AOMA knowledge base and manage them.

**What it tests**:

- ✅ Single file upload
- ✅ Multiple file upload
- ✅ Drag and drop functionality
- ✅ File type validation
- ✅ File deletion from knowledge base
- ✅ File preview and details
- ✅ Vector store integration (embedding files)
- ✅ Upload progress indicators
- ✅ Success/error notifications
- ✅ Upload error handling

**Curate tab subtabs tested**:

- Upload interface
- File management list
- Vector store status
- Knowledge base curation

**Why it's critical**:

- Core AOMA feature - knowledge base management
- Data integrity - ensures files are properly stored
- User experience - upload/delete must work reliably
- Vector embeddings - critical for AI search quality

**How to run**:

```bash
# All curation tests
npx playwright test tests/curate-tab-test.spec.ts
npx playwright test tests/comprehensive/file-upload-curate.spec.ts

# Quick curation check
npx playwright test tests/enhanced-curate-tab.spec.ts
```

---

### 3. **Visual Regression Tests** 🎨

**Location**: `tests/visual/`

**Purpose**: Prevents UI regressions, especially the recurring dark theme bug.

**What it tests**:

- ✅ Dark theme consistency (main chat panel)
- ✅ Background colors (prevents white background regression)
- ✅ UI component visibility and contrast
- ✅ Visual snapshot comparisons
- ✅ Responsive design across viewports
- ✅ Console error detection

**Critical test**: `dark-theme-regression.spec.ts`

- **History**: White background has regressed multiple times
- **Root cause**: CSS variables resolving to light colors
- **Protection**: Automated RGB value checks + snapshot comparison

**Why it's critical**:

- User experience - dark theme is core to SIAM's design
- Brand consistency - MAC Design System compliance
- Accessibility - proper contrast ratios
- Quality gate - catches unintended UI changes

**How to run**:

```bash
# All visual tests
npx playwright test tests/visual/

# Critical dark theme test only
npx playwright test tests/visual/dark-theme-regression.spec.ts

# Update snapshots after intentional UI changes
npx playwright test tests/visual/ --update-snapshots
```

---

### 4. **Full Production Test Suite** 🚀

**Location**: `tests/production/full-production-test.spec.ts`

**Purpose**: Complete end-to-end production validation.

**What it tests**:

- ✅ Authentication flow (magic link)
- ✅ Chat functionality
- ✅ File upload/download
- ✅ AOMA integration
- ✅ API health checks
- ✅ Performance metrics
- ✅ Error handling

**How to run**:

```bash
npx playwright test tests/production/full-production-test.spec.ts
```

---

## 🎭 Comprehensive Test Suite

### Authentication Tests

**Location**: `tests/comprehensive/auth-flow.spec.ts`, `tests/auth/`

**Coverage**:

- Login form validation
- Magic link authentication
- Email verification via Mailinator
- Session management
- Logout functionality
- Domain restrictions (@sonymusic.com)
- Rate limiting

### Chat Functionality Tests

**Location**: `tests/comprehensive/chat-functionality.spec.ts`

**Coverage**:

- Message sending/receiving
- Multi-line messages
- Message history
- AI response streaming
- Markdown formatting
- Message editing/deletion
- Error recovery

### Assistant Tests

**Location**: `tests/comprehensive/assistant-functionality.spec.ts`

**Coverage**:

- Thread management
- Context retention
- Follow-up questions
- Code generation
- File integration
- Model settings
- Conversation export

---

## 🚨 Pre-Deployment Checklist

**MANDATORY TESTS BEFORE DEPLOYMENT**:

1. ✅ **AOMA Chat Tests** - No hallucinations

   ```bash
   npx playwright test tests/production/aoma-chat-test.spec.ts
   ```

2. ✅ **Curation Tests** - File upload/delete works

   ```bash
   npx playwright test tests/curate-tab-test.spec.ts
   ```

3. ✅ **Visual Regression** - No UI breaks

   ```bash
   npx playwright test tests/visual/dark-theme-regression.spec.ts
   ```

4. ✅ **Smoke Tests** - Critical paths work

   ```bash
   npx playwright test tests/e2e/smoke/smoke.spec.ts
   ```

5. ✅ **Full Production** - E2E validation
   ```bash
   npx playwright test tests/production/full-production-test.spec.ts
   ```

---

## 📊 Test Execution Guide

### Local Development Testing

```bash
# Run all tests with dev server
npm run test:e2e:local

# Run specific test file
npx playwright test tests/[test-file].spec.ts

# Run with UI (interactive debugging)
npx playwright test --ui

# Run in headed mode (see browser)
npx playwright test --headed
```

### Production Testing (against thebetabase.com)

```bash
# Run production tests
npm run test:e2e:render

# Or explicitly
npx playwright test --config=playwright.config.render.ts
```

### Debugging Failed Tests

```bash
# Debug mode with inspector
npx playwright test --debug tests/[test-file].spec.ts

# Generate trace for analysis
npx playwright test --trace on

# View trace file
npx playwright show-trace trace.zip

# View HTML report
npx playwright show-report
```

---

## 🔧 Test Helpers & Utilities

**Location**: `tests/helpers/test-utils.ts`

**Key helpers**:

- `bypassAuth()` - Skip auth for faster local testing
- `monitorConsoleErrors()` - Detect JS errors
- `waitForAPIResponse()` - Wait for specific API calls
- `takeDebugScreenshot()` - Capture debug images
- `selectTab()` - Navigate between SIAM tabs
- `checkTextVisible()` - Flexible text finding
- `checkElementVisible()` - Element detection

**Page Objects**:

- `ChatPage` - Chat interface interactions
- `CuratePage` - File upload/management
- `BasePage` - Common page operations

---

## 📁 Test Organization

```
tests/
├── production/           # Production-only tests (auth required)
│   ├── aoma-chat-test.spec.ts      ⭐ CRITICAL - No hallucinations
│   ├── full-production-test.spec.ts
│   └── quick-verification.spec.ts
│
├── visual/              # Visual regression tests
│   ├── dark-theme-regression.spec.ts  ⭐ CRITICAL - UI consistency
│   ├── quick-visual-check.spec.ts
│   └── README.md
│
├── comprehensive/       # Full integration test suites
│   ├── auth-flow.spec.ts
│   ├── file-upload-curate.spec.ts     ⭐ CRITICAL - Curation
│   ├── chat-functionality.spec.ts
│   └── assistant-functionality.spec.ts
│
├── e2e/                # End-to-end user journeys
│   ├── smoke/smoke.spec.ts            ⭐ CRITICAL - Smoke tests
│   └── critical-paths/
│
├── auth/               # Authentication tests
├── api/                # API endpoint tests
├── local/              # Local-only tests
├── helpers/            # Shared utilities
└── __pages__/          # Page object models
```

---

## 🎯 Test Priorities

### P0 - BLOCKER (Must pass before deploy)

- ✅ AOMA chat anti-hallucination tests
- ✅ File upload/delete to knowledge base
- ✅ Dark theme visual regression
- ✅ Smoke tests (critical paths)

### P1 - HIGH (Should pass before deploy)

- ✅ Full production test suite
- ✅ Authentication flow
- ✅ Chat functionality
- ✅ Console error checks

### P2 - MEDIUM (Run regularly)

- ✅ Assistant functionality
- ✅ API endpoint tests
- ✅ Performance tests

### P3 - LOW (Run periodically)

- ✅ Visual regressions (non-critical)
- ✅ Edge cases
- ✅ Load testing

---

## 🚀 CI/CD Integration

### GitHub Actions

Tests are configured to run automatically on:

- Pull requests to main
- Push to main branch
- Manual workflow dispatch

**Workflow file**: `.github/workflows/ci-cd.yml`

### Render Deployment

After Render auto-deploys:

1. Health check validation (45s wait)
2. Smoke test execution
3. Performance check
4. Deployment annotation

---

## 💡 Best Practices

### When Writing New Tests

1. **Use data-testid attributes** for stable selectors
2. **Implement proper waits** (not arbitrary timeouts)
3. **Test both success and failure paths**
4. **Clean up test data** in finally blocks
5. **Make tests independent** (no shared state)
6. **Add descriptive test names** and comments
7. **Use helpers** for common operations

### When Tests Fail

1. **Review the HTML report** with screenshots
2. **Check console errors** in test output
3. **Run locally** in headed mode to see issue
4. **Check if it's environment-specific**
5. **Verify API/backend is healthy**
6. **Review recent code changes**

### When Updating UI

1. **Run visual tests first** (before changes)
2. **Run tests after** UI changes
3. **Review snapshot diffs** carefully
4. **Update snapshots** only if intentional
5. **Document** what changed and why

---

## 📚 Related Documentation

- **Test README**: `tests/README.md` - Full testing guide
- **Visual Tests**: `tests/visual/README.md` - Visual regression details
- **Production Testing**: `docs/PRODUCTION_TESTING.md` - Deployment testing
- **Test Summary**: `tests/TEST_SUMMARY.md` - Coverage metrics

---

## 🔥 Quick Commands Reference

```bash
# 🎯 Pre-deployment suite (run all P0 tests)
npx playwright test tests/production/aoma-chat-test.spec.ts && \
npx playwright test tests/curate-tab-test.spec.ts && \
npx playwright test tests/visual/dark-theme-regression.spec.ts && \
npx playwright test tests/e2e/smoke/smoke.spec.ts

# 🚀 Full production validation
npm run test:e2e:render

# 🧪 Local development testing
npm run test:e2e:local

# 🐛 Debug failed test
npx playwright test --debug tests/[test-file].spec.ts

# 📊 View test report
npx playwright show-report

# 📸 Update visual snapshots
npx playwright test tests/visual/ --update-snapshots
```

---

## ⚠️ Common Pitfalls

### 1. **Forgetting to run AOMA chat tests**

- **Risk**: Deploying hallucinating AI
- **Solution**: Add to pre-commit hook or CI/CD

### 2. **Updating snapshots without review**

- **Risk**: Accepting unintended UI regressions
- **Solution**: Always review diffs before updating

### 3. **Not testing file upload/delete**

- **Risk**: Breaking AOMA knowledge base curation
- **Solution**: Run curation tests on every API change

### 4. **Skipping visual regression tests**

- **Risk**: Dark theme breaking again (known issue)
- **Solution**: Make visual tests mandatory in CI

### 5. **Testing only locally**

- **Risk**: Environment-specific issues in production
- **Solution**: Always run production tests before deploy

---

## 🎉 Success Metrics

**Test suite is working correctly when**:

- ✅ All P0 tests pass consistently
- ✅ No hallucinated AOMA responses
- ✅ File upload/delete works reliably
- ✅ Dark theme stays dark
- ✅ Console has no errors
- ✅ Tests complete in < 10 minutes
- ✅ Failures are caught before production

---

**Last Updated**: October 2, 2025  
**Maintained By**: SIAM Development Team  
**Contact**: See CLAUDE.md for deployment and testing guidelines
