# Performance Optimization Guide

## Overview

This document outlines the performance optimizations implemented in SIAM and how to use them effectively.

## Bundle Analysis

### Running Bundle Analyzer

Analyze your bundle size to identify optimization opportunities:

```bash
npm run build:analyze
```

This will generate an interactive HTML report showing:

- Bundle sizes by page
- Which packages contribute most to bundle size
- Duplicate dependencies
- Unused code

The report will automatically open in your browser after the build completes.

### Bundle Size Targets

**Target bundle sizes:**

- First Load JS: < 250 KB (Critical)
- Route chunks: < 100 KB each
- Total JavaScript: < 500 KB

## Code Splitting

### Automatic Route-Based Splitting

Next.js automatically splits code by route. Each page in `app/` becomes its own chunk:

```
app/
  page.tsx          → Main page chunk
  login/page.tsx    → Login chunk
  gpt5-chat/page.tsx → Chat chunk
```

### Dynamic Imports for Heavy Components

Use `React.lazy()` and `dynamic()` for large components:

```typescript
// ✅ Good - Component loads on demand
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div>Loading...</div>,
  ssr: false // Optional: disable SSR for client-only components
});

// ❌ Bad - Component loads immediately
import { HeavyComponent } from './HeavyComponent';
```

### Currently Implemented Dynamic Imports

1. **ChatPage** (`app/page.tsx:15`)
   - Heavy component with chat interface
   - Loaded on demand after authentication

## TypeScript Strict Mode

### Enabled Checks

```json
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true
}
```

### Running Type Checks

```bash
# Check types without building
npm run type-check

# Fix auto-fixable issues
npm run lint:fix
```

## ESLint Enforcement

### Build-Time Checks

- **Development**: ESLint warnings shown but don't block builds
- **Production**: ESLint errors block builds to prevent shipping broken code

### Running Linter

```bash
# Check for issues
npm run lint

# Auto-fix issues
npm run lint:fix
```

## Web Vitals Monitoring

### What We Track

Core Web Vitals metrics are automatically captured:

- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1
- **TTFB** (Time to First Byte): < 600ms
- **INP** (Interaction to Next Paint): < 200ms

### Viewing Web Vitals

1. **Development**: Check browser console for real-time metrics
2. **Production**: Metrics sent to `/api/web-vitals` endpoint

### Example Output

```
[Web Vitals] LCP: {
  value: 1834,
  rating: 'good',
  delta: 1834
}
```

## Production Optimizations

### Automatic Optimizations

These are automatically enabled in production builds:

1. **SWC Minification**: Faster, better minification than Terser
2. **Console Removal**: `console.log` calls removed (except `error`/`warn`)
3. **Image Optimization**: AVIF/WebP formats with automatic sizing
4. **Tree Shaking**: Unused code automatically removed

### Build Commands

```bash
# Development build (faster, includes debug info)
npm run dev

# Production build (optimized, minified)
npm run build

# Production build with bundle analysis
npm run build:analyze
```

## Performance Best Practices

### 1. Import Only What You Need

```typescript
// ✅ Good - Tree-shakeable
import { Button } from "@/components/ui/button";

// ❌ Bad - Imports entire library
import * as UI from "@/components/ui";
```

### 2. Use Image Component

```typescript
// ✅ Good - Optimized images
import Image from 'next/image';
<Image src="/logo.png" width={200} height={100} alt="Logo" />

// ❌ Bad - Unoptimized images
<img src="/logo.png" alt="Logo" />
```

### 3. Lazy Load Heavy Dependencies

```typescript
// ✅ Good - Loads on demand
const Chart = dynamic(() => import('recharts'), {
  ssr: false,
  loading: () => <div>Loading chart...</div>
});

// ❌ Bad - Always loaded
import { Chart } from 'recharts';
```

### 4. Avoid Large Dependencies

Before adding a new package, check its size:

```bash
# Check package size
npx bundle-phobia [package-name]

# Example
npx bundle-phobia moment
# Result: 288 KB (minified)

# Better alternative
npx bundle-phobia date-fns
# Result: 78 KB (minified)
```

## Monitoring Performance

### Local Development

1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Run performance audit
4. Target: Score > 90

### Production Monitoring

- Web Vitals data sent to `/api/web-vitals`
- Can be integrated with analytics services:
  - Google Analytics
  - Vercel Analytics
  - Custom dashboard

## Troubleshooting

### Large Bundle Size

1. Run `npm run build:analyze`
2. Identify large dependencies
3. Consider alternatives or lazy loading
4. Check for duplicate dependencies

### Slow Page Load

1. Check Web Vitals in console
2. Look for large images (use `next/image`)
3. Review dynamic imports
4. Enable production optimizations

### TypeScript Errors

1. Run `npm run type-check`
2. Fix errors one by one
3. Use `// @ts-expect-error` sparingly
4. Update types as needed

## Performance Checklist

Before deploying:

- [ ] Run `npm run build:analyze` - Check bundle sizes
- [ ] Run `npm run type-check` - Fix TypeScript errors
- [ ] Run `npm run lint` - Fix linting issues
- [ ] Run `npm run test:e2e` - Verify functionality
- [ ] Check Lighthouse score > 90
- [ ] Verify Web Vitals in console

## Removed Dependencies

The following unused dependencies were removed to reduce bundle size:

- `@icons-pack/react-simple-icons` (unused)
- `@magnusrodseth/shadcn-mcp-server` (unused)
- `html2canvas` (unused)
- `jotai` (unused state management)
- `localforage` (unused storage)
- `vaul` (unused drawer component)
- `victory-vendor` (unused chart library)

**Estimated bundle size reduction**: ~150 KB

## Next Steps

Future optimization opportunities:

1. **Server Components**: Convert more components to RSC
2. **Streaming**: Implement streaming SSR for faster TTFB
3. **Partial Prerendering**: Use PPR for hybrid rendering
4. **Image CDN**: Consider image CDN for faster delivery
5. **Edge Functions**: Move API routes to edge for lower latency

## Resources

- [Next.js Performance Docs](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web Vitals Guide](https://web.dev/vitals/)
- [Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)
- [Lighthouse Docs](https://developers.google.com/web/tools/lighthouse)
