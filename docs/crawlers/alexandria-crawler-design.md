# Alexandria Crawler Design Document

**Date**: 2025-10-31  
**Status**: 📋 **DESIGN PHASE** - Awaiting System Discovery  
**Priority**: Medium (required for complete knowledge base coverage)

---

## Current Status

### What We Know ✅

1. **Table Exists**: `alexandria_knowledge` table created in Supabase
2. **Reference**: Mentioned in Sony Music knowledge ecosystem
3. **No Implementation**: Zero crawler code exists in codebase
4. **URL Unknown**: System location needs investigation
5. **Auth Unknown**: Authentication method TBD
6. **VPN Required**: Likely behind Sony Music corporate network

### What We Don't Know ❓

- [ ] What is Alexandria? (Document management? Wiki? Knowledge base?)
- [ ] Alexandria URL/hostname
- [ ] Authentication method (SSO, API key, Basic Auth, OAuth?)
- [ ] Content structure (pages, documents, categories?)
- [ ] API availability (REST, GraphQL, or web scraping required?)
- [ ] Rate limits and access policies
- [ ] Content volume estimate
- [ ] Access permissions and requirements

---

## Discovery Phase (User Action Required)

### Step 1: System Identification 🔍

**Action**: Connect to Sony Music VPN and investigate Alexandria

**Questions to Answer**:
```
1. What is the full URL of Alexandria?
   Example: https://alexandria.smedigitalapps.com

2. What type of system is it?
   [ ] Confluence-like wiki
   [ ] SharePoint/document repository
   [ ] Custom knowledge base
   [ ] Third-party tool (specify: _________)
   [ ] Other: ___________

3. How do users currently access it?
   [ ] Web browser (which URL?)
   [ ] Desktop application
   [ ] API only
   [ ] Other: ___________

4. What authentication is required?
   [ ] Azure AD / SSO
   [ ] Username + Password
   [ ] API key/token
   [ ] Certificate-based
   [ ] Other: ___________

5. What content does it contain?
   [ ] Technical documentation
   [ ] Product specifications
   [ ] Process documentation
   [ ] Training materials
   [ ] API reference
   [ ] Other: ___________

6. Approximate content volume?
   [ ] < 100 pages
   [ ] 100-500 pages
   [ ] 500-1000 pages
   [ ] 1000+ pages

7. Is there an API?
   [ ] Yes, RESTful API
   [ ] Yes, GraphQL
   [ ] No API, web scraping required
   [ ] Unknown

8. Any rate limits or restrictions?
   Response: ___________
```

### Step 2: Sample Content Collection 📸

**Action**: Capture examples for analysis

1. Take screenshots of 3-5 typical pages
2. Save HTML source of 2-3 pages
3. Document URL patterns (e.g., `/docs/`, `/kb/`, `/articles/`)
4. Note any dynamic content (JavaScript-rendered?)
5. Identify navigation structure (menus, breadcrumbs)

**Save to**: `tmp/alexandria-samples/`

### Step 3: API Exploration (If Available) 🔌

**If Alexandria has an API, test these endpoints**:

```bash
# List available endpoints
curl -H "Authorization: Bearer <token>" \
  https://alexandria.example.com/api/v1/

# List documents/pages
curl -H "Authorization: Bearer <token>" \
  https://alexandria.example.com/api/v1/documents

# Get single document
curl -H "Authorization: Bearer <token>" \
  https://alexandria.example.com/api/v1/documents/123
```

**Document**:
- Authentication headers required
- Response format (JSON, XML, HTML?)
- Available query parameters
- Pagination mechanism
- Rate limit headers

---

## Design Options (Based on System Type)

### Option A: API-Based Crawler (Preferred)

**If Alexandria has a REST/GraphQL API:**

```typescript
// src/services/alexandriaCrawler.ts

import { alexandriaAuth, getAuthHeaders } from "./alexandriaAuthenticator";
import { upsertWikiDocument } from "../lib/supabase";
import { openai } from "@ai-sdk/openai";
import { embed } from "ai";

interface AlexandriaDocument {
  id: string;
  title: string;
  content: string;
  url: string;
  category?: string;
  updated_at?: string;
  author?: string;
}

export class AlexandriaCrawler {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.ALEXANDRIA_BASE_URL || "";
  }

  /**
   * List all documents
   */
  async listDocuments(limit = 100): Promise<AlexandriaDocument[]> {
    const url = `${this.baseUrl}/api/v1/documents?limit=${limit}`;
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to list documents: ${response.status}`);
    }
    
    return response.json();
  }

  /**
   * Crawl all documents and store in Supabase
   */
  async crawlDocuments(options: { maxDocs?: number } = {}): Promise<{
    docsCrawled: number;
    vectorsUpserted: number;
  }> {
    const documents = await this.listDocuments(options.maxDocs);
    let vectorsUpserted = 0;

    for (const doc of documents) {
      // Generate embedding
      const { embedding } = await embed({
        model: openai.embedding("text-embedding-3-small"),
        value: doc.content,
      });

      // Store in wiki_documents table
      await upsertWikiDocument(
        doc.url,
        "alexandria",
        doc.title,
        doc.content,
        embedding,
        {
          sony_music: true,
          categories: ["knowledge_base", doc.category || "general"],
          updated_at: doc.updated_at,
          author: doc.author,
          document_id: doc.id,
        }
      );

      vectorsUpserted++;
      await this.delay(200); // Rate limiting
    }

    return {
      docsCrawled: documents.length,
      vectorsUpserted,
    };
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default { AlexandriaCrawler };
```

**Authentication** (`src/services/alexandriaAuthenticator.ts`):
```typescript
const API_KEY = process.env.ALEXANDRIA_API_KEY || "";
const API_SECRET = process.env.ALEXANDRIA_API_SECRET || "";

export function getAuthHeaders(): Record<string, string> {
  // Implement based on Alexandria's auth method
  return {
    "Authorization": `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  };
}
```

---

### Option B: Web Scraping with Firecrawl (If No API)

**If Alexandria requires web scraping:**

```typescript
// src/services/alexandriaCrawler.ts

import FirecrawlApp from "@mendable/firecrawl-js";
import { alexandriaAuth } from "./alexandriaAuthenticator";
import { upsertWikiDocument } from "../lib/supabase";
import { openai } from "@ai-sdk/openai";
import { embed } from "ai";

export class AlexandriaCrawler {
  private firecrawl: FirecrawlApp;
  private baseUrl: string;

  constructor() {
    this.firecrawl = new FirecrawlApp({
      apiKey: process.env.FIRECRAWL_API_KEY,
    });
    this.baseUrl = process.env.ALEXANDRIA_BASE_URL || "";
  }

  /**
   * Crawl Alexandria using Firecrawl v2
   */
  async crawlSite(config: {
    maxPages?: number;
    includePaths?: string[];
  } = {}): Promise<{
    pagesCrawled: number;
    vectorsUpserted: number;
  }> {
    // Get authentication cookies/headers
    const authHeaders = await alexandriaAuth.getAuthHeaders();

    // Configure Firecrawl crawl
    const crawlResult = await this.firecrawl.crawl(this.baseUrl, {
      limit: config.maxPages || 50,
      includePaths: config.includePaths || ["/docs/*", "/kb/*"],
      excludePaths: ["/admin/*", "/api/*"],
      headers: authHeaders,
      formats: ["markdown", "summary"],
      onlyMainContent: true,
      blockAds: true,
      maxAge: 172800, // 2-day cache
    });

    if (!crawlResult.success) {
      throw new Error(`Crawl failed: ${crawlResult.error}`);
    }

    let vectorsUpserted = 0;

    for (const page of crawlResult.data) {
      // Generate embedding
      const { embedding } = await embed({
        model: openai.embedding("text-embedding-3-small"),
        value: page.markdown,
      });

      // Store in wiki_documents
      await upsertWikiDocument(
        page.url,
        "alexandria",
        page.metadata?.title || "Untitled",
        page.markdown,
        embedding,
        {
          sony_music: true,
          categories: ["knowledge_base"],
          crawled_at: new Date().toISOString(),
        }
      );

      vectorsUpserted++;
    }

    return {
      pagesCrawled: crawlResult.data.length,
      vectorsUpserted,
    };
  }
}
```

---

### Option C: Playwright-Based (For Complex Auth/JS)

**If Alexandria requires complex authentication or heavy JavaScript:**

Follow the pattern from `aoma-interactive-crawl.js`:
- Interactive login for initial session capture
- Save session state to `tmp/alexandria-storage.json`
- Reuse session for subsequent crawls
- Full browser control for dynamic content

---

## Integration with Master Crawler

Once implemented, add to `scripts/master-crawler.ts`:

```typescript
import alexandriaCrawler from "@/services/alexandriaCrawler";

class MasterCrawler {
  // ... existing code ...

  async runAll(options: {
    sources?: ("aoma" | "confluence" | "jira" | "alexandria")[];
  } = {}) {
    // ... existing code ...

    if (sources.includes("alexandria")) {
      await this.crawlAlexandria();
    }
  }

  /**
   * Crawl Alexandria
   */
  private async crawlAlexandria() {
    console.log("\n📚 CRAWLING ALEXANDRIA\n");
    const startTime = Date.now();

    try {
      const result = await alexandriaCrawler.crawlDocuments({
        maxDocs: 100,
      });

      const duration = Date.now() - startTime;

      this.summary.results.push({
        source: "alexandria",
        success: true,
        itemsCrawled: result.docsCrawled,
        vectorsUpserted: result.vectorsUpserted,
        skipped: 0,
        errors: [],
        duration,
      });

      console.log(`✅ Alexandria crawl completed in ${(duration / 1000).toFixed(1)}s`);
      console.log(`   Documents: ${result.docsCrawled}`);
      console.log(`   Vectors: ${result.vectorsUpserted}`);
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`❌ Alexandria crawl failed: ${error.message}`);

      this.summary.results.push({
        source: "alexandria",
        success: false,
        itemsCrawled: 0,
        vectorsUpserted: 0,
        skipped: 0,
        errors: [error.message],
        duration,
      });
    }
  }
}
```

---

## Database Schema (Already Exists)

The `alexandria_knowledge` table should already exist in Supabase. Verify schema:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'alexandria_knowledge'
ORDER BY ordinal_position;
```

**Expected schema** (based on Confluence pattern):
- `id` (uuid, primary key)
- `url` (text, unique)
- `source_type` (text, value: "alexandria")
- `title` (text)
- `content` (text)
- `embedding` (vector(1536))
- `metadata` (jsonb)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

If using `aoma_unified_vectors` instead:
- Set `source_type = 'alexandria'`
- Store all Alexandria docs in unified table

---

## Environment Variables

Add to `.env` and `.env.local`:

```bash
# Alexandria Configuration
ALEXANDRIA_BASE_URL=https://alexandria.example.com
ALEXANDRIA_API_KEY=your_api_key_here
ALEXANDRIA_USERNAME=your_username
ALEXANDRIA_PASSWORD=your_password

# Or for Azure AD
ALEXANDRIA_CLIENT_ID=your_client_id
ALEXANDRIA_CLIENT_SECRET=your_client_secret
ALEXANDRIA_TENANT_ID=your_tenant_id
```

Update MCP configuration if needed (`~/.cursor/mcp.json`).

---

## Testing Strategy

### Unit Tests

```typescript
describe("AlexandriaCrawler", () => {
  it("authenticates successfully");
  it("lists documents from API");
  it("crawls and stores documents");
  it("handles rate limits gracefully");
  it("retries on transient failures");
});
```

### Integration Tests

```typescript
describe("Alexandria Integration", () => {
  it("crawls sample Alexandria instance");
  it("stores documents in Supabase");
  it("generates valid embeddings");
  it("respects authentication requirements");
});
```

### Manual Testing Checklist

- [ ] Connect to VPN
- [ ] Authenticate to Alexandria
- [ ] Run crawler on 5-10 test pages
- [ ] Verify content stored in Supabase
- [ ] Test vector search quality
- [ ] Validate metadata completeness
- [ ] Check for duplicate detection

---

## Implementation Checklist

### Phase 1: Discovery & Planning ✅ (This Document)
- [x] Document current status
- [x] Create design options
- [x] Define discovery questions
- [ ] **USER ACTION**: Complete discovery questionnaire
- [ ] **USER ACTION**: Provide sample content

### Phase 2: Authentication (1-2 hours)
- [ ] Determine auth method from discovery
- [ ] Create `alexandriaAuthenticator.ts`
- [ ] Implement `getAuthHeaders()` function
- [ ] Test authentication independently
- [ ] Document auth flow

### Phase 3: Crawler Implementation (2-4 hours)
- [ ] Choose implementation (API, Firecrawl, or Playwright)
- [ ] Create `alexandriaCrawler.ts`
- [ ] Implement document listing/discovery
- [ ] Implement content extraction
- [ ] Add embedding generation
- [ ] Add Supabase storage
- [ ] Implement error handling
- [ ] Add progress tracking

### Phase 4: Integration (1 hour)
- [ ] Add to `master-crawler.ts`
- [ ] Update environment variable templates
- [ ] Add to API routes (if needed)
- [ ] Update documentation

### Phase 5: Testing & Validation (2 hours)
- [ ] Write unit tests
- [ ] Run integration tests
- [ ] Manual testing on VPN
- [ ] Verify search quality
- [ ] Performance benchmarking
- [ ] Document findings

### Phase 6: Documentation (1 hour)
- [ ] Update crawler comparison doc
- [ ] Add Alexandria section to README
- [ ] Document rate limits and quotas
- [ ] Create troubleshooting guide
- [ ] Update master crawler docs

---

## Estimated Effort

**Total**: 7-10 hours (after discovery phase complete)

**Breakdown**:
- Discovery & Planning: ✅ Complete (this document)
- Authentication: 1-2 hours
- Crawler Implementation: 2-4 hours
- Integration: 1 hour
- Testing: 2 hours
- Documentation: 1 hour

**Dependencies**:
- VPN access to Sony Music network
- Alexandria credentials/permissions
- Discovery questionnaire completion

---

## Success Criteria

- [ ] Alexandria crawler successfully authenticates
- [ ] Crawler processes 50+ Alexandria documents
- [ ] All documents stored with embeddings in Supabase
- [ ] Vector search returns relevant Alexandria content
- [ ] No duplicate documents created
- [ ] Crawler handles errors gracefully
- [ ] Performance comparable to Confluence crawler
- [ ] Integration with master crawler complete
- [ ] Documentation updated

---

## Next Steps

1. **USER ACTION REQUIRED**: Complete discovery questionnaire above
2. **USER ACTION REQUIRED**: Provide sample Alexandria content/screenshots
3. **USER ACTION REQUIRED**: Share Alexandria credentials/access method
4. Once discovery complete, proceed with Phase 2 (Authentication)

---

## References

- Confluence crawler: `src/services/confluenceCrawler.ts` (reference implementation)
- AOMA crawler: `src/services/aomaFirecrawlService.ts` (Firecrawl v2 example)
- Master crawler: `scripts/master-crawler.ts` (integration pattern)
- Existing table: `alexandria_knowledge` in Supabase

---

**Status**: ⏸️ **BLOCKED** - Awaiting user discovery phase completion  
**Priority**: Medium (required for comprehensive knowledge coverage)  
**Assignee**: User (discovery) → Claude (implementation)  
**Next Review**: After discovery questionnaire completion

