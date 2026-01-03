# Implementation Plan: MAC Design System Rewrite

**Feature**: FEAT-013-mac-design-system-rewrite
**Created**: 2026-01-03
**Status**: Complete

## Overview

Complete rewrite of the MAC Design System to:
1. Replace blue/purple color scheme with teal palette
2. Add Inter font as primary typeface
3. Update response component with teal headings
4. Update code blocks to use Catppuccin Mocha theme
5. Establish clean token architecture

## Architecture Approach

**Selected**: Clean Token System Architecture

### Token Hierarchy

```
/src/styles/tokens/
├── colors.css       # Single source of truth for all colors
└── typography.css   # Font definitions and type scale

/src/styles/
└── mac-design-system.css  # Imports tokens + component styles

/src/app/
└── globals.css      # Base styles using tokens
```

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| --mac-teal-400 | #26c6da | Primary accent, headings |
| --mac-teal-500 | #00bcd4 | Interactive elements |
| --mac-teal-700 | #0097a7 | Darker accents |

## Implementation Steps

### Phase 1: Token Foundation
1. Create `/src/styles/tokens/colors.css` with full teal palette
2. Create `/src/styles/tokens/typography.css` with Inter font
3. Update imports in `mac-design-system.css`

### Phase 2: Tailwind Configuration
1. Update `tailwind.config.js` primary colors to teal
2. Update accent colors to teal shades
3. Update shadow/glow effects to use teal

### Phase 3: Global Styles
1. Update `globals.css` HSL variables for teal
2. Add teal tokens to dark mode

### Phase 4: Component Updates
1. Update `response.tsx` headings to use `text-primary` (now teal)
2. Update inline code styling with teal theme
3. Update `code-block.tsx` to use Catppuccin Mocha

### Phase 5: Font Integration
1. Add Inter font via `next/font/google` in `layout.tsx`
2. Apply font class to html/body elements

## Files Modified

- `/src/styles/tokens/colors.css` (created)
- `/src/styles/tokens/typography.css` (created)
- `/tailwind.config.js` (updated)
- `/src/styles/mac-design-system.css` (updated)
- `/public/styles/mac-design-system.css` (updated)
- `/src/app/globals.css` (updated)
- `/src/components/ai-elements/response.tsx` (updated)
- `/src/components/ui/code-block.tsx` (updated)
- `/src/app/layout.tsx` (updated)
- `/next.config.js` (updated - added outputFileTracingRoot)

## Testing

- Visual inspection of teal theme across all pages
- Verify Inter font loads correctly
- Check response headings are teal
- Verify code blocks use Catppuccin Mocha
- Verify inline code has teal styling
