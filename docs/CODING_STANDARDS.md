# SIAM Coding Standards

## Overview

This document outlines the coding standards and best practices for the SIAM project. All contributors should follow these guidelines to maintain code quality and consistency.

## Table of Contents

1. [File Naming Conventions](#file-naming-conventions)
2. [Code Style](#code-style)
3. [TypeScript Guidelines](#typescript-guidelines)
4. [React Best Practices](#react-best-practices)
5. [Testing Standards](#testing-standards)
6. [Error Handling](#error-handling)
7. [Documentation](#documentation)
8. [Git Workflow](#git-workflow)

## File Naming Conventions

### General Rules

- **Components**: Use PascalCase for React components
  - ✅ `UserProfile.tsx`, `ChatInterface.tsx`
  - ❌ `userProfile.tsx`, `chat-interface.tsx`

- **Utilities/Services**: Use camelCase for utility files and services
  - ✅ `apiClient.ts`, `errorLogger.ts`
  - ❌ `APIClient.ts`, `ErrorLogger.ts`

- **Tests**: Match the file being tested with `.spec.ts` or `.test.ts` suffix
  - ✅ `UserProfile.spec.tsx`, `apiClient.test.ts`
  - ❌ `test-user-profile.tsx`, `apiClientTests.ts`

- **CSS/Styles**: Use kebab-case for stylesheets
  - ✅ `mac-design-system.css`, `global-styles.css`
  - ❌ `MacDesignSystem.css`, `global_styles.css`

### No Backup Files

- **NEVER** commit backup files or numbered versions
  - ❌ `component_v1.tsx`, `file_backup.ts`, `style 2.css`
  - Use git for version control instead

## Code Style

### Formatting

We use Prettier for automatic code formatting. Configuration is in `.prettierrc`:

- **Print Width**: 100 characters
- **Indentation**: 2 spaces (no tabs)
- **Quotes**: Double quotes for strings
- **Semicolons**: Always use semicolons
- **Trailing Commas**: ES5 compatible
- **Line Endings**: LF (Unix style)

Run formatting before committing:

```bash
npm run format
```

### ESLint Rules

**Philosophy**: The ESLint config is intentionally relaxed to accommodate the existing codebase while still catching critical issues.

**Enforced rules** (will fail builds):

- **No `var`**: Use `const` or `let` instead (ERROR)
- **React hooks**: Must follow rules of hooks (ERROR)

**Warning rules** (won't block builds, but should be addressed):

- **Unused variables**: Clean up unused imports and variables (prefix with `_` if intentionally unused)
- **Prefer `const`**: Use `const` by default, `let` only when reassignment is needed
- **No debugger**: Remove debugger statements before committing
- **Duplicate imports**: Avoid importing the same module twice

**Disabled rules** (no enforcement):

- `console.log` - Allowed (use judgment)
- `any` types - Allowed (but avoid when possible)
- Complexity limits - No enforcement
- Function length limits - No enforcement
- Max nesting depth - No enforcement
- camelCase naming - No enforcement
- Line length - No enforcement (Prettier handles this)

## TypeScript Guidelines

### Type Annotations

```typescript
// ✅ Good - Explicit types for function parameters and returns
function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ✅ Good - Interface for object shapes
interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

// ⚠️ Acceptable but not ideal - Using `any`
function processData(data: any) {
  // TypeScript `any` is allowed but should be avoided when possible
  // ...
}

// ✅ Preferred - Use proper types or generics when practical
function processData<T extends Record<string, unknown>>(data: T) {
  // ...
}
```

### Naming Conventions

- **Variables/Functions**: camelCase

  ```typescript
  const userName = "John";
  function getUserProfile() {}
  ```

- **Classes/Interfaces/Types**: PascalCase

  ```typescript
  class UserService {}
  interface ApiResponse {}
  type RequestStatus = "pending" | "success" | "error";
  ```

- **Constants**: UPPER_SNAKE_CASE (for true constants)

  ```typescript
  const MAX_RETRY_ATTEMPTS = 3;
  const API_BASE_URL = "https://api.example.com";
  ```

- **Private class members**: Prefix with `_` or use `#` (private fields)
  ```typescript
  class Example {
    private _internalState: string;
    #privateField: number;
  }
  ```

## React Best Practices

### Component Structure

```typescript
// ✅ Good structure
import React, { useState, useEffect } from "react";
import { SomeType } from "@/types";
import { utilityFunction } from "@/utils";
import { ChildComponent } from "./ChildComponent";

interface Props {
  title: string;
  onAction: (id: string) => void;
}

export function MyComponent({ title, onAction }: Props) {
  // Hooks at the top
  const [state, setState] = useState<string>("");

  useEffect(() => {
    // Effect logic
  }, []);

  // Event handlers
  const handleClick = () => {
    onAction("example");
  };

  // Render
  return (
    <div>
      <h1>{title}</h1>
      <button onClick={handleClick}>Action</button>
    </div>
  );
}
```

### Hooks Rules

- Always use hooks at the top level (not inside conditions/loops)
- Use `useCallback` for functions passed as props
- Use `useMemo` for expensive computations
- Clean up side effects in `useEffect` return functions

### Client Components

For Next.js App Router:

```typescript
"use client"; // Only when needed (interactivity, hooks, browser APIs)

export function InteractiveComponent() {
  // Component using hooks or browser APIs
}
```

## Testing Standards

### Test File Organization

```typescript
import { expect, test, describe } from "@playwright/test";

describe("Feature Name", () => {
  test("should do something specific", async ({ page }) => {
    // Arrange
    await page.goto("/");

    // Act
    await page.click('button[data-testid="submit"]');

    // Assert
    await expect(page.locator(".result")).toBeVisible();
  });
});
```

### Test Naming

- Use descriptive test names: `"should display error message when API fails"`
- Group related tests with `describe` blocks
- Use `data-testid` attributes for test selectors (not classes or IDs)

### Coverage Requirements

- Aim for 80%+ code coverage
- All critical paths must have tests
- Test error scenarios, not just happy paths

## Error Handling

### Use Error Boundaries

Wrap major UI sections with error boundaries:

```typescript
import { ErrorBoundary } from "@/components/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary>
      <YourComponent />
    </ErrorBoundary>
  );
}
```

### Error Logging

Use the centralized error logger:

```typescript
import { errorLogger } from "@/services/errorLogger";

try {
  await riskyOperation();
} catch (error) {
  errorLogger.logError(error as Error, {
    severity: "high",
    context: { operation: "riskyOperation" },
  });
}
```

### User-Facing Errors

- Show user-friendly error messages
- Log technical details for debugging
- Provide actionable next steps when possible

## Documentation

### Code Comments

```typescript
// ✅ Good - Explains WHY, not WHAT
// Use exponential backoff to avoid overwhelming the API during outages
const retryDelay = Math.pow(2, attempt) * 1000;

// ❌ Bad - States the obvious
// Multiply by 1000
const retryDelay = Math.pow(2, attempt) * 1000;
```

### JSDoc for Public APIs

```typescript
/**
 * Fetches user profile data from the API.
 *
 * @param userId - The unique identifier of the user
 * @param options - Optional request configuration
 * @returns Promise resolving to the user profile
 * @throws {ApiError} When the API request fails
 *
 * @example
 * const profile = await getUserProfile("user123");
 */
export async function getUserProfile(
  userId: string,
  options?: RequestOptions
): Promise<UserProfile> {
  // Implementation
}
```

### README Files

- Every major feature/module should have a README
- Include setup instructions, usage examples, and troubleshooting
- Keep documentation up-to-date with code changes

## Git Workflow

### Commit Messages

Follow conventional commits format:

```
feat: add user authentication flow
fix: resolve memory leak in chat component
docs: update API documentation
refactor: simplify error handling logic
test: add tests for file upload
chore: update dependencies
```

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `refactor/description` - Code refactoring
- `docs/description` - Documentation updates

### Pull Requests

- Keep PRs focused and reasonably sized
- Write clear PR descriptions explaining the "why"
- Reference related issues/tickets
- Ensure all tests pass before requesting review
- Address review comments promptly

## Code Review Checklist

Before submitting code for review:

- [ ] Code follows naming conventions
- [ ] No backup files or debug code committed
- [ ] All tests pass locally
- [ ] Code is formatted (run `npm run format`)
- [ ] No ESLint errors (run `npm run lint`)
- [ ] Added tests for new functionality
- [ ] Updated documentation if needed
- [ ] No console.log statements (use proper logging)
- [ ] Error handling is implemented
- [ ] Performance considerations addressed

## Continuous Improvement

These standards are living documents. Suggestions for improvements are welcome via:

1. Team discussions
2. Pull requests to this document
3. Retrospectives

---

**Last Updated**: October 2025
**Version**: 1.0.0
