# Claude Code (Cline) Testing Rules for SIAM

## 🎯 Testing Architecture Overview

### Directory Structure (MEMORIZE THIS)

```
tests/
├── __TESTING_RULES__.md      ← START HERE ALWAYS
├── __CLAUDE_CODE__.md        ← Claude Code specific
├── 01-unit/                  ← Fast tests (5s)
├── 02-integration/           ← API tests (15s)
├── 03-e2e/                   ← Browser tests (30s)
├── __pages__/                ← Page Objects (REQUIRED)
└── __fixtures__/             ← Test Factories
```

## 🚀 Quick Commands for Claude Code

When user says → You execute:

```bash
"test this"        → npm run test:smoke
"test chat"        → npm run test:feature -- chat
"quick test"       → npm run test:smoke
"test everything"  → npm run test:regression
"fix test"         → npm run test:debug -- [failing-test]
"make a test"      → Create using template below
```

## 📝 Test Creation Template (USE EXACTLY)

```typescript
/**
 * @feature [FeatureName]
 * @priority p0
 * @tags smoke, regression
 */
import { test, expect } from '@playwright/test';
import { [Feature]Page } from '../../__pages__';
import { TestFactory } from '../../__fixtures__';

test.describe('[FEATURE] [FeatureName]', () => {
  let page: [Feature]Page;

  test.beforeEach(async ({ page: pwPage }) => {
    page = new [Feature]Page(pwPage);
    await page.navigate();
  });

  test('[MUST] do critical action @smoke', async () => {
    // Arrange
    const data = TestFactory.createData();

    // Act
    await page.performAction(data);

    // Assert
    await expect(page.getResult()).toBe(expected);
  });
});
```

## 🏭 Page Object Model (MANDATORY)

### NEVER write selectors in tests:

```typescript
// ❌ WRONG - Never do this
await page.click(".submit-btn");

// ✅ CORRECT - Always use page objects
await chatPage.sendMessage("Hello");
```

### Page Object Template:

```typescript
export class [Feature]Page extends BasePage {
  private selectors = {
    input: '[data-testid="input"]',
    button: '[data-testid="button"]'
  };

  async performAction(data: any): Promise<void> {
    await this.page.fill(this.selectors.input, data);
    await this.page.click(this.selectors.button);
  }
}
```

## 🎯 Selector Strategy (IN ORDER)

1. `[data-testid="..."]` - BEST
2. `[role="..."]` - GOOD
3. `[aria-label="..."]` - OK
4. `text=...` - FALLBACK
5. `.class`, `#id` - AVOID

## 🏷️ Test Tagging Rules

### Priority (REQUIRED):

- `@p0` - Blocks deployment
- `@p1` - Fix in 24 hours
- `@p2` - Fix this sprint
- `@p3` - Nice to have

### Execution:

- `@smoke` - Every commit (2 min)
- `@regression` - Before deploy (30 min)
- `@nightly` - Overnight runs

## 🔧 Test Execution Commands

```bash
# By layer
npm run test:unit          # Fast components
npm run test:integration   # API tests
npm run test:e2e          # Browser tests

# By tag
npm run test:smoke        # Critical only
npm run test:regression   # Full suite

# Smart execution
npm run test:changed      # Only changed
npm run test:failed       # Re-run failures

# Debug
npm run test:debug        # Debug mode
npm run test:ui           # Playwright UI
```

## 📊 Test Data Factory

### NEVER hardcode data:

```typescript
// ❌ WRONG
const email = "test@example.com";

// ✅ CORRECT
const user = TestFactory.createUser();
const file = TestFactory.createFile();
```

## 🐛 Debugging Failed Tests

1. Check page object selectors
2. Verify test data validity
3. Check timing/timeout issues
4. Review console errors
5. Screenshot at failure point

## 📁 File Naming Convention

ALWAYS: `[feature].[layer].test.ts`

- `chat.unit.test.ts`
- `chat.integration.test.ts`
- `chat.e2e.test.ts`

## ⚡ Performance Rules

- Unit tests: < 5 seconds
- Integration: < 15 seconds
- E2E tests: < 30 seconds
- Smoke suite: < 2 minutes
- Full regression: < 30 minutes

## 🚫 NEVER DO THIS

1. ❌ Tests outside organized structure
2. ❌ Raw selectors in test files
3. ❌ Mixed test types (unit + e2e)
4. ❌ Hardcoded test data
5. ❌ Arbitrary timeouts
6. ❌ Tests without tags

## ✅ ALWAYS DO THIS

1. ✅ Use Page Object Model
2. ✅ Use Test Factories
3. ✅ Follow naming convention
4. ✅ Tag with priority
5. ✅ Use config timeouts
6. ✅ Group by feature

## 📈 Test Results Location

```
test-results/
├── playwright-report/    # HTML reports
├── coverage/            # Coverage data
├── screenshots/         # Failures
└── metrics.json        # Performance
```

## 🎯 Claude Code Intelligence

When working on:

- Component → Create unit test in `01-unit/`
- API endpoint → Create integration test in `02-integration/`
- User flow → Create E2E test in `03-e2e/`
- UI changes → Add visual test in `04-visual/`

## 🔄 Test Workflow

1. Write/modify code
2. Claude Code suggests test
3. Generate test with template
4. Run `npm run test:changed`
5. Fix any failures
6. Run `npm run test:smoke`
7. Commit when green

---

Priority: CRITICAL for Claude Code
Source: tests/**TESTING_RULES**.md
Last Updated: 2024
