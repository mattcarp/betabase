#!/usr/bin/env node
/*
  Batch ingest Playwright-crawled AOMA pages into Supabase vector store.
  
  - Reads all page.md files from crawl output directory
  - Generates embeddings via OpenAI text-embedding-3-small
  - Upserts into siam_vectors with deduplication
  - Supports dry-run, checkpoint resume, and progress logging
  
  Environment variables (from .env.local):
  - AOMA_CRAWL_DIR: Source directory with crawled pages (default: tmp/pw-crawl/aoma-full)
  - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY: Supabase credentials
  - OPENAI_API_KEY: For embedding generation
  - SUPABASE_SOURCE_TYPE: Source type for siam_vectors (default: 'firecrawl')
*/

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment
const dotenv = require('dotenv');
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const CRAWL_DIR = process.env.AOMA_CRAWL_DIR || 'tmp/pw-crawl/aoma-full';
const SOURCE_TYPE = process.env.SUPABASE_SOURCE_TYPE || 'firecrawl';
const DRY_RUN = process.argv.includes('--dry-run');
const RESUME = process.argv.includes('--resume');
const CHECKPOINT_PATH = 'tmp/ingestion-checkpoint.json';
const ERRORS_PATH = 'tmp/ingestion-errors.json';
const CONCURRENCY = 10;
const BATCH_SIZE = 50;

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function saveCheckpoint(data) {
  ensureDir(path.dirname(CHECKPOINT_PATH));
  fs.writeFileSync(CHECKPOINT_PATH, JSON.stringify(data, null, 2));
}

function loadCheckpoint() {
  if (RESUME && fs.existsSync(CHECKPOINT_PATH)) {
    return JSON.parse(fs.readFileSync(CHECKPOINT_PATH, 'utf8'));
  }
  return { processedUrls: new Set(), failedUrls: [], lastIndex: 0 };
}

function saveErrors(errors) {
  ensureDir(path.dirname(ERRORS_PATH));
  fs.writeFileSync(ERRORS_PATH, JSON.stringify(errors, null, 2));
}

async function findAllMarkdownFiles(dir) {
  const results = [];
  
  function scan(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (entry.name === 'page.md') {
        // Extract URL from parent directory name or links.json
        const parentDir = path.dirname(fullPath);
        const linksPath = path.join(parentDir, 'links.json');
        let url = null;
        
        // Try to get original URL from directory name
        const dirName = path.basename(parentDir);
        try {
          // Reverse the sanitization to reconstruct URL
          const host = dirName.split('_')[0];
          const urlPath = dirName.substring(host.length).replace(/_/g, '/');
          url = `https://${host}${urlPath}`;
        } catch {}
        
        results.push({
          mdPath: fullPath,
          url: url || `https://aoma-stage.smcdp-de.net/${dirName}`,
          parentDir
        });
      }
    }
  }
  
  scan(dir);
  return results;
}

async function generateEmbedding(text, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text.slice(0, 8000), // Truncate to model limit
      });
      return response.data[0].embedding;
    } catch (err) {
      if (attempt === retries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 1000));
    }
  }
}

function computeContentHash(content) {
  const crypto = require('crypto');
  return crypto.createHash('md5').update(content.trim()).digest('hex');
}

async function upsertToSupabase(item, embedding) {
  const contentHash = computeContentHash(item.content);
  
  const { data, error } = await supabase
    .from('siam_vectors')
    .upsert({
      content: item.content,
      embedding,
      source_type: SOURCE_TYPE,
      source_id: item.url,
      metadata: {
        url: item.url,
        title: item.title,
        crawled_at: new Date().toISOString(),
        content_hash: contentHash,
        word_count: item.content.split(/\s+/).length,
        has_screenshot: item.hasScreenshot,
        crawler: 'playwright-v1.56'
      },
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'source_type,source_id'
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

function cleanMarkdownContent(md) {
  // Nuclear approach: Remove all {…} blocks recursively
  let cleaned = md;
  let prevLength;
  do {
    prevLength = cleaned.length;
    cleaned = cleaned.replace(/\{[^{}]*\}/g, '');
  } while (cleaned.length < prevLength && cleaned.includes('{'));
  
  // Remove CSS property lines
  cleaned = cleaned.replace(/^[a-z-]+\s*:\s*[^;\n]+;?\s*$/gim, '');
  
  // Remove attribute spam
  cleaned = cleaned.replace(/(style|class|id|data-[\w-]+)="[^"]*"/gi, '');
  
  // Clean up whitespace
  cleaned = cleaned.replace(/\s{3,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  
  return cleaned;
}

async function processPage(file, checkpoint) {
  if (checkpoint.processedUrls.has(file.url)) {
    return { skipped: true, url: file.url };
  }
  
  const rawContent = fs.readFileSync(file.mdPath, 'utf8');
  const hasScreenshot = fs.existsSync(path.join(file.parentDir, 'screenshot.png'));
  
  // Clean content for LLM (remove CSS bloat)
  const content = cleanMarkdownContent(rawContent);
  
  // Extract title from first heading or use URL
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : path.basename(file.url);
  
  const item = {
    url: file.url,
    content,
    title,
    hasScreenshot,
    mdPath: file.mdPath
  };
  
  // Generate embedding on CLEANED content
  const embedding = await generateEmbedding(content);
  
  // Upsert to Supabase
  if (!DRY_RUN) {
    await upsertToSupabase(item, embedding);
  }
  
  checkpoint.processedUrls.add(file.url);
  return { success: true, url: file.url, title, wordCount: content.split(/\s+/).length };
}

async function ingest() {
  console.log(`\n=== AOMA Playwright Crawl → Supabase Ingestion ===`);
  console.log(`Source: ${CRAWL_DIR}`);
  console.log(`Target: siam_vectors (source_type: ${SOURCE_TYPE})`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'FULL INGESTION'}`);
  console.log(`Resume: ${RESUME ? 'Yes' : 'No'}\n`);
  
  const checkpoint = loadCheckpoint();
  checkpoint.processedUrls = new Set(checkpoint.processedUrls || []);
  
  const files = await findAllMarkdownFiles(CRAWL_DIR);
  console.log(`📄 Found ${files.length} markdown files\n`);
  
  if (DRY_RUN) {
    console.log(`\n📊 Dry-Run Preview:`);
    console.log(`━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Total files: ${files.length}`);
    console.log(`Already processed: ${checkpoint.processedUrls.size}`);
    console.log(`To process: ${files.length - checkpoint.processedUrls.size}`);
    console.log(`Estimated embeddings cost: $${((files.length - checkpoint.processedUrls.size) * 0.00002).toFixed(4)}`);
    console.log(`\nSample URLs:`);
    files.slice(0, 5).forEach(f => console.log(`  - ${f.url}`));
    console.log(`\n✅ Dry-run complete. Remove --dry-run to execute.\n`);
    return;
  }
  
  const errors = [];
  let processed = 0;
  let skipped = 0;
  let failed = 0;
  
  // Process in batches with concurrency
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(file => processPage(file, checkpoint))
    );
    
    for (const result of results) {
      if (result.status === 'fulfilled') {
        if (result.value.skipped) {
          skipped++;
        } else {
          processed++;
          if (processed % 10 === 0) {
            console.log(`✅ Processed ${processed}/${files.length}: ${result.value.title.slice(0, 60)}...`);
          }
        }
      } else {
        failed++;
        errors.push({ error: String(result.reason), timestamp: new Date().toISOString() });
        console.error(`❌ Failed: ${result.reason}`);
      }
    }
    
    // Save checkpoint every batch
    saveCheckpoint({
      processedUrls: Array.from(checkpoint.processedUrls),
      lastIndex: i + BATCH_SIZE,
      timestamp: new Date().toISOString()
    });
  }
  
  if (errors.length > 0) {
    saveErrors(errors);
  }
  
  console.log(`\n=== Ingestion Complete ===`);
  console.log(`✅ Processed: ${processed}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Failed: ${failed}`);
  if (failed > 0) {
    console.log(`📝 Error log: ${ERRORS_PATH}`);
  }
  console.log(`\n🎉 Success!\n`);
}

ingest().catch(err => {
  console.error('❌ Ingestion failed:', err);
  process.exit(1);
});

