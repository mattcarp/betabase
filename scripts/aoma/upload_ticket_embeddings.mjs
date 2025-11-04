#!/usr/bin/env node

/**
 * Upload JIRA ticket embeddings to Supabase
 * Creates embeddings and stores them in vector database
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment
dotenv.config({ path: ['.env.local', '.env'] });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');

const INPUT_FILE = path.join(projectRoot, 'docs/aoma/training-data/ticket-chunks.json');

// Configuration
const BATCH_SIZE = 100; // Process 100 at a time
const DELAY_MS = 1000; // 1 second between batches

console.log('🚀 JIRA Ticket Embedding Uploader\n');
console.log('════════════════════════════════════════════════════════════════════\n');

// Initialize clients
console.log('🔧 Initializing clients...');

if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY not found in environment');
  process.exit(1);
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Supabase credentials not found in environment');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('   ✅ OpenAI client initialized');
console.log('   ✅ Supabase client initialized\n');

// Check/Create table
console.log('🗄️  Checking database table...');

const { error: tableError } = await supabase
  .from('jira_tickets')
  .select('id')
  .limit(1);

if (tableError && tableError.code === '42P01') {
  console.log('   ⚠️  Table does not exist');
  console.log('   💡 Please run this SQL in Supabase:');
  console.log(`
CREATE TABLE IF NOT EXISTS jira_tickets (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  summary TEXT,
  metadata JSONB,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON jira_tickets USING ivfflat (embedding vector_cosine_ops);
  `);
  process.exit(1);
} else if (tableError) {
  console.error('   ❌ Database error:', tableError.message);
  process.exit(1);
}

console.log('   ✅ Table exists\n');

// Load chunks
console.log('📖 Loading ticket chunks...');
const chunks = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
console.log(`   ✅ Loaded ${chunks.length.toLocaleString()} chunks\n`);

// Calculate costs
const totalChars = chunks.reduce((sum, c) => sum + c.content.length, 0);
const estimatedTokens = Math.ceil(totalChars / 4); // Rough estimate
const estimatedCost = (estimatedTokens / 1000000) * 0.02; // $0.02 per 1M tokens

console.log('💰 Cost Estimate:');
console.log(`   • Total characters: ${totalChars.toLocaleString()}`);
console.log(`   • Estimated tokens: ${estimatedTokens.toLocaleString()}`);
console.log(`   • Estimated cost: $${estimatedCost.toFixed(4)}\n`);

// Check if we should proceed
console.log('⚠️  This will create embeddings and upload to Supabase');
console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

await new Promise(resolve => setTimeout(resolve, 5000));

// Process in batches
console.log('🔮 Creating embeddings and uploading...\n');

const stats = {
  total: chunks.length,
  processed: 0,
  successful: 0,
  failed: 0,
  startTime: Date.now()
};

for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
  const batch = chunks.slice(i, Math.min(i + BATCH_SIZE, chunks.length));
  const batchNum = Math.floor(i / BATCH_SIZE) + 1;
  const totalBatches = Math.ceil(chunks.length / BATCH_SIZE);
  
  console.log(`📦 Batch ${batchNum}/${totalBatches} (${batch.length} chunks)`);
  
  for (const chunk of batch) {
    try {
      // Create embedding
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: chunk.content,
        dimensions: 1536
      });
      
      const embedding = response.data[0].embedding;
      
      // Upload to Supabase
      const { error } = await supabase
        .from('jira_tickets')
        .upsert({
          id: chunk.id,
          content: chunk.content,
          summary: chunk.summary,
          metadata: chunk.metadata,
          embedding: embedding
        });
      
      if (error) {
        console.error(`   ❌ ${chunk.id}: ${error.message}`);
        stats.failed++;
      } else {
        stats.successful++;
        process.stdout.write(`   ✅ ${chunk.id}\r`);
      }
      
      stats.processed++;
      
    } catch (error) {
      console.error(`   ❌ ${chunk.id}: ${error.message}`);
      stats.failed++;
      stats.processed++;
    }
  }
  
  // Progress update
  const progress = ((stats.processed / stats.total) * 100).toFixed(1);
  const elapsed = ((Date.now() - stats.startTime) / 1000).toFixed(1);
  const rate = (stats.processed / (Date.now() - stats.startTime) * 1000).toFixed(1);
  const remaining = Math.ceil((stats.total - stats.processed) / rate);
  
  console.log(`\n   📊 Progress: ${stats.processed}/${stats.total} (${progress}%)`);
  console.log(`   ⏱️  Elapsed: ${elapsed}s | Rate: ${rate} chunks/s | ETA: ${remaining}s\n`);
  
  // Delay between batches (except last)
  if (i + BATCH_SIZE < chunks.length) {
    await new Promise(resolve => setTimeout(resolve, DELAY_MS));
  }
}

// Final summary
const totalTime = ((Date.now() - stats.startTime) / 1000).toFixed(1);
const actualCost = (stats.successful * estimatedCost / stats.total).toFixed(4);

console.log('════════════════════════════════════════════════════════════════════');
console.log('✨ Upload Complete!\n');
console.log('📊 Final Statistics:');
console.log(`   • Total processed: ${stats.processed.toLocaleString()}`);
console.log(`   • Successful: ${stats.successful.toLocaleString()}`);
console.log(`   • Failed: ${stats.failed.toLocaleString()}`);
console.log(`   • Success rate: ${((stats.successful/stats.processed)*100).toFixed(1)}%`);
console.log(`   • Total time: ${totalTime}s`);
console.log(`   • Actual cost: ~$${actualCost}\n`);

console.log('🎯 Next Steps:');
console.log('   1. Test search: node scripts/aoma/test_jira_search.mjs');
console.log('   2. Update chat API to include JIRA ticket context');
console.log('   3. Deploy and monitor quality improvements');
console.log('════════════════════════════════════════════════════════════════════\n');

