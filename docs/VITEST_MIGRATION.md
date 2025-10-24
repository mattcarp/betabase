# 🚀 Jest to Vitest Migration Guide for SIAM

## Why Migrate?

- **5X faster** test execution (131ms vs 739ms on Next.js apps)
- **Native ESM** support - no Babel transformation needed
- **Better DX** - built-in UI, HMR for tests
- **Smaller** - 61 dependencies vs Jest's 196
- **Modern** - Built for Vite/Next.js modern tooling

## Step 1: Install Vitest Dependencies

```bash
npm install -D vitest @vitest/ui @vitest/coverage-v8 jsdom @testing-library/jest-dom
```

## Step 2: Update package.json Scripts

Replace your Jest scripts with:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest watch"
  }
}
```

## Step 3: Files Created

✅ `vitest.config.ts` - Vitest configuration (already created)
✅ `tests/setup.vitest.ts` - Test setup (already created)
✅ `tests/vitest-demo.test.tsx` - Sample test (already created)

## Step 4: Update Existing Tests

Search and replace in your test files:

```typescript
// Change imports
- import { jest } from '@jest/globals'
+ import { vi } from 'vitest'

// Change mock functions
- jest.fn()
+ vi.fn()

- jest.mock('./module')
+ vi.mock('./module')

- jest.spyOn(object, 'method')
+ vi.spyOn(object, 'method')

// Timers are the same API
- jest.useFakeTimers()
+ vi.useFakeTimers()

// Environment setup stays similar
- setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
+ setupFiles: ['./tests/setup.vitest.ts']
```

## Step 5: Test It!

Run the demo test to verify everything works:

```bash
npm run test tests/vitest-demo.test.tsx
```

Expected output:
```
✓ tests/vitest-demo.test.tsx (4) 
  ✓ Vitest Integration Test (4)
    ✓ should render a button
    ✓ should call onClick when clicked
    ✓ should work with async operations
    ✓ should demonstrate Vitest speed

Test Files  1 passed (1)
     Tests  4 passed (4)
  Start at  [timestamp]
  Duration  131ms  ⚡
```

## Step 6: Migration Strategy

**Option A: Gradual** (Recommended)
1. Keep Jest for now
2. Write NEW tests in Vitest format
3. Migrate old tests file-by-file
4. Remove Jest when done

**Option B: Big Bang**
1. Install Vitest
2. Convert all tests at once
3. Remove Jest immediately

## Common Gotchas

### 1. Global Test Functions
Vitest can use globals, but you need to enable them:

```typescript
// vitest.config.ts
test: {
  globals: true  // ✅ Already set in our config
}
```

### 2. ESM Imports
Vitest uses ESM by default. If you have issues:
```typescript
// This works in Vitest
import { useState } from 'react'

// Don't need to do: 
// import * as React from 'react'
```

### 3. Next.js Mocks
Our setup already mocks Next.js modules. If you need more:
```typescript
vi.mock('next/navigation', () => ({
  // Add your custom mocks
}))
```

## Performance Comparison

**Your SIAM app** (estimated):

Jest:
- Startup: ~2-3 seconds
- Test execution: ~5-10 seconds
- Watch mode reload: ~2 seconds
- **Total cycle: ~7-15 seconds**

Vitest:
- Startup: ~300ms
- Test execution: ~1-2 seconds  
- Watch mode reload: ~100ms (HMR!)
- **Total cycle: ~1.5-2.5 seconds**

**5-7X faster development loop!**

## Next Steps

1. ✅ Run the demo test
2. Create tests for your components:
   - ChatInterface
   - CurateTab
   - Voice features
3. Migrate existing Jest tests gradually
4. Remove Jest when comfortable

## Bonus: Vitest UI

The best feature - visual test runner:

```bash
npm run test:ui
```

Opens a beautiful interface showing:
- Test tree
- Code coverage
- Failed tests with diffs
- Watch mode with instant refresh

*C'est magnifique!* 🎨
