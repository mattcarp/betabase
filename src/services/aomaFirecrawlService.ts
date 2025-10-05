import FirecrawlApp from '@mendable/firecrawl-js';
import { aomaStageAuthenticator } from './aomaStageAuthenticator';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';

// Lazy initialization of Supabase client to avoid build-time errors
let supabaseInstance: SupabaseClient | null = null;
function getSupabase() {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    supabaseInstance = createClient(supabaseUrl, supabaseKey);
  }
  return supabaseInstance;
}

interface CrawlConfig {
  maxPages?: number;
  includePaths?: string[];
  excludePaths?: string[];
  depth?: number;
}

interface ProcessedContent {
  url: string;
  title: string;
  content: string;
  markdown: string;
  embedding: number[];
  metadata: Record<string, any>;
}

export class AomaFirecrawlService {
  private firecrawl: any; // Using Firecrawl SDK v4 with v2 API
  private baseUrl: string;

  constructor() {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      throw new Error('FIRECRAWL_API_KEY environment variable is required');
    }
    // Initialize Firecrawl with v2 API (default in v4.3.5+)
    this.firecrawl = new FirecrawlApp({
      apiKey: apiKey
    });
    this.baseUrl = process.env.AOMA_STAGE_URL || 'https://aoma-stage.smcdp-de.net';
    console.log('✅ Firecrawl v2 API initialized');
  }

  /**
   * Crawl a single page for testing
   */
  async crawlSinglePage(url: string): Promise<any> {
    try {
      console.log(`🕷️ Crawling single page: ${url}`);
      
      // Get authentication cookies
      const cookieHeader = await aomaStageAuthenticator.getCookieHeader();
      
      // Scrape the single page (Firecrawl v2 API)
      const result = await this.firecrawl.scrape(
        url.startsWith('http') ? url : `${this.baseUrl}${url}`,
        {
          headers: {
            'Cookie': cookieHeader,
            'User-Agent': 'Mozilla/5.0 (compatible; SIAM-Crawler/1.0)',
            'Accept': 'text/html,application/xhtml+xml'
          },
          formats: ['markdown', 'summary'],  // v2: Added summary format
          onlyMainContent: true,
          waitFor: 2000,
          // v2 performance defaults
          blockAds: true,
          skipTlsVerification: true,
          removeBase64Images: true,
          maxAge: 172800  // 2-day cache
        }
      );

      if (!result.success) {
        throw new Error(`Failed to crawl: ${result.error}`);
      }

      // Process and store the page
      await this.processAndStorePage(result);
      
      return {
        success: true,
        content: result.markdown,
        metadata: result.metadata
      };
    } catch (error: any) {
      console.error(`❌ Failed to crawl ${url}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Main crawl orchestration method
   */
  async crawlAomaContent(config: CrawlConfig = {}): Promise<{
    success: boolean;
    pagesProcessed: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let pagesProcessed = 0;

    try {
      // Step 1: Ensure we have valid authentication
      console.log('🔐 Ensuring authentication...');
      const cookieHeader = await aomaStageAuthenticator.ensureAuthenticated();
      
      // Step 2: Configure crawl parameters
      const crawlConfig = this.buildCrawlConfig(config, cookieHeader);
      
      // Step 3: Execute crawl
      console.log('🕷️ Starting Firecrawl crawl...');
      const crawlResult = await this.executeCrawl(crawlConfig);
      
      // Step 4: Process and store results
      if (crawlResult.data && Array.isArray(crawlResult.data)) {
        console.log(`📝 Processing ${crawlResult.data.length} pages...`);
        for (const page of crawlResult.data) {
          try {
            await this.processAndStorePage(page);
            pagesProcessed++;
          } catch (error: any) {
            errors.push(`Failed to process ${page.url}: ${error.message}`);
          }
        }
      }
      
      // Step 5: Update sync status
      await this.updateSyncStatus(pagesProcessed, errors);
      
      return {
        success: errors.length === 0,
        pagesProcessed,
        errors
      };
      
    } catch (error: any) {
      console.error('❌ Crawl failed:', error);
      errors.push(`Critical failure: ${error.message}`);
      return {
        success: false,
        pagesProcessed,
        errors
      };
    }
  }

  /**
   * Build Firecrawl v2 API configuration with auth headers
   */
  private buildCrawlConfig(config: CrawlConfig, cookieHeader: string) {
    return {
      // v2 API: Flat configuration structure
      includePaths: config.includePaths || [
        '/apps/*',
        '/api/v1/docs/*',
        '/knowledge/*',
        '/help/*'
      ],
      excludePaths: config.excludePaths || [
        '/admin/*',
        '/logout',
        '.*\\.pdf$',
        '.*\\.zip$'
      ],
      limit: config.maxPages || 10,
      maxDiscoveryDepth: config.depth || 2,  // v2: renamed from maxDepth
      crawlEntireDomain: false,  // v2: renamed from allowBackwardLinks
      
      // Headers and scrape options (v2: flat, not nested)
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': 'Mozilla/5.0 (compatible; SIAM-Crawler/1.0)'
      },
      onlyMainContent: true,
      formats: ['markdown', 'summary'],  // v2: Added summary format
      waitFor: 2000,
      
      // v2 NEW: Performance defaults (faster by default)
      blockAds: true,
      skipTlsVerification: true,
      removeBase64Images: true,
      maxAge: 172800,  // 2-day cache (default in v2)
      
      // v2 NEW: Smart crawling with natural language prompt
      prompt: 'Extract AOMA documentation, API reference, knowledge base, and help pages. Focus on technical content and user guides.'
    };
  }

  /**
   * Execute the Firecrawl crawl using v2 API
   */
  private async executeCrawl(config: any) {
    // v2 API: Use crawl() method (waiter that auto-polls for completion)
    const result = await this.firecrawl.crawl(
      this.baseUrl,
      config
    );

    if (!result.success) {
      throw new Error(`Crawl failed: ${result.error || 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Process a single page and store in Supabase
   */
  private async processAndStorePage(page: any): Promise<void> {
    // Extract content
    const processedContent = await this.processPageContent(page);
    
    // Generate embedding
    const embedding = await this.generateEmbedding(processedContent.content);
    
    // Store in Supabase
    await this.storeInVectorDatabase({
      ...processedContent,
      embedding
    });
  }

  /**
   * Process raw page content into structured format
   */
  private async processPageContent(page: any): Promise<Omit<ProcessedContent, 'embedding'>> {
    const { markdown, metadata, url } = page;
    
    // Clean and structure the content
    const cleanedMarkdown = this.cleanMarkdown(markdown || '');
    const title = metadata?.title || this.extractTitleFromMarkdown(cleanedMarkdown);
    
    // Extract key information
    const processedMetadata = {
      originalUrl: url,
      title,
      description: metadata?.description || '',
      crawledAt: new Date().toISOString(),
      contentLength: cleanedMarkdown.length,
      section: this.categorizeContent(url),
      keywords: this.extractKeywords(cleanedMarkdown)
    };

    return {
      url,
      title,
      content: cleanedMarkdown,
      markdown: cleanedMarkdown,
      metadata: processedMetadata
    };
  }

  /**
   * Generate embedding using OpenAI
   */
  private async generateEmbedding(content: string): Promise<number[]> {
    try {
      // Truncate content to fit token limits
      const truncatedContent = content.slice(0, 8000);
      
      const { embedding } = await embed({
        model: openai.embedding('text-embedding-3-small'),
        value: truncatedContent,
      });

      return embedding;
    } catch (error) {
      console.warn('Failed to generate embedding, using empty array:', error);
      return new Array(1536).fill(0); // Return zero vector as fallback
    }
  }

  /**
   * Store processed content in Supabase vector store
   */
  private async storeInVectorDatabase(content: ProcessedContent): Promise<void> {
    const { error } = await getSupabase()
      .from('aoma_unified_vectors')
      .upsert({
        content: content.content,
        embedding: content.embedding,
        source_type: 'aoma_docs',
        source_id: content.url,
        metadata: content.metadata,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'source_id'
      });

    if (error) {
      console.error('Database storage error:', error);
      throw new Error(`Failed to store in database: ${error.message}`);
    }
  }

  /**
   * Clean markdown content for better LLM processing
   */
  private cleanMarkdown(markdown: string): string {
    return markdown
      .replace(/\n{3,}/g, '\n\n')
      .replace(/!\[\]\([^)]+\)/g, '')
      .replace(/```\s*\n```/g, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .trim();
  }

  /**
   * Extract title from markdown if not in metadata
   */
  private extractTitleFromMarkdown(markdown: string): string {
    const match = markdown.match(/^#\s+(.+)$/m);
    return match ? match[1] : 'Untitled Page';
  }

  /**
   * Categorize content based on URL patterns
   */
  private categorizeContent(url: string): string {
    if (url.includes('/api/')) return 'api_documentation';
    if (url.includes('/knowledge/')) return 'knowledge_base';
    if (url.includes('/help/')) return 'help_documentation';
    if (url.includes('/apps/')) return 'application_documentation';
    return 'general_documentation';
  }

  /**
   * Extract keywords for better searchability
   */
  private extractKeywords(content: string): string[] {
    const words = content
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 4);
    
    const wordFreq = new Map<string, number>();
    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });
    
    return Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Update sync status in database
   */
  private async updateSyncStatus(
    recordsCount: number,
    errors: string[]
  ): Promise<void> {
    await getSupabase()
      .from('aoma_source_sync')
      .upsert({
        source_type: 'aoma_docs',
        last_sync: new Date().toISOString(),
        sync_status: errors.length === 0 ? 'success' : 'partial',
        records_count: recordsCount,
        error_message: errors.length > 0 ? errors.join('; ') : null
      });
  }
}

// Lazy initialization to avoid build-time errors
let aomaFirecrawlInstance: AomaFirecrawlService | null = null;
export const aomaFirecrawl = {
  crawlAomaContent: async (config?: any) => {
    if (!aomaFirecrawlInstance) {
      aomaFirecrawlInstance = new AomaFirecrawlService();
    }
    return aomaFirecrawlInstance.crawlAomaContent(config);
  },
  crawlSinglePage: async (url: string) => {
    if (!aomaFirecrawlInstance) {
      aomaFirecrawlInstance = new AomaFirecrawlService();
    }
    return aomaFirecrawlInstance.crawlSinglePage(url);
  }
};