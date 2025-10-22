# 🎯 MASTER IDE TESTING INTEGRATION

## Universal Testing Commands for ALL IDEs

This file ensures EVERY development environment understands the SIAM testing architecture.

### 🚀 Quick Reference Matrix

| IDE             | Config File             | Priority Features                 |
| --------------- | ----------------------- | --------------------------------- |
| **Claude Code** | `__CLAUDE_CODE__.md`    | MCP integration, Natural language |
| **Cursor**      | `__CURSOR__.md`         | Copilot++, Tab completion         |
| **Windsurf**    | `__WINDSURF__.md`       | Cascade AI, Flow operations       |
| **VS Code**     | `.vscode/settings.json` | Extensions, Debug                 |
| **WebStorm**    | `.idea/`                | Built-in runner                   |

## 📁 Universal File Structure

```
tests/
├── __IDE_INTEGRATION__/     ← ALL IDE CONFIGS HERE
│   ├── __TESTING_RULES__.md    # Universal rules
│   ├── __CLAUDE_CODE__.md      # Claude Code specific
│   ├── __CURSOR__.md            # Cursor specific
│   ├── __WINDSURF__.md          # Windsurf specific
│   └── __MASTER__.md            # This file
│
├── 01-unit/                 # Fast component tests
├── 02-integration/          # API & service tests
├── 03-e2e/                  # User journey tests
├── 04-visual/               # Visual regression
│
├── __pages__/               # Page Object Model (Required)
├── __fixtures__/            # Test Data Factories
└── __utils__/               # Shared Utilities
```

## 🎯 Universal Commands (Work in ALL IDEs)

```bash
# Layer-based execution
npm run test:unit          # Fast feedback (5s)
npm run test:integration   # Service tests (15s)
npm run test:e2e          # Browser tests (30s)

# Tag-based execution
npm run test:smoke        # Critical paths only
npm run test:regression   # Full test suite

# Smart execution
npm run test:changed      # Test what changed
npm run test:failed       # Re-run failures
npm run test:related      # Test related files
```

## 🤖 AI Assistant Instructions

### For ANY AI Assistant (Claude, Cursor, Windsurf, Copilot):

```typescript
/**
 * WHEN USER SAYS → AI SHOULD DO
 */
{
  "test this": "Run most specific test for current context",
  "quick test": "Run @smoke tagged tests only",
  "test everything": "Run full regression suite",
  "create test": "Use template from __TESTING_RULES__.md",
  "fix test": "Check page object → Update selector → Verify"
}
```

## 📊 IDE Feature Comparison

| Feature           | Claude Code | Cursor     | Windsurf   | VS Code |
| ----------------- | ----------- | ---------- | ---------- | ------- |
| Natural Language  | ✅ Best     | ✅ Good    | ✅ Good    | ❌      |
| Multi-file Ops    | ✅ MCP      | ⚠️ Limited | ✅ Flow    | ❌      |
| Auto-complete     | ✅          | ✅ Best    | ✅         | ✅      |
| Debug Integration | ✅          | ✅         | ✅         | ✅ Best |
| AI Suggestions    | ✅          | ✅ Copilot | ✅ Cascade | ⚠️      |

## 🔧 Universal Configuration

### Package.json Scripts (Required for ALL IDEs)

```json
{
  "scripts": {
    "test": "npm run test:unit",
    "test:unit": "jest --testMatch='**/01-unit/**/*.test.ts'",
    "test:integration": "playwright test --project=integration",
    "test:e2e": "playwright test --project=e2e",
    "test:smoke": "playwright test --grep @smoke",
    "test:regression": "playwright test --grep @regression",
    "test:visual": "playwright test --project=visual",
    "test:changed": "jest -o && playwright test --changed",
    "test:failed": "playwright test --last-failed",
    "test:debug": "playwright test --debug",
    "test:ui": "playwright test --ui"
  }
}
```

### TypeScript Config (tsconfig.json)

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@pages/*": ["tests/__pages__/*"],
      "@fixtures/*": ["tests/__fixtures__/*"],
      "@utils/*": ["tests/__utils__/*"]
    }
  }
}
```

## 🎨 Universal Testing Patterns

### 1. Test File Template (ALL IDEs must use)

```typescript
/**
 * @feature [FeatureName]
 * @layer unit|integration|e2e
 * @priority p0|p1|p2
 * @tags smoke, regression
 */
import { test, expect } from '@playwright/test';
import { [Feature]Page } from '@pages';
import { TestFactory } from '@fixtures';

test.describe('[FEATURE] Name', () => {
  // Implementation
});
```

### 2. Page Object Template (ALL IDEs must follow)

```typescript
import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class [Feature]Page extends BasePage {
  private selectors = {
    // Group selectors by feature
  };

  // Public methods only
}
```

## 🚀 IDE Setup Checklist

### For New Developer Onboarding:

- [ ] Install IDE of choice
- [ ] Read `__TESTING_RULES__.md`
- [ ] Read IDE-specific config (`__[IDE]__.md`)
- [ ] Run `npm install`
- [ ] Run `npm run test:smoke` to verify
- [ ] Configure IDE settings from `.vscode/`
- [ ] Test auto-completion works
- [ ] Verify debugging works

## 🔍 Troubleshooting by IDE

### Claude Code Issues

- Check MCP server is running
- Verify `__CLAUDE_CODE__.md` is accessible
- Ensure test commands are in PATH

### Cursor Issues

- Update to latest version
- Check Copilot++ is enabled
- Verify workspace settings

### Windsurf Issues

- Ensure Cascade is activated
- Check Flow permissions
- Verify multi-file operations

### VS Code Issues

- Install Playwright extension
- Check Jest extension
- Verify debug configurations

## 📈 Testing Metrics Dashboard

All IDEs should report to:

```
test-results/
├── coverage/           # Coverage reports
├── playwright-report/  # E2E results
├── screenshots/        # Failure screenshots
└── metrics.json        # Performance metrics
```

## 🎯 Universal Best Practices

1. **ALWAYS** use Page Object Model
2. **NEVER** hardcode test data
3. **ALWAYS** tag tests appropriately
4. **NEVER** mix test layers
5. **ALWAYS** follow naming conventions
6. **NEVER** skip documentation

## 🚨 Critical Rules for ALL IDEs

```javascript
// THIS IS LAW
const RULES = {
  structure: "MUST follow numbered directories",
  pageObjects: "MUST use for ALL E2E tests",
  factories: "MUST use for ALL test data",
  naming: "MUST be [feature].[layer].test.ts",
  timeouts: "MUST use config values",
  tags: "MUST include priority and type",
};
```

---

Version: 1.0.0
Last Updated: 2024
Maintained by: Matthew Adam Carpenter
Status: AUTHORITATIVE for ALL IDEs
