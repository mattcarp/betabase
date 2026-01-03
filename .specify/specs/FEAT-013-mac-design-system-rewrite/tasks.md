# Tasks: MAC Design System Rewrite

**Feature**: FEAT-013-mac-design-system-rewrite
**Created**: 2026-01-03
**Status**: Complete

## Task List

### Phase 1: Token Foundation

- [x] Create `/src/styles/tokens/colors.css` with teal palette
- [x] Create `/src/styles/tokens/typography.css` with Inter font
- [x] Update mac-design-system.css to import tokens

### Phase 2: Tailwind Configuration

- [x] Update `tailwind.config.js` primary colors to teal (#26c6da)
- [x] Update `tailwind.config.js` accent colors to teal (#00bcd4)
- [x] Update `tailwind.config.js` shadow/glow to teal
- [x] Update `tailwind.config.js` font-family to Inter

### Phase 3: Global Styles

- [x] Update `globals.css` HSL variables to teal (hue 187)
- [x] Add teal color tokens to dark mode section

### Phase 4: Component Updates

- [x] Update `response.tsx` h1-h6 components with `text-primary`
- [x] Update `response.tsx` inline code styling with teal theme
- [x] Update `code-block.tsx` default theme to `catppuccin-mocha`
- [x] Update `code-block.tsx` remove hardcoded zinc colors

### Phase 5: Font Integration

- [x] Add Inter font import in `layout.tsx` via `next/font/google`
- [x] Apply `inter.variable` class to html element
- [x] Apply `font-sans` class to body element

### Phase 6: Configuration

- [x] Add `outputFileTracingRoot` to `next.config.js`

### Phase 7: Documentation

- [x] Create spec at `.specify/specs/FEAT-013-mac-design-system-rewrite/spec.md`
- [x] Create plan at `.specify/specs/FEAT-013-mac-design-system-rewrite/plan.md`
- [x] Create tasks at `.specify/specs/FEAT-013-mac-design-system-rewrite/tasks.md`

## Completion Summary

All tasks completed. The MAC Design System has been rewritten with:
- Teal color palette (#26c6da, #00bcd4, #0097a7)
- Inter font as primary typeface
- Teal-colored response headings
- Catppuccin Mocha code block theme
- Teal-themed inline code styling
- Clean token architecture in `/src/styles/tokens/`
