# 🚀 AOMA Mesh MCP - Comprehensive Improvement Plan

## Current Status Assessment

### ✅ What's Working

1. **Database Schema**: All required tables exist in Supabase
   - `aoma_unified_vectors` - For Firecrawl v2 formatted content
   - `aoma_knowledge` - AOMA documentation
   - `confluence_knowledge` - Confluence pages
   - `jira_issues` - JIRA tickets
   - `alexandria_knowledge` - Alexandria docs
   - `betabase_documents` - Betabase content
   - `documents` & `document_sections` - General documents

2. **Authentication**:
   - Playwright-based AOMA authentication works
   - Azure AD + 2FA flow is functional
   - Cookie extraction and storage implemented

3. **Infrastructure**:
   - SIAM frontend deployed on Render
   - AOMA Mesh MCP server ready for deployment
   - Supabase MCP available for direct database access

### ❌ Problems to Solve

1. **Firecrawl v2 is blocked by AOMA's WAF**
2. **No content in any database tables**
3. **Node.js version too old (v16) - need v20+**
4. **No automated crawling pipeline**
5. **No vectorization/embeddings yet**

---

## 🎯 Strategic Improvement Plan

### Phase 1: Hybrid Crawling Strategy (Week 1)

#### Use Firecrawl v2 Where It Works Best:

```javascript
// For PUBLIC sites that don't block it:
const publicSites = {
  "Sony Music Public": "https://www.sonymusic.com",
  "Sony Support": "https://support.sonymusic.com",
  "Developer Docs": "https://developer.sonymusic.com",
};

// Firecrawl excels at:
// - Bulk crawling public sites
// - Automatic markdown conversion
// - Link following and sitemap parsing
// - Structured data extraction
```

#### Use Playwright for Enterprise Apps:

```javascript
// For INTERNAL sites with auth/WAF:
const enterpriseApps = {
  AOMA: "https://aoma-stage.smcdp-de.net",
  Confluence: "https://sonymusic.atlassian.net",
  Alexandria: "https://alexandria.sonymusic.com",
  JIRA: "https://sonymusic.atlassian.net/jira",
};

// Playwright handles:
// - Complex authentication flows
// - WAF/bot detection bypass
// - JavaScript-heavy SPAs
// - Cookie/session management
```

### Phase 2: Unified Data Pipeline (Week 1-2)

#### 1. Create Hybrid Crawler Service

```typescript
// src/services/hybridCrawlerService.ts
export class HybridCrawlerService {
  async crawl(url: string): Promise<ProcessedContent> {
    const domain = new URL(url).hostname;

    // Decision logic
    if (this.isPublicSite(domain)) {
      return await this.crawlWithFirecrawl(url);
    } else if (this.requiresAuth(domain)) {
      return await this.crawlWithPlaywright(url);
    }

    // Try Firecrawl first, fall back to Playwright
    try {
      return await this.crawlWithFirecrawl(url);
    } catch (error) {
      console.log("Firecrawl failed, using Playwright");
      return await this.crawlWithPlaywright(url);
    }
  }

  private async crawlWithFirecrawl(url: string) {
    const result = await firecrawl.scrapeUrl(url, {
      formats: ["markdown", "html"],
      onlyMainContent: true,
      waitFor: 2000,
    });
    return this.processContent(result);
  }

  private async crawlWithPlaywright(url: string) {
    const page = await this.getAuthenticatedPage(url);
    await page.goto(url);
    await page.waitForLoadState("networkidle");

    const content = await page.evaluate(() => {
      // Remove noise
      document.querySelectorAll("script, style, nav, footer").forEach((el) => el.remove());
      return {
        html: document.documentElement.outerHTML,
        text: document.body.innerText,
        title: document.title,
      };
    });

    // Convert to markdown using Firecrawl's converter
    const markdown = await this.htmlToMarkdown(content.html);
    return { ...content, markdown };
  }
}
```

#### 2. Implement Smart Deduplication

```typescript
// Use Supabase MCP to check before inserting
async function smartUpsert(content: ProcessedContent) {
  // Generate content hash
  const contentHash = crypto.createHash("md5").update(content.markdown).digest("hex");

  // Check if exists using Supabase MCP
  const existing = await supabase
    .from("aoma_unified_vectors")
    .select("id, content_hash, updated_at")
    .eq("url", content.url)
    .single();

  if (existing?.data?.content_hash === contentHash) {
    console.log("Content unchanged, skipping");
    return;
  }

  // Upsert with new content
  await supabase.from("aoma_unified_vectors").upsert(
    {
      url: content.url,
      content: content.markdown,
      content_hash: contentHash,
      metadata: content.metadata,
      embedding: await generateEmbedding(content.markdown),
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "url",
    }
  );
}
```

### Phase 3: Vectorization & Search (Week 2)

#### Benefits of Firecrawl v2 Format in Our Database:

1. **Standardized markdown** - Consistent format across all sources
2. **Structured metadata** - Links, images, tables extracted
3. **Clean content** - Navigation, ads, scripts removed
4. **Chunking ready** - Pre-formatted for embedding generation

```sql
-- Our unified vector table structure (already exists!)
CREATE TABLE aoma_unified_vectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,  -- Firecrawl markdown
  embedding vector(1536),  -- OpenAI embeddings
  content_hash TEXT,
  metadata JSONB,  -- Firecrawl metadata
  source_type TEXT,  -- 'aoma', 'confluence', 'alexandria'
  crawled_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Enable vector search
CREATE INDEX ON aoma_unified_vectors
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

### Phase 4: Incremental Crawling System (Week 2-3)

```typescript
// Automated daily crawls
export class IncrementalCrawler {
  async runDailyCrawl() {
    const sources = [
      { type: "aoma", crawler: "playwright", auth: true },
      { type: "confluence", crawler: "playwright", auth: true },
      { type: "alexandria", crawler: "playwright", auth: true },
      { type: "public_docs", crawler: "firecrawl", auth: false },
    ];

    for (const source of sources) {
      // Get last crawl time
      const lastCrawl = await this.getLastCrawlTime(source.type);

      // Get updated content
      const urls = await this.getUpdatedUrls(source.type, lastCrawl);

      // Crawl in parallel with rate limiting
      await pLimit(
        5,
        urls.map((url) => () => this.crawlAndStore(url, source))
      );
    }
  }
}
```

---

## 🚀 Immediate Action Plan

### Today (30 minutes)

1. **Update Node.js to v20**:

```bash
nvm install 20
nvm use 20
nvm alias default 20
```

2. **Create unified crawler script**:

```bash
cd /Users/mcarpent/Documents/projects/siam
mkdir -p scripts/crawlers
touch scripts/crawlers/unified-crawler.ts
```

3. **Test Firecrawl on public Sony sites**:

```javascript
// Quick test to see what works
const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
const publicSites = [
  "https://www.sonymusic.com",
  "https://www.sonymusic.co.uk",
  "https://support.sonymusic.com",
];

for (const site of publicSites) {
  try {
    const result = await firecrawl.scrapeUrl(site);
    console.log(`✅ ${site} works with Firecrawl!`);
    // Store in aoma_unified_vectors
  } catch (error) {
    console.log(`❌ ${site} blocked Firecrawl`);
  }
}
```

### This Week

1. **Set up Playwright pool** for enterprise apps
2. **Implement content deduplication** using Supabase MCP
3. **Create crawl scheduler** with cron jobs
4. **Generate embeddings** for all content
5. **Test semantic search** across all sources

### Next Week

1. **Deploy crawler to cloud** (AWS Lambda or Railway)
2. **Set up monitoring** and alerts
3. **Create API endpoints** for search
4. **Integrate with AOMA Mesh MCP**

---

## 🎯 Key Benefits of This Approach

### Why Firecrawl v2 + Playwright Hybrid?

1. **Best of both worlds** - Speed of Firecrawl for public sites, reliability of Playwright for enterprise
2. **Unified markdown format** - Firecrawl's markdown converter works on any HTML source
3. **Structured metadata** - Consistent extraction of links, images, tables
4. **Cost optimization** - Use cheaper Firecrawl for bulk public crawling
5. **Fallback strategy** - Always have a working crawler

### Why Use Supabase MCP?

1. **Direct database access** - No API overhead
2. **Built-in deduplication** - Check before insert
3. **Vector search ready** - pgvector already configured
4. **RLS policies** - Secure multi-tenant access
5. **Real-time subscriptions** - Watch for new content

### Expected Outcomes

- **500+ documents** crawled and indexed in first week
- **< 100ms** semantic search response time
- **95% deduplication** rate (no redundant content)
- **Daily updates** from all sources
- **Zero manual intervention** after setup

---

## 📋 Technical Requirements

### Environment Variables Needed

```env
# Firecrawl
FIRECRAWL_API_KEY=fc-...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://kfxetwuuzljhybfgmpuc.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# OpenAI (for embeddings)
OPENAI_API_KEY=sk-...

# AOMA Auth
AOMA_STAGE_URL=https://aoma-stage.smcdp-de.net
AOMA_USERNAME=...
AOMA_PASSWORD=...
```

### Dependencies to Install

```json
{
  "dependencies": {
    "@mendable/firecrawl-js": "^1.7.1",
    "playwright": "^1.48.0",
    "@supabase/supabase-js": "^2.46.0",
    "openai": "^4.73.0",
    "p-limit": "^6.1.0",
    "node-cron": "^3.0.3",
    "dotenv": "^16.4.5"
  }
}
```

---

## 🔄 Migration Path

### From Current State to Production

1. **Week 1**: Implement hybrid crawler, test on all sources
2. **Week 2**: Vectorize content, enable semantic search
3. **Week 3**: Deploy to cloud, set up monitoring
4. **Week 4**: Integration testing, performance tuning
5. **Month 2**: Scale to more sources, add more intelligence

---

## 📊 Success Metrics

| Metric               | Target    | Current |
| -------------------- | --------- | ------- |
| Documents Crawled    | 500+      | 0       |
| Sources Integrated   | 5+        | 0       |
| Search Response Time | <100ms    | N/A     |
| Content Freshness    | <24 hours | N/A     |
| Deduplication Rate   | >95%      | N/A     |
| System Uptime        | 99.9%     | N/A     |

---

## 🚦 Next Steps

1. **Confirm Node.js v20 is installed**
2. **Run the unified crawler test**
3. **Start with public Sony sites using Firecrawl**
4. **Set up Playwright for AOMA**
5. **Generate first batch of embeddings**

Ready to execute? Let me know which part to start with!
