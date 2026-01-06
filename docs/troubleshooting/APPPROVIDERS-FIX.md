# AppProviders "Cannot read properties of undefined" Fix

## Problem
Recurring runtime error in production and development:
```
Cannot read properties of undefined (reading 'call')
at RootLayout (src/app/layout.tsx:69:9)
```

This error occurred when Next.js tried to render `<AppProviders>{children}</AppProviders>` in the root layout.

## Root Causes Identified

### 1. Conflicting Provider Files
- **src/components/AppProviders.tsx** - Working provider (used in layout.tsx)
- **src/components/Providers.tsx** - Orphaned file referencing non-existent `ClientProviders`

The orphaned `Providers.tsx` was causing module resolution conflicts in Webpack.

### 2. Missing Default Export
The original AppProviders only had a named export, which could cause issues with certain bundling scenarios in Next.js 15.5.9.

### 3. Next.js Cache Issues
Stale build artifacts in `.next` and `node_modules/.cache` were preserving broken module references.

## Solution Applied

### Step 1: Remove Conflicting Files
```bash
rm src/components/Providers.tsx
```

### Step 2: Add Dual Exports
Updated `src/components/AppProviders.tsx` to export both named and default:

```tsx
"use client";

import React from "react";
import { ThemeProvider } from "../contexts/ThemeContext";

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  // Defensive check
  if (typeof children === 'undefined') {
    console.error('AppProviders received undefined children');
    return null;
  }

  return <ThemeProvider defaultTheme="mac">{children}</ThemeProvider>;
}

// Also export as default to prevent potential import issues
export default AppProviders;
```

### Step 3: Clear All Caches
```bash
rm -rf .next node_modules/.cache
```

### Step 4: Restart Dev Server
```bash
npm run dev
```

## Verification

### Unit Tests Pass
All 14 unit tests pass including:
- ✓ Named export verification
- ✓ Default export verification
- ✓ Both exports point to same component
- ✓ No circular dependencies
- ✓ "use client" directive present
- ✓ ThemeProvider dependency correct

### E2E Tests Pass
All 9 voice button color tests pass:
- ✓ All buttons visible in teal
- ✓ Microphone button turns red when recording
- ✓ Speaker button toggles correctly
- ✓ No hardcoded gray colors

### Server Compilation Success
```
✓ Compiled / in 49.9s (13388 modules)
GET / 200 in 52287ms
🎯 AiSdkChatPanel: Component mounted
🎤 Voice buttons should be rendering in PromptInputTools
🎤 STT Hook available
🔊 TTS Hook available
```

## Prevention

### 1. Always Use Dual Exports for Provider Components
```tsx
export function MyProvider() { ... }
export default MyProvider;
```

### 2. Clear Caches When Module Errors Occur
```bash
rm -rf .next node_modules/.cache && npm run dev
```

### 3. Run Unit Tests Before Committing
```bash
npm run test tests/unit/app-providers.test.tsx
```

### 4. Avoid Orphaned Provider Files
- Only keep one provider wrapper per purpose
- Delete unused provider files immediately
- Don't leave files that reference non-existent modules

## Related Files
- `src/components/AppProviders.tsx` - Main provider (KEEP)
- `src/app/layout.tsx` - Uses AppProviders
- `tests/unit/app-providers.test.tsx` - Unit tests (14 tests)
- `tests/e2e/regression/voice-button-colors.spec.ts` - E2E tests (9 tests)

## Status
✅ **FIXED** - Error no longer occurs as of 2026-01-06

## Maintainer Notes
If this error recurs:
1. Check for new provider files causing conflicts
2. Clear `.next` and `node_modules/.cache`
3. Verify dual exports are still present
4. Run unit tests to validate module resolution
