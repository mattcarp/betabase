# Firecrawl v2 API Migration Memory

**Date**: January 2025  
**Package**: `@mendable/firecrawl-js` v4.3.5  
**Status**: ACTIVE - Use v2 API patterns

## Critical v2 Changes

### 1. Method Name Changes (v1 → v2)

| v1 Method                 | v2 Method                   | Notes                      |
| ------------------------- | --------------------------- | -------------------------- |
| `crawlUrl(url, ...)`      | `crawl(url, options?)`      | Waiter method (auto-polls) |
| `asyncCrawlUrl(url, ...)` | `startCrawl(url, options?)` | Start job, manual polling  |
| `scrapeUrl(url, ...)`     | `scrape(url, options?)`     | Single page scrape         |
| `checkCrawlStatus(id)`    | `getCrawlStatus(id)`        | Get crawl job status       |

### 2. Configuration Structure Changes

**v1 (OLD - DON'T USE)**:

```typescript
{
  url: 'https://example.com',
  crawlerOptions: {
    includes: ['/docs/*'],
    excludes: ['/admin/*'],
    maxCrawlPages: 10,
    maxCrawlDepth: 2
  },
  pageOptions: {
    headers: { ... },
    formats: ['markdown'],
    onlyMainContent: true
  }
}
```

**v2 (NEW - USE THIS)**:

```typescript
{
  // Flat, top-level crawl parameters
  includePaths: ['/docs/*'],
  excludePaths: ['/admin/*'],
  limit: 10,
  maxDiscoveryDepth: 2,  // Was maxDepth in v1

  // Scrape options
  headers: { ... },
  formats: ['markdown', 'summary'],  // Can use new 'summary' format
  onlyMainContent: true,

  // v2 NEW: Smart crawling with natural language
  prompt: 'Extract documentation and API reference pages',

  // v2 NEW: Caching (default 2 days)
  maxAge: 172800,  // seconds

  // v2 NEW: Performance defaults
  blockAds: true,
  skipTlsVerification: true,
  removeBase64Images: true
}
```

### 3. New Format Options

**JSON Extraction (v2)**:

```typescript
formats: [
  {
    type: "json",
    prompt: "Extract the company mission from the page",
    schema: JsonSchema, // Optional Pydantic/Zod schema
  },
];
```

**Summary Format (v2 NEW)**:

```typescript
formats: ["markdown", "summary"];
// Returns concise summary of page content
```

**Screenshot with Options (v2)**:

```typescript
formats: [
  {
    type: "screenshot",
    fullPage: true,
    quality: 80,
    viewport: { width: 1280, height: 800 },
  },
];
```

### 4. Crawl Parameter Mappings

| v1 Parameter            | v2 Parameter        | Notes                                         |
| ----------------------- | ------------------- | --------------------------------------------- |
| `maxCrawlPages`         | `limit`             | Max pages to crawl                            |
| `maxCrawlDepth`         | `maxDiscoveryDepth` | Removed `maxDepth`                            |
| `allowBackwardCrawling` | `crawlEntireDomain` | Renamed                                       |
| `ignoreSitemap` (bool)  | `sitemap`           | Now: `"only"`, `"skip"`, `"include"`          |
| N/A                     | `prompt`            | **NEW** - Natural language crawl instructions |

### 5. Smart Crawling with Prompts (v2 NEW)

```typescript
// Let Firecrawl derive paths/limits from natural language
const params = await firecrawl.crawlParamsPreview(
  "https://docs.firecrawl.dev",
  "Extract docs and blog posts"
);
console.log(params); // Shows derived configuration

// Then use in actual crawl
const result = await firecrawl.crawl("https://docs.firecrawl.dev", {
  prompt: "Extract docs and blog posts",
});
```

### 6. Initialization (No Change)

```typescript
import Firecrawl from "@mendable/firecrawl-js";

const firecrawl = new Firecrawl({ apiKey: "fc-YOUR-API-KEY" });
```

### 7. Response Format (Check `next` parameter)

```typescript
{
  status: 'completed',
  total: 100,
  completed: 100,
  creditsUsed: 100,
  expiresAt: '2024-12-31T23:59:59.000Z',
  next: 'https://api.firecrawl.dev/v2/crawl/123?skip=10',  // If more data
  data: [
    {
      markdown: '...',
      html: '...',
      metadata: { ... }
    }
  ]
}
```

**If `next` is present**: More data available, must fetch next URL

## AOMA-Specific Implementation

### Current Issues in aomaFirecrawlService.ts

1. ❌ Using `crawlUrl()` instead of `crawl()`
2. ❌ Using nested `crawlerOptions` / `pageOptions` structure
3. ❌ Using old v1 parameter names (`maxCrawlPages`, `maxCrawlDepth`)
4. ❌ Not leveraging v2 features (caching, summary, prompts)

### Required Changes

1. Change method calls:
   - `this.firecrawl.crawlUrl()` → `this.firecrawl.crawl()`
   - `this.firecrawl.scrapeUrl()` → `this.firecrawl.scrape()`

2. Flatten configuration structure:
   - Remove `crawlerOptions` nesting
   - Remove `pageOptions` nesting
   - Merge all options to top level

3. Update parameter names:
   - `maxCrawlPages` → `limit`
   - `maxCrawlDepth` → `maxDiscoveryDepth`
   - `allowBackwardCrawling` → `crawlEntireDomain`

4. Add v2 performance defaults:
   - `blockAds: true`
   - `skipTlsVerification: true`
   - `removeBase64Images: true`
   - `maxAge: 172800` (2-day cache)

5. Consider adding:
   - `formats: ['markdown', 'summary']` for better content
   - `prompt` for smart crawling (e.g., "Extract AOMA documentation and help pages")

## Key Benefits of v2

- ✅ **Faster by default** - Built-in caching
- ✅ **Simpler API** - Flat configuration
- ✅ **Better AI integration** - Smart crawling with prompts
- ✅ **More output formats** - Summary, enhanced JSON, screenshots
- ✅ **Improved reliability** - Better defaults (blockAds, etc.)

## Migration Checklist

- [ ] Update all `crawlUrl()` → `crawl()`
- [ ] Update all `scrapeUrl()` → `scrape()`
- [ ] Flatten configuration structure
- [ ] Update parameter names
- [ ] Add v2 performance defaults
- [ ] Test with AOMA stage environment
- [ ] Consider adding `prompt` for smart crawling
- [ ] Update any crawl status checking logic

## References

- Migration Guide: https://docs.firecrawl.dev/migrate-to-v2
- Quickstart: https://docs.firecrawl.dev/introduction
- API Reference: https://docs.firecrawl.dev/api-reference/v2-introduction
