import FirecrawlApp from '@mendable/firecrawl-js';
import { aomaStageAuthenticator } from './aomaStageAuthenticator';
import { createClient } from '@supabase/supabase-js';
import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

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
  private firecrawl: any; // Using Firecrawl SDK v4 which has v1 API under .v1 property
  private baseUrl: string;

  constructor() {
    if (!process.env.FIRECRAWL_API_KEY) {
      throw new Error('FIRECRAWL_API_KEY environment variable is required');
    }
    const firecrawlInstance = new FirecrawlApp({
      apiKey: process.env.FIRECRAWL_API_KEY
    });
    // Access v1 API methods
    this.firecrawl = firecrawlInstance.v1 || firecrawlInstance;
    this.baseUrl = process.env.AOMA_STAGE_URL || 'https://aoma-stage.smcdp-de.net';
    console.log('✅ FirecrawlApp initialized');
  }

  /**
   * Crawl a single page for testing
   */
  async crawlSinglePage(url: string): Promise<any> {
    try {
      console.log(`🕷️ Crawling single page: ${url}`);
      
      // Get authentication cookies
      const cookieHeader = await aomaStageAuthenticator.getCookieHeader();
      
      // Scrape the single page (Firecrawl SDK v1 API)
      const result = await this.firecrawl.scrapeUrl(
        url.startsWith('http') ? url : `${this.baseUrl}${url}`,
        {
          headers: {
            'Cookie': cookieHeader,
            'User-Agent': 'Mozilla/5.0 (compatible; SIAM-Crawler/1.0)',
            'Accept': 'text/html,application/xhtml+xml'
          },
          formats: ['markdown'],
          onlyMainContent: true,
          waitFor: 2000
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
   * Build Firecrawl configuration with auth headers
   */
  private buildCrawlConfig(config: CrawlConfig, cookieHeader: string) {
    return {
      url: this.baseUrl,
      crawlerOptions: {
        includes: config.includePaths || [
          '/apps/*',
          '/api/v1/docs/*',
          '/knowledge/*',
          '/help/*'
        ],
        excludes: config.excludePaths || [
          '/admin/*',
          '/logout',
          '*.pdf',
          '*.zip'
        ],
        maxCrawlPages: config.maxPages || 10,
        maxCrawlDepth: config.depth || 2,
        allowBackwardCrawling: false
      },
      pageOptions: {
        headers: {
          'Cookie': cookieHeader,
          'User-Agent': 'Mozilla/5.0 (compatible; SIAM-Crawler/1.0)'
        },
        onlyMainContent: true,
        formats: ['markdown'] as const,
        waitFor: 2000
      }
    };
  }

  /**
   * Execute the Firecrawl crawl using v4 SDK API
   */
  private async executeCrawl(config: any) {
    // Firecrawl SDK v4 uses crawlUrl which automatically polls for completion
    const result = await this.firecrawl.crawlUrl(
      config.url,
      {
        ...config.crawlerOptions,
        ...config.pageOptions
      },
      2 // Poll interval in seconds
    );

    if (!result.success) {
      throw new Error(`Crawl failed: ${result.error}`);
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
    const { error } = await supabase
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
    await supabase
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

export const aomaFirecrawl = new AomaFirecrawlService();