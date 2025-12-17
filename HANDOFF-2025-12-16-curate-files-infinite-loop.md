# Session Handoff - Curate Files Tab Infinite Loop Fix

## Current Task Status
**Task**: Fix "Maximum update depth exceeded" infinite loop on Curate > Files tab
**Status**: IN PROGRESS - Root cause identified, solution partially implemented but not yet working

## Problem Summary
When clicking on the Curate > Files tab, React throws "Maximum update depth exceeded" errors. The root cause is a React 19 + Radix UI compatibility issue in `@radix-ui/react-compose-refs`.

### Root Cause Analysis
1. React 19 changed how ref cleanup works - refs now return cleanup functions
2. Radix UI's `composeRefs` function uses `Array.map` to iterate over refs and call `setRef`
3. When a composed ref cleanup is triggered, it calls `setRef(ref, null)` for each ref
4. If any ref is itself a composed ref, this creates an infinite recursion: `setRef -> Array.map -> setRef -> Array.map -> ...`
5. React detects this as infinite state updates and throws the error

### Why This Only Affects Files Tab
Other tabs (Overview, Q8 Feedback) work fine. The Files tab has more deeply nested components and more refs being composed, triggering the issue.

## What Was Tried

### 1. Replaced Problematic Radix Components (Partial Success)
- Replaced `Select` with native HTML `<select>` - file: `src/components/ui/CleanCurateTab.tsx:1143-1155`
- Replaced `DropdownMenu` with inline buttons - file: `src/components/ui/CleanCurateTab.tsx:1277-1305`
- Replaced action `Button` components with plain `<button>` - same file
- **Result**: Issue persists because other Radix components (Tabs, TabsContent, Dialog, AlertDialog) also use compose-refs

### 2. pnpm Patch for compose-refs (Not Applied by Turbopack)
- Created patch file: `patches/@radix-ui__react-compose-refs@1.1.1.patch`
- Added recursion guard with `MAX_RECURSION_DEPTH = 10`
- Added to `package.json` pnpm config:
  ```json
  "patchedDependencies": {
    "@radix-ui/react-compose-refs@1.1.1": "patches/@radix-ui__react-compose-refs@1.1.1.patch"
  }
  ```
- **Result**: Patch is applied to some node_modules locations but NOT bundled by Turbopack

### 3. Direct node_modules Patching
- Found TWO versions of compose-refs in node_modules:
  - `/node_modules/.pnpm/@radix-ui+react-compose-refs@1.1.1_@types+react@19.1.12_react@19.2.3/...` (UNPATCHED)
  - `/node_modules/.pnpm/@radix-ui+react-compose-refs@1.1.1_patch_hash=.../...` (PATCHED)
- Manually copied patched file to unpatched location
- Cleared `.next` cache and restarted
- **Result**: Still not working - Turbopack has additional caching

## Next Steps to Try

### Option 1: Disable Turbopack (Quick Test)
Edit `package.json` dev script to use webpack instead:
```json
"dev": "lsof -ti:3000 | xargs kill -9 2>/dev/null || true && next dev -p 3000 --turbo=false"
```
Or check `next.config.js` for turbopack settings.

### Option 2: Create Local compose-refs Override
1. Create `src/lib/compose-refs.ts` with the patched implementation
2. Configure webpack/turbopack to alias `@radix-ui/react-compose-refs` to this local file
3. This bypasses the node_modules caching issue

### Option 3: Replace Radix Tabs with Custom Implementation
The Tabs component is the main culprit. Create a simple custom Tabs using React state instead of Radix.

### Option 4: Wait for Radix UI React 19 Fix
Check Radix UI GitHub issues for React 19 compatibility updates:
- https://github.com/radix-ui/primitives/issues

### Option 5: Downgrade React to 18.x (Last Resort)
If nothing else works, temporarily downgrade React version in package.json.

## Key Files

| File | Purpose |
|------|---------|
| `src/components/ui/CleanCurateTab.tsx` | Main component with the issue |
| `src/components/ui/tabs.tsx` | Radix Tabs wrapper (uses compose-refs) |
| `src/components/ui/button.tsx` | Button using Radix Slot (uses compose-refs) |
| `patches/@radix-ui__react-compose-refs@1.1.1.patch` | pnpm patch file |
| `package.json` | pnpm overrides and patch config |

## Console Error Stack Trace
```
at setRef (node_modules__pnpm_2e2ba0d2._.js:16:16)
at Array.map (<anonymous>)
at (node_modules__pnpm_2e2ba0d2._.js:24:31)
at setRef (node_modules__pnpm_2e2ba0d2._.js:16:16)
at Array.map (<anonymous>)
... (infinite recursion)
```

## Dev Server
- Running on port 3000
- Background task ID: `b9c54de`
- Output file: `/tmp/claude/tasks/b9c54de.output`

## Other Pending Tasks
- Test Smart Deduplication in UI (blocked by Files tab fix)

## Session Context
- Using Next.js 16.1.0-canary.28 with Turbopack
- React 19.2.3
- Radix UI RC versions: @radix-ui/react-select@2.2.7-rc, @radix-ui/react-dropdown-menu@2.1.17-rc
- pnpm package manager

---
*Last updated: 2025-12-16T07:30:00Z*
