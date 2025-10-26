# Code Quality Guide

Automated quality checks, linting, formatting, and pre-commit hooks for SIAM.

## Pre-Commit Linting

**AUTOMATIC QUALITY CHECKS**: ESLint and Prettier run automatically on every commit!

### How It Works

When you commit code, Husky triggers `lint-staged` which:

1. **Runs ESLint** on all staged `.js`, `.jsx`, `.ts`, `.tsx` files
   - Auto-fixes issues where possible (formatting, simple errors)
   - Uses `--max-warnings=0` (warnings block commits)
   - Catches unused variables, type errors, code quality issues

2. **Runs Prettier** on all staged files
   - Formats code to project standards
   - Ensures consistent style across codebase

3. **Blocks the commit** if unfixable errors exist
   - You must fix the issues before committing
   - Prevents broken code from reaching PRs

## Manual Lint Checks

### Check for Issues

```bash
npm run lint:check       # Check both linting and formatting (no changes)
npm run lint:quick       # Fast check with helpful output
npm run format:check     # Check Prettier formatting only
npm run lint             # Check ESLint only
```

### Check Specific Files

```bash
npm run lint:file src/components/MyComponent.tsx
npm run lint:file src/app/
```

### Auto-Fix Issues

```bash
npm run lint:fix-all     # Fix both linting and formatting
npm run lint:fix         # Fix ESLint issues only
npm run format           # Fix Prettier formatting only
```

## Claude Code Workflow

**MANDATORY**: When Claude writes code, Claude MUST run lint checks before committing!

### After Writing/Editing TypeScript/JavaScript Files

```bash
# Option 1: Check specific files you just edited
npm run lint:file src/components/NewComponent.tsx

# Option 2: Run quick check on all files
npm run lint:quick

# If issues found, auto-fix:
npm run lint:fix-all

# Then commit
git add . && git commit -m "your message"
```

### Recommended Claude Workflow

1. ✍️ Write/edit code using Edit, Write, or NotebookEdit tools
2. 🔍 **CRITICAL**: Run `npx prettier --check .` to catch formatting issues
3. 🔧 If Prettier issues found, run `npx prettier --write .` to fix
4. ✅ Verify formatting with `npx prettier --check .` again
5. 💾 Commit the code with `git add . && git commit -m "message"`

**NEVER skip step 2-4!** Prettier failures block PRs and waste time.

### Alternative (Faster for Single Files)

```bash
# After editing a specific file
npx prettier --write src/components/NewComponent.tsx
git add . && git commit -m "your message"
```

## What Gets Caught

### ESLint Errors (Block Commit)

- `no-var` - Using `var` instead of `const`/`let`
- `react-hooks/rules-of-hooks` - Invalid React Hook usage
- `@next/next/no-img-element` - Using `<img>` instead of Next.js `<Image>`
- `@next/next/no-html-link-for-pages` - Using `<a>` instead of Next.js `<Link>`

### ESLint Warnings (Block Commit with --max-warnings=0)

- `@typescript-eslint/no-unused-vars` - Unused variables/imports
- `react-hooks/exhaustive-deps` - Missing dependencies in hooks
- `prefer-const` - Variable that should be `const`
- `no-debugger` - Debugger statements

### Prettier Formatting

- Semicolons, quotes, line length, indentation, etc.
- All formatting is auto-fixed

### MAC Design System Compliance (NEW - Blocks Commit)

- Hardcoded colors (must use `--mac-*` CSS variables)
- Non-8px spacing grid violations (gap-1/3/5/7, p-1/3/5/7, etc.)
- Invalid font weights (only 100-400 allowed, blocks font-bold/semibold/etc.)

**Manual MAC compliance checks:**

```bash
npm run mac:check         # Check staged files (used by pre-commit hook)
npm run mac:check-all     # Check all source files
```

## Pre-PR Quality Checks

**AUTOMATIC ENFORCEMENT**: All code quality checks run automatically before every push!

### What Runs Automatically (Pre-Push Hook)

Every time you push code, the following checks run automatically:

**Phase 1: Code Quality Checks** (Fast - ~30 seconds)
1. **Merge Conflict Detection** - Prevents pushing code with conflict markers
2. **Prettier Formatting** - Ensures consistent code style across the project
3. **ESLint Linting** - Catches potential bugs and enforces best practices

**Phase 2: Test Suite** (Slower - depends on branch)
- **Feature branches**: Smoke tests (~2 minutes)
- **Main/Develop branches**: Critical tests (~5 minutes)

### Manual Pre-PR Check

```bash
npm run pre-pr-check
```

This runs:
- `npm run format:check` - Prettier validation
- `npm run lint` - ESLint validation
- `git diff --check` - Merge conflict detection

### Quick Fixes for Common Issues

**Formatting Issues:**
```bash
npm run format          # Auto-fix all formatting issues
git add .              # Stage the fixes
git commit -m "fix: apply prettier formatting"
```

**Linting Issues:**
```bash
npm run lint:fix       # Auto-fix fixable lint issues
npm run lint           # Check remaining issues
```

**Merge Conflicts:**
```bash
git status             # See which files have conflicts
# Manually resolve conflicts in your editor
git add .              # Stage resolved files
git commit             # Complete the merge
```

## Bypassing Hooks

### Pre-Commit Hook Bypass (NOT RECOMMENDED)

Only in emergencies:

```bash
git commit --no-verify -m "emergency fix"
```

**IMPORTANT**: CI/CD will still catch these errors, so fix them ASAP.

### Pre-Push Hook Bypass (NOT RECOMMENDED)

If absolutely necessary (e.g., documentation-only changes):

```bash
git push --no-verify
```

**⚠️ WARNING**: Only use this when you're certain the code quality issues won't break production!

## Configuration Files

- `.husky/pre-commit` - Git hook that runs lint-staged
- `.husky/pre-push` - Main pre-push hook script
- `package.json` (lint-staged section) - Defines what runs on staged files
- `.eslintrc.json` - ESLint rules configuration
- `.prettierrc` - Prettier formatting configuration

## ESLint Configuration

### Rules Overview

**React Rules:**
- `react-hooks/rules-of-hooks: error` - Enforce Hook rules
- `react-hooks/exhaustive-deps: warn` - Verify Hook dependencies
- `@next/next/no-img-element: error` - Use Next.js Image component
- `@next/next/no-html-link-for-pages: error` - Use Next.js Link component

**TypeScript Rules:**
- `@typescript-eslint/no-unused-vars: warn` - No unused variables
- `@typescript-eslint/no-explicit-any: warn` - Avoid any type

**General Rules:**
- `no-var: error` - No var keyword
- `prefer-const: warn` - Use const when possible
- `no-debugger: warn` - No debugger statements

### Custom Rules

Add custom rules in `.eslintrc.json`:

```json
{
  "rules": {
    "custom-rule-name": "error"
  }
}
```

## Prettier Configuration

### Current Settings

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "always"
}
```

### Customization

Edit `.prettierrc` to change formatting preferences.

## TypeScript Quality

See [TypeScript Guidelines](TYPESCRIPT-GUIDELINES.md) for comprehensive TypeScript quality standards.

Quick reference:

```bash
# Type check
npm run type-check

# Check errors in YOUR changed files only
git diff --name-only main...HEAD | xargs npm run type-check
```

## Reference

- **TypeScript Guidelines**: See [TYPESCRIPT-GUIDELINES.md](TYPESCRIPT-GUIDELINES.md)
- **Testing Strategy**: See [TESTING-STRATEGY.md](TESTING-STRATEGY.md)
- **Git Workflow**: See [GIT-WORKFLOW.md](GIT-WORKFLOW.md)

---

*For quick reference, see [QUICK-START.md](../QUICK-START.md)*
