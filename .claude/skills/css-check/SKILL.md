---
name: css-check
description: Validate CSS in a component or file against MAC Design System rules. Use when building or reviewing UI components to ensure they don't use hardcoded colors and follow design system patterns. Triggers on phrases like "check css", "validate design system", "css compliance".
allowed-tools: Bash(grep:*), Read, Grep
---

# CSS Design System Compliance Checker

Validates that CSS follows MAC Design System rules - no hardcoded colors, uses proper variables.

## When to Use

- After creating or modifying a UI component
- When reviewing CSS for design system compliance
- Before marking UI work as complete

## Validation Rules

### FORBIDDEN Patterns (Must Fix)

```tsx
// Hardcoded borders - NEVER USE
border-zinc-*      // Use: border-border
border-gray-*      // Use: border-border
border-[#...]      // Use: border-border or border-[var(--mac-border)]

// Hardcoded backgrounds - NEVER USE
bg-zinc-*          // Use: bg-background or mac-card-static
bg-gray-*          // Use: bg-background
bg-[#...]          // Use: CSS variable

// Hardcoded text colors
text-gray-*        // Use: text-foreground or text-muted-foreground
text-zinc-*        // Use: text-foreground or text-muted-foreground
```

### ALLOWED Patterns

```tsx
// Design system classes
border-border           // Tailwind config: rgba(255,255,255,0.08)
border-input            // Tailwind config: rgba(255,255,255,0.12)
bg-background           // CSS variable
text-foreground         // CSS variable
text-muted-foreground   // CSS variable
mac-card-static         // MAC Design System class
mac-button-primary      // MAC Design System class

// CSS variables
border-[var(--mac-border)]
bg-[var(--mac-surface-bg)]
```

## Workflow

1. If given a file path, check that specific file
2. If no path given, run full project check
3. Report violations with fix suggestions
4. Pass = no critical violations

## Commands

```bash
# Check specific file
grep -E "border-zinc-|border-gray-|bg-zinc-|bg-gray-" path/to/file.tsx

# Check full project
npm run lint:design-system
```

## Output

For each violation found:
1. File path and line
2. The violation pattern
3. Suggested fix using design system equivalent
