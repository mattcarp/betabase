/**
 * Import Scraped Confluence Content to Supabase
 * 
 * Imports markdown files from mc-confluence-scraper into Supabase wiki_documents table
 * with embeddings and deduplication.
 * 
 * Usage:
 *   node scripts/import-confluence-scraped.js
 *   node scripts/import-confluence-scraped.js --source=~/Documents/projects/mc-confluence-scraper/scraped_content
 */

const fs = require('fs').promises;
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { generateEmbeddingsBatch } = require('../utils/embeddings/openai');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

// Configuration
const args = process.argv.slice(2);
const sourceArg = args.find(arg => arg.startsWith('--source='));
const SOURCE_DIR = sourceArg 
  ? sourceArg.split('=')[1].replace('~', process.env.HOME)
  : path.join(__dirname, 'confluence-scraper/scraped_content');

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Logging
const LOG_FILE = 'logs/confluence-import.log';
const logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });

async function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  process.stdout.write(logMessage);
  logStream.write(logMessage);
}

/**
 * Extract metadata from filename
 * Confluence scraper saves files like: "Page_Title_12345.md" where 12345 is page ID
 */
function extractMetadata(filename, content) {
  const nameWithoutExt = path.basename(filename, '.md');
  
  // Try to extract page ID from filename (usually at the end)
  const pageIdMatch = nameWithoutExt.match(/_(\d+)$/);
  const pageId = pageIdMatch ? pageIdMatch[1] : null;
  
  // Title is filename without extension and page ID
  const title = nameWithoutExt.replace(/_\d+$/, '').replace(/_/g, ' ');
  
  // Try to determine space from content or filename
  let space = 'UNKNOWN';
  if (content.includes('USM') || filename.includes('USM')) space = 'USM';
  else if (content.includes('AOMA') || filename.includes('AOMA')) space = 'AOMA';
  else if (content.includes('TECH') || filename.includes('TECH')) space = 'TECH';
  else if (content.includes('API') || filename.includes('API')) space = 'API';
  
  return {
    title,
    pageId,
    space,
    priority_content: ['AOMA', 'USM'].includes(space),
  };
}

/**
 * Store page in Supabase with deduplication
 */
async function storePage(filename, content, embedding, metadata) {
  const contentHash = crypto.createHash('md5').update(content).digest('hex');
  
  // Use filename-based URL since we don't have the real Confluence URL
  const url = `https://wiki.smedigitalapps.com/wiki/scraped/${path.basename(filename)}`;
  
  const { data, error } = await supabase
    .from('wiki_documents')
    .upsert({
      url,
      app_name: 'confluence',
      title: metadata.title,
      markdown_content: content,
      embedding: embedding,
      content_hash: contentHash,
      metadata: {
        space: metadata.space,
        page_id: metadata.pageId,
        sony_music: true,
        categories: ['wiki', 'documentation'],
        priority_content: metadata.priority_content,
        source: 'python_scraper',
        original_filename: path.basename(filename),
      },
      crawled_at: new Date().toISOString(),
    }, {
      onConflict: 'url,app_name',
    })
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to store ${filename}: ${error.message}`);
  }
  
  return data;
}

/**
 * Main import function
 */
async function importScrapedContent() {
  await log('🚀 Starting Confluence scraped content import');
  await log(`   Source directory: ${SOURCE_DIR}`);
  
  try {
    // Check if source directory exists
    const stats = await fs.stat(SOURCE_DIR);
    if (!stats.isDirectory()) {
      throw new Error(`${SOURCE_DIR} is not a directory`);
    }
    
    // Read all markdown files
    const files = await fs.readdir(SOURCE_DIR);
    const mdFiles = files.filter(f => f.endsWith('.md'));
    
    await log(`   Found ${mdFiles.length} markdown files`);
    
    if (mdFiles.length === 0) {
      await log('⚠️  No markdown files found in source directory');
      return;
    }
    
    // Read all file contents
    const pages = [];
    for (const file of mdFiles) {
      const filepath = path.join(SOURCE_DIR, file);
      const content = await fs.readFile(filepath, 'utf-8');
      
      // Skip empty or very short files
      if (content.trim().length < 50) {
        await log(`   ⚠️  Skipping ${file} - insufficient content`);
        continue;
      }
      
      const metadata = extractMetadata(file, content);
      pages.push({
        filename: file,
        filepath,
        content,
        metadata,
      });
    }
    
    await log(`   Processing ${pages.length} valid pages`);
    
    // Generate embeddings in batches
    await log('\n🤖 Generating embeddings...');
    const texts = pages.map(p => p.content);
    const embeddings = await generateEmbeddingsBatch(texts, {
      batchSize: 100,
      delayMs: 1000,
      onProgress: (progress) => {
        log(`   ${progress.processed}/${progress.total} embeddings generated`);
      },
    });
    
    await log(`✅ Generated ${embeddings.length} embeddings`);
    
    // Store in Supabase
    await log('\n💾 Storing pages in Supabase...');
    let stored = 0;
    let skipped = 0;
    let errors = 0;
    
    for (let i = 0; i < pages.length; i++) {
      try {
        await storePage(
          pages[i].filename,
          pages[i].content,
          embeddings[i],
          pages[i].metadata
        );
        stored++;
        
        if ((i + 1) % 10 === 0) {
          await log(`   Stored ${i + 1}/${pages.length} pages`);
        }
      } catch (error) {
        await log(`   ❌ Failed to store ${pages[i].filename}: ${error.message}`);
        errors++;
      }
    }
    
    // Summary
    await log('\n' + '='.repeat(70));
    await log('📊 IMPORT SUMMARY');
    await log('='.repeat(70));
    await log(`Source directory: ${SOURCE_DIR}`);
    await log(`Files found: ${mdFiles.length}`);
    await log(`Valid pages: ${pages.length}`);
    await log(`Stored: ${stored}`);
    await log(`Errors: ${errors}`);
    await log('='.repeat(70));
    
    // Verify in database
    const { count } = await supabase
      .from('wiki_documents')
      .select('*', { count: 'exact', head: true })
      .eq('app_name', 'confluence');
    
    await log(`\n✅ Total Confluence docs in database: ${count}`);
    await log('\n✨ Import complete!');
    
  } catch (error) {
    await log(`\n❌ Fatal error: ${error.message}`);
    await log(error.stack);
    process.exit(1);
  } finally {
    logStream.end();
  }
}

// Run import
importScrapedContent().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

