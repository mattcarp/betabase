#!/usr/bin/env node

/**
 * AOMA Playwright Crawler with Vector Store Integration
 * 
 * This script uses Playwright to crawl AOMA pages (since Firecrawl is blocked)
 * and stores the content in Supabase vector store
 */

const { chromium } = require('playwright'); // Use Safari instead of Chromium
const { createClient } = require('@supabase/supabase-js');
const TurndownService = require('turndown');
const fs = require('fs').promises;
const path = require('path');
const OpenAI = require('openai');

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

// Initialize services
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced'
});

// Configure turndown for better markdown
turndown.remove(['script', 'style', 'nav', 'footer', 'header']);

class AomaPlaywrightCrawler {
  constructor() {
    this.baseUrl = process.env.AOMA_STAGE_URL || 'https://aoma-stage.smcdp-de.net';
    this.storageFile = path.join(process.cwd(), 'tmp/aoma-stage-storage.json');
    this.browser = null;
    this.context = null;
    this.processedUrls = new Set();
  }

  async initialize() {
    console.log('🚀 Initializing AOMA Playwright Crawler...\n');
    
    // Load saved authentication state
    const storageState = await fs.readFile(this.storageFile, 'utf8');
    
    // Launch browser with auth state
    this.browser = await chromium.launch({
      headless: false, // Set to true for production
      slowMo: 100
    });
    
    this.context = await this.browser.newContext({
      storageState: JSON.parse(storageState),
      viewport: { width: 1920, height: 1080 }
    });
    
    console.log('✅ Browser initialized with saved authentication\n');
  }

  async crawlPage(url, depth = 0, maxDepth = 2) {
    // Normalize URL
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
    
    // Skip if already processed
    if (this.processedUrls.has(fullUrl)) {
      return;
    }
    
    this.processedUrls.add(fullUrl);
    console.log(`📄 Crawling (depth ${depth}): ${fullUrl}`);
    
    const page = await this.context.newPage();
    
    try {
      // Navigate to page
      await page.goto(fullUrl, {
        waitUntil: 'networkidle',
        timeout: 30000
      });
      
      // Wait for content to load
      await page.waitForTimeout(2000);
      
      // Check if we're still authenticated
      const currentUrl = page.url();
      if (currentUrl.includes('login') || currentUrl.includes('microsoftonline')) {
        console.log('⚠️ Authentication expired, please re-run authentication script');
        return;
      }
      
      // Extract page content
      const content = await this.extractPageContent(page);
      
      // Store in vector database
      await this.storeInVectorDb(content);
      
      // Find links for crawling (if not at max depth)
      if (depth < maxDepth) {
        const links = await this.extractLinks(page);
        console.log(`   Found ${links.length} links to follow`);
        
        // Crawl linked pages
        for (const link of links.slice(0, 5)) { // Limit to 5 links per page
          await this.crawlPage(link, depth + 1, maxDepth);
        }
      }
      
    } catch (error) {
      console.error(`❌ Error crawling ${fullUrl}:`, error.message);
    } finally {
      await page.close();
    }
  }

  async extractPageContent(page) {
    // Get page metadata
    const title = await page.title();
    const url = page.url();
    
    // Remove navigation and other noise
    await page.evaluate(() => {
      const elements = document.querySelectorAll('nav, header, footer, .sidebar, .navigation, #menu');
      elements.forEach(el => el.remove());
    });
    
    // Get main content HTML
    const html = await page.evaluate(() => {
      // Try to find main content area
      const main = document.querySelector('main, .main-content, #content, .content, [role="main"]');
      return main ? main.innerHTML : document.body.innerHTML;
    });
    
    // Convert to markdown
    const markdown = turndown.turndown(html);
    
    // Clean up markdown
    const cleanedMarkdown = this.cleanMarkdown(markdown);
    
    // Extract text content for preview
    const textContent = await page.evaluate(() => {
      const main = document.querySelector('main, .main-content, #content, .content, [role="main"]');
      return (main || document.body).innerText;
    });
    
    return {
      url,
      title,
      markdown: cleanedMarkdown,
      textContent: textContent.substring(0, 1000),
      html: html.substring(0, 5000), // Store first 5k chars of HTML for reference
      metadata: {
        crawledAt: new Date().toISOString(),
        pageTitle: title,
        url: url,
        contentLength: cleanedMarkdown.length
      }
    };
  }

  cleanMarkdown(markdown) {
    return markdown
      // Remove excessive newlines
      .replace(/\n{3,}/g, '\n\n')
      // Remove empty links
      .replace(/\[]\(\)/g, '')
      // Clean up spaces
      .replace(/[ \t]+/g, ' ')
      // Remove trailing spaces
      .replace(/[ \t]+$/gm, '')
      .trim();
  }

  async extractLinks(page) {
    const links = await page.evaluate((baseUrl) => {
      const anchors = document.querySelectorAll('a[href]');
      const urls = [];
      
      anchors.forEach(anchor => {
        const href = anchor.href;
        // Only include internal links
        if (href && (href.includes('aoma-stage.smcdp-de.net') || href.startsWith('/'))) {
          // Skip logout, external links, and downloads
          if (!href.includes('logout') && 
              !href.includes('download') && 
              !href.includes('.pdf') &&
              !href.includes('.zip') &&
              !href.includes('#')) {
            urls.push(href);
          }
        }
      });
      
      return [...new Set(urls)]; // Remove duplicates
    }, this.baseUrl);
    
    return links;
  }

  async generateEmbedding(text) {
    try {
      // Truncate to fit token limits
      const truncatedText = text.substring(0, 8000);

      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: truncatedText
      });

      return response.data[0].embedding;
    } catch (error) {
      console.warn('Failed to generate embedding:', error.message);
      // Return zero vector as fallback
      return new Array(1536).fill(0);
    }
  }

  async storeInVectorDb(content) {
    try {
      // Generate embedding
      const embedding = await this.generateEmbedding(content.markdown);
      
      // Store in Supabase
      const { data, error } = await supabase
        .from('aoma_unified_vectors')
        .upsert({
          content: content.markdown,
          embedding: embedding,
          source_type: 'knowledge', // Use 'knowledge' as it's in your CHECK constraint
          source_id: content.url,
          metadata: content.metadata,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'source_type,source_id'
        });
      
      if (error) {
        console.error('❌ Failed to store in database:', error);
      } else {
        console.log(`✅ Stored: ${content.title} (${content.markdown.length} chars)`);
      }
      
      // Also save locally for reference
      const filename = content.url.replace(/[^a-z0-9]/gi, '_') + '.md';
      const outputPath = path.join(process.cwd(), 'tmp/crawled-content', filename);
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, content.markdown);
      
    } catch (error) {
      console.error('❌ Storage error:', error.message);
    }
  }

  async crawlAomaPages() {
    // Define key pages to crawl
    const keyPages = [
      '/',
      '/aoma-ui/my-aoma-files',
      '/aoma-ui/simple-upload',
      '/aoma-ui/direct-upload',
      '/aoma-ui/product-metadata-viewer',
      '/aoma-ui/unified-submission-tool',
      '/aoma-ui/registration-job-status',
      '/aoma-ui/qc-notes',
      '/aoma-ui/video-metadata',
      '/aoma-ui/unregister-assets'
    ];
    
    console.log(`🕷️ Starting crawl of ${keyPages.length} key pages...\n`);
    
    for (const pagePath of keyPages) {
      await this.crawlPage(pagePath, 0, 1); // Depth 1 to get immediate linked pages
    }
    
    console.log(`\n✅ Crawling complete! Processed ${this.processedUrls.size} pages`);
  }

  async testVectorSearch(query) {
    console.log(`\n🔍 Testing vector search with query: "${query}"`);
    
    try {
      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(query);
      
      // Search in Supabase
      const { data, error } = await supabase.rpc('match_aoma_vectors', {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: 5
      });
      
      if (error) {
        console.error('Search error:', error);
        return;
      }
      
      console.log(`\n📊 Found ${data.length} results:`);
      data.forEach((result, i) => {
        console.log(`${i + 1}. ${result.metadata?.pageTitle || 'Untitled'}`);
        console.log(`   Similarity: ${(result.similarity * 100).toFixed(1)}%`);
        console.log(`   URL: ${result.source_id}`);
        console.log(`   Preview: ${result.content.substring(0, 100)}...`);
        console.log('');
      });
      
    } catch (error) {
      console.error('Search failed:', error.message);
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

async function main() {
  const crawler = new AomaPlaywrightCrawler();
  
  try {
    // Initialize browser with auth
    await crawler.initialize();
    
    // Crawl AOMA pages
    await crawler.crawlAomaPages();
    
    // Test the vector search
    await crawler.testVectorSearch('upload files to AOMA');
    await crawler.testVectorSearch('metadata viewer');
    
  } catch (error) {
    console.error('❌ Crawler failed:', error);
  } finally {
    await crawler.cleanup();
  }
}

// Run the crawler
main().catch(console.error);