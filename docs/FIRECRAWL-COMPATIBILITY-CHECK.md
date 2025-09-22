# Firecrawl v2 Data Format Compatibility Check

## Firecrawl v2 Output Format

Firecrawl v2 returns data in the following structure:

```typescript
interface FirecrawlResult {
  success: boolean;
  data?: {
    markdown?: string;      // Main content in markdown format
    content?: string;       // Plain text content
    html?: string;         // Raw HTML (if requested)
    rawHtml?: string;      // Original HTML
    links?: string[];      // Links found on page
    screenshot?: string;   // Base64 screenshot (if requested)
    metadata: {
      title?: string;
      description?: string;
      language?: string;
      keywords?: string;
      robots?: string;
      ogTitle?: string;
      ogDescription?: string;
      ogUrl?: string;
      ogImage?: string;
      ogAudio?: string;
      ogDeterminer?: string;
      ogLocale?: string;
      ogLocaleAlternate?: string[];
      ogSiteName?: string;
      ogVideo?: string;
      dctermsCreated?: string;
      dcDateCreated?: string;
      dcDate?: string;
      dctermsType?: string;
      dcType?: string;
      dctermsAudience?: string;
      dctermsSubject?: string;
      dcSubject?: string;
      dcDescription?: string;
      dctermsKeywords?: string;
      modifiedTime?: string;
      publishedTime?: string;
      articleTag?: string;
      articleSection?: string;
      sourceURL?: string;
      statusCode?: number;
      error?: string;
    };
    llm_extraction?: any;  // If LLM extraction is enabled
    warning?: string;
  }[];
  error?: string;
}
```

## Your Existing Table Structure

Looking at your `aoma_unified_vectors` table from the migration:

```sql
CREATE TABLE IF NOT EXISTS aoma_unified_vectors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,           -- ✅ Maps to: markdown or content from Firecrawl
  embedding vector(1536),           -- ✅ Generated from content
  source_type TEXT NOT NULL,        -- ✅ You'll set this to 'knowledge' or 'aoma_docs'
  source_id TEXT NOT NULL,          -- ✅ Maps to: metadata.sourceURL or url
  metadata JSONB DEFAULT '{}',      -- ✅ Maps to: entire metadata object from Firecrawl
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_source UNIQUE(source_type, source_id)
);
```

## ✅ COMPATIBILITY ASSESSMENT: FULLY COMPATIBLE!

Your existing table structure is **perfectly compatible** with Firecrawl v2 output. Here's the mapping:

| Firecrawl v2 Field | Your Table Column | Notes |
|-------------------|-------------------|-------|
| `data.markdown` or `data.content` | `content` | Store the markdown version preferably |
| Generated embedding | `embedding` | Create using OpenAI from content |
| 'aoma_docs' | `source_type` | Hardcode this value |
| `metadata.sourceURL` | `source_id` | Use the URL as unique identifier |
| `metadata` object | `metadata` | Store entire metadata as JSONB |

## Implementation Code (Already Correct!)

Your `aomaFirecrawlService.ts` correctly maps the data:

```typescript
// This is already correct in your service:
private async processPageContent(page: any): Promise<Omit<ProcessedContent, 'embedding'>> {
  const { markdown, metadata, url } = page;  // ✅ Destructures Firecrawl output
  
  const processedMetadata = {
    originalUrl: url,                        // ✅ Preserves URL
    title: metadata?.title,                  // ✅ Gets title from metadata
    description: metadata?.description,       // ✅ Gets description
    crawledAt: new Date().toISOString(),
    ...metadata                               // ✅ Includes all other metadata
  };

  return {
    url,                                      // For source_id
    content: markdown,                        // For content column
    metadata: processedMetadata               // For metadata JSONB column
  };
}

// Storage is also correct:
await supabase
  .from('aoma_unified_vectors')
  .upsert({
    content: content.content,                // ✅ Markdown content
    embedding: content.embedding,            // ✅ Generated embedding
    source_type: 'aoma_docs',               // ✅ Correct source type
    source_id: content.url,                 // ✅ URL as unique ID
    metadata: content.metadata              // ✅ Full metadata
  });
```

## No Changes Needed!

Your existing table structure and implementation are fully compatible with Firecrawl v2. The table was well-designed to be flexible with its JSONB metadata column, which can store all the rich metadata that Firecrawl provides.

## Additional Tables You Have

You also have other compatible tables for the test dashboard:
- `test_knowledge_base` - For test-related knowledge
- `support_knowledge` - For support documentation
- `firecrawl_analysis` - For storing Firecrawl analysis results

All of these can work together in your unified knowledge system.