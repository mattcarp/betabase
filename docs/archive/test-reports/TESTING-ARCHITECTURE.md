# SIAM Testing Architecture & IDE Integration Guide

## 🎯 CRITICAL: IDE Discovery Rules

This document defines the AUTHORITATIVE testing structure for all AI assistants (Claude Code, Cursor, Windsurf, etc.)

### Quick IDE Commands
```bash
# Run specific test categories
npm run test:unit          # Fast unit tests only
npm run test:integration   # Integration tests
npm run test:e2e           # End-to-end tests
npm run test:smoke         # Critical path only (2 min)
npm run test:visual        # Visual regression tests

# Smart test selection
npm run test:changed       # Only test changed files
npm run test:related       # Test files related to changes
npm run test:failed        # Re-run failed tests only
```

## 📁 Canonical Directory Structure

```
tests/
├── __TESTING_RULES__.md     # IDE instructions (THIS IS CRITICAL)
├── 01-unit/                 # Fast, isolated tests
│   ├── components/          # React component tests
│   ├── hooks/              # Custom hook tests
│   ├── utils/              # Utility function tests
│   └── services/           # Service layer tests
│
├── 02-integration/         # Component interaction tests
│   ├── api/                # API endpoint tests
│   ├── auth/               # Auth flow tests
│   ├── data/               # Data layer tests
│   └── features/           # Feature integration
│
├── 03-e2e/                 # User journey tests
│   ├── smoke/              # Critical paths (@smoke)
│   ├── regression/         # Full regression (@regression)
│   ├── scenarios/          # Complex user scenarios
│   └── production/         # Production-only tests
│
├── 04-visual/              # Visual regression
│   ├── screenshots/        # Baseline images
│   ├── diffs/             # Visual differences
│   └── specs/             # Visual test specs
│
├── __fixtures__/           # Test data & mocks
│   ├── users.ts           # User factory
│   ├── data.ts            # Data factory
│   ├── mocks.ts           # API mocks
│   └── files/             # Test files
│
├── __pages__/              # Page Object Model
│   ├── BasePage.ts        # Base page class
│   ├── LoginPage.ts       # Login page object
│   ├── ChatPage.ts        # Chat page object
│   ├── CuratePage.ts      # Curate page object
│   └── index.ts           # Page exports
│
└── __utils__/              # Shared utilities
    ├── config.ts          # Test configuration
    ├── helpers.ts         # Helper functions
    ├── selectors.ts       # DOM selectors
    └── api-client.ts      # API test client
```

## 🤖 IDE Pattern Recognition Rules

### Test File Naming Convention (STRICT)
```typescript
// Pattern: [feature].[type].test.ts
login.unit.test.ts        // Unit test
login.integration.test.ts // Integration test  
login.e2e.test.ts         // End-to-end test
login.visual.test.ts      // Visual test

// AI assistants should ALWAYS follow this pattern
```

### Test Structure Template (MANDATORY)
```typescript
/**
 * @feature Authentication
 * @layer unit|integration|e2e|visual
 * @priority p0|p1|p2|p3
 * @tags smoke, regression, auth
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import { TestFactory } from '../__fixtures__';
import { LoginPage } from '../__pages__';

describe('[FEATURE] Authentication', () => {
  let page: LoginPage;
  
  beforeEach(() => {
    page = new LoginPage();
  });

  describe('[SCENARIO] Valid login flow', () => {
    it('[MUST] accept valid credentials', async () => {
      // Arrange
      const user = TestFactory.createUser();
      
      // Act
      await page.login(user.email, user.password);
      
      // Assert
      expect(await page.isLoggedIn()).toBe(true);
    });
  });
});
```

## 🏭 Test Factories (Page Object Model)

### Base Page Pattern
```typescript
// tests/__pages__/BasePage.ts
export abstract class BasePage {
  constructor(protected page: Page) {}
  
  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }
  
  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({ 
      path: `tests/04-visual/screenshots/${name}.png` 
    });
  }
}
```

### Feature Page Pattern
```typescript
// tests/__pages__/ChatPage.ts
export class ChatPage extends BasePage {
  // Selectors as private constants
  private readonly selectors = {
    input: '[data-testid="chat-input"]',
    sendButton: '[data-testid="send-button"]',
    messages: '[data-testid="message"]'
  };
  
  async sendMessage(text: string): Promise<void> {
    await this.page.fill(this.selectors.input, text);
    await this.page.click(this.selectors.sendButton);
  }
  
  async getLastMessage(): Promise<string> {
    const messages = this.page.locator(this.selectors.messages);
    return messages.last().textContent();
  }
}
```

## 📊 Test Configuration Hierarchy

### 1. Global Config (test.config.ts)
```typescript
export const TEST_CONFIG = {
  baseURL: process.env.TEST_URL || 'http://localhost:3000',
  timeout: {
    unit: 5000,
    integration: 15000,
    e2e: 30000,
    visual: 10000
  },
  retries: {
    unit: 0,
    integration: 1,
    e2e: 2,
    visual: 1
  },
  parallel: {
    unit: true,
    integration: true,
    e2e: false,
    visual: false
  }
};
```

### 2. Layer-Specific Configs
```typescript
// playwright.config.ts
import { TEST_CONFIG } from './tests/__utils__/config';

export default defineConfig({
  testDir: './tests',
  projects: [
    {
      name: 'unit',
      testMatch: '**/*.unit.test.ts',
      timeout: TEST_CONFIG.timeout.unit,
      retries: TEST_CONFIG.retries.unit
    },
    {
      name: 'e2e-smoke',
      testMatch: '**/*.e2e.test.ts',
      grep: /@smoke/,
      timeout: TEST_CONFIG.timeout.e2e
    }
  ]
});
```

## 🏷️ Test Tagging System

### Priority Levels
- `@p0` - Critical: Block deployment if failed
- `@p1` - High: Fix within 24 hours
- `@p2` - Medium: Fix within sprint
- `@p3` - Low: Nice to have

### Execution Tags
- `@smoke` - Run on every commit (< 2 min)
- `@regression` - Run before deployment (< 30 min)
- `@nightly` - Run in nightly builds
- `@manual` - Requires manual verification

### Feature Tags
- `@auth` - Authentication related
- `@chat` - Chat functionality
- `@upload` - File upload
- `@api` - API tests

## 🔄 Test Data Management

### Factory Pattern
```typescript
// tests/__fixtures__/users.ts
export class UserFactory {
  private static counter = 0;
  
  static create(overrides?: Partial<User>): User {
    this.counter++;
    return {
      email: `test-${this.counter}@siam.ai`,
      password: 'Test123!@#',
      name: `Test User ${this.counter}`,
      ...overrides
    };
  }
  
  static createAdmin(): User {
    return this.create({ role: 'admin' });
  }
}
```

## 📝 IDE Integration Instructions

### For Claude Code / Cursor / Windsurf
When working with tests, ALWAYS:

1. **Check test layer first**: Is this unit, integration, or e2e?
2. **Use appropriate timeout**: Unit=5s, Integration=15s, E2E=30s
3. **Follow naming convention**: `[feature].[layer].test.ts`
4. **Use Page Objects**: Never use raw selectors in tests
5. **Tag appropriately**: Add @smoke for critical paths
6. **Use factories**: Never hardcode test data

### VSCode Settings
```json
{
  "jest.rootPath": "./tests",
  "jest.testMatch": [
    "**/*.unit.test.ts",
    "**/*.integration.test.ts",
    "**/*.e2e.test.ts"
  ],
  "testing.automaticallyOpenPeekView": "never",
  "testing.defaultGutterClickAction": "debug"
}
```

## 🚀 Quick Test Commands for AI Assistants

```bash
# When user says "test the login"
npm run test:e2e -- --grep="login"

# When user says "run quick tests"
npm run test:smoke

# When user says "test everything"
npm run test:all

# When user says "test what I changed"
npm run test:changed

# When debugging a specific test
npm run test:debug -- login.e2e.test.ts
```

## ⚠️ CRITICAL RULES FOR AI ASSISTANTS

1. **NEVER** put test files in the root directory
2. **NEVER** mix test layers (unit tests with e2e logic)
3. **ALWAYS** use Page Object Model for E2E tests
4. **ALWAYS** use factories for test data
5. **ALWAYS** follow the naming convention
6. **NEVER** hardcode URLs or credentials
7. **ALWAYS** tag tests appropriately
8. **NEVER** use arbitrary timeouts - use config values

---
Last Updated: 2024
Maintained by: Matthew Adam Carpenter
