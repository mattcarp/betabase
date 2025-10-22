# 🚨 TESTING RULES FOR AI ASSISTANTS (PRIORITY: CRITICAL)

## THIS FILE CONTROLS HOW ALL AI ASSISTANTS WORK WITH TESTS

### 🎯 When User Says...

| User Says         | You Should                                            |
| ----------------- | ----------------------------------------------------- |
| "test this"       | Run the most specific test for the current file       |
| "test login"      | Run: `npm run test:feature -- login`                  |
| "quick test"      | Run: `npm run test:smoke` (2 min max)                 |
| "test everything" | Run: `npm run test:regression`                        |
| "fix the test"    | 1. Read error 2. Check page object 3. Update selector |
| "make a test"     | Use the EXACT template below                          |

## 📁 WHERE TESTS LIVE (MEMORIZE THIS)

```
tests/
├── 01-unit/        → Fast component tests (5s timeout)
├── 02-integration/ → API & service tests (15s timeout)
├── 03-e2e/        → User journey tests (30s timeout)
├── __pages__/     → Page Objects (REQUIRED for E2E)
├── __fixtures__/  → Test data factories
└── __utils__/     → Shared helpers
```

## 🏗️ TEST CREATION TEMPLATE (COPY EXACTLY)

```typescript
/**
 * @feature [FeatureName]
 * @priority p0|p1|p2
 * @tags smoke, regression
 */
import { test, expect } from '@playwright/test';
import { [Feature]Page } from '../__pages__';
import { TestFactory } from '../__fixtures__';

test.describe('[FEATURE] [FeatureName]', () => {
  let page: [Feature]Page;

  test.beforeEach(async ({ page: pwPage }) => {
    page = new [Feature]Page(pwPage);
    await page.navigate();
  });

  test('[MUST] do something critical @smoke', async () => {
    // Arrange
    const data = TestFactory.create[DataType]();

    // Act
    await page.doAction(data);

    // Assert
    await expect(page.getResult()).toBe(expected);
  });
});
```

## 🏭 PAGE OBJECT TEMPLATE (NEVER USE RAW SELECTORS)

```typescript
// tests/__pages__/[Feature]Page.ts
import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class [Feature]Page extends BasePage {
  private selectors = {
    input: '[data-testid="[feature]-input"]',
    button: '[data-testid="[feature]-button"]',
    result: '[data-testid="[feature]-result"]'
  };

  constructor(page: Page) {
    super(page);
  }

  async doAction(data: any): Promise<void> {
    await this.page.fill(this.selectors.input, data);
    await this.page.click(this.selectors.button);
  }

  async getResult(): Promise<string> {
    return this.page.textContent(this.selectors.result);
  }
}
```

## ⚡ QUICK COMMANDS (USE THESE EXACTLY)

```bash
# Run tests by layer
npm run test:unit          # Components only
npm run test:integration   # APIs only
npm run test:e2e          # User flows only

# Run tests by tag
npm run test:smoke        # Critical paths (2 min)
npm run test:regression   # Full suite (30 min)

# Run specific feature
npm run test:feature -- login
npm run test:feature -- chat
npm run test:feature -- upload

# Debug mode
npm run test:debug -- [testfile]
npm run test:ui           # Open Playwright UI
```

## 🚫 NEVER DO THIS

1. ❌ Put tests in root directory
2. ❌ Use hardcoded selectors in tests
3. ❌ Mix test types (unit logic in e2e)
4. ❌ Hardcode test data
5. ❌ Use arbitrary timeouts
6. ❌ Create tests without tags

## ✅ ALWAYS DO THIS

1. ✅ Use Page Object Model
2. ✅ Use data factories
3. ✅ Follow naming: `[feature].[type].test.ts`
4. ✅ Tag with @smoke for critical
5. ✅ Use config timeouts
6. ✅ Group by feature

## 🔍 SELECTOR STRATEGY (IN ORDER)

1. `[data-testid="..."]` - BEST
2. `[aria-label="..."]` - GOOD
3. `text=...` - OKAY
4. `#id` - AVOID
5. `.class` - NEVER

## 📊 TEST LAYERS EXPLAINED

### Unit Tests (01-unit/)

- Test single components/functions
- No external dependencies
- Mock everything
- Run in < 5 seconds
- Example: Button component renders

### Integration Tests (02-integration/)

- Test component interactions
- Real API calls allowed
- Database can be used
- Run in < 15 seconds
- Example: Login flow with API

### E2E Tests (03-e2e/)

- Test complete user journeys
- Full browser automation
- Real backend required
- Run in < 30 seconds
- Example: User uploads file and chats

## 🏷️ TAGGING RULES

### Priority Tags (REQUIRED)

- `@p0` - Blocks deployment
- `@p1` - Fix in 24 hours
- `@p2` - Fix this sprint
- `@p3` - Nice to have

### Execution Tags

- `@smoke` - Every commit
- `@regression` - Before deploy
- `@nightly` - Overnight run
- `@flaky` - Unreliable test

## 🎯 IDE INTEGRATION

### VSCode Settings (Auto-applied)

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  },
  "playwright.reuseBrowser": true,
  "playwright.showTrace": true
}
```

### File Associations

- `*.test.ts` → Test file
- `*.page.ts` → Page object
- `*.factory.ts` → Data factory

---

REMEMBER: This file is the SINGLE SOURCE OF TRUTH for testing.
When in doubt, follow these rules EXACTLY.
