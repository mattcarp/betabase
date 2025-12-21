#!/usr/bin/env ts-node

/**
 * Embed and Store DDP Specification Chunks
 * 
 * Takes the pre-chunked DDP specs and:
 * - Generates OpenAI embeddings (1536-d)
 * - Stores in siam_vectors as AOMA knowledge
 * - Handles rate limiting and errors gracefully
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';
import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';

// Load environment variables
import { config } from 'dotenv';
config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface DDPChunk {
  content: string;
  metadata: {
    source_name: string;
    file_name: string;
    spec_version: string;
    page_start?: number;
    page_end?: number;
    chunk_index: number;
    total_chunks: number;
    doc_type: 'technical-specification' | 'errata' | 'addendum' | 'license';
    keywords: string[];
  };
}

/**
 * Sleep utility for rate limiting
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Embed and store chunks in batches
 */
async function embedAndStoreChunks() {
  console.log('🚀 DDP Specification Embedding & Storage\n');
  console.log('═'.repeat(70));
  
  // Load pre-chunked data
  const chunksPath = join(__dirname, 'ddp-chunks-ready-for-embedding.json');
  const chunks: DDPChunk[] = JSON.parse(readFileSync(chunksPath, 'utf-8'));
  
  console.log(`\n📊 Loaded ${chunks.length} chunks\n`);
  
  // Initialize Supabase
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  let successCount = 0;
  let errorCount = 0;
  
  // Process chunks with rate limiting (3 per second for OpenAI)
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const progress = `[${i + 1}/${chunks.length}]`;
    
    try {
      console.log(`${progress} Processing: ${chunk.metadata.file_name} (chunk ${chunk.metadata.chunk_index}/${chunk.metadata.total_chunks})`);
      
      // Generate embedding
      const { embedding } = await embed({
        model: openai.embedding("text-embedding-3-small"),
        value: chunk.content,
      });
      
      console.log(`   ✅ Embedded (${embedding.length} dimensions)`);
      
      // Prepare document for storage
      const document = {
        organization: 'sony-music',
        division: 'digital-ops',
        app_under_test: 'aoma',
        content: chunk.content,
        embedding: embedding,
        source_type: 'knowledge', // AOMA general knowledge (NOT jira)
        source_id: `ddp-spec-${chunk.metadata.spec_version}-chunk-${chunk.metadata.chunk_index}`,
        metadata: {
          ...chunk.metadata,
          indexed_at: new Date().toISOString(),
          content_type: 'ddp-specification',
          categories: ['audio', 'mastering', 'manufacturing', 'technical-specification'],
        },
        updated_at: new Date().toISOString(),
      };
      
      // Store in database
      const { error } = await supabase
        .from('siam_vectors')
        .upsert(document, {
          onConflict: 'organization,division,app_under_test,source_type,source_id',
          ignoreDuplicates: false,
        });
      
      if (error) {
        console.error(`   ❌ Database error:`, error.message);
        errorCount++;
      } else {
        console.log(`   ✅ Stored in siam_vectors`);
        successCount++;
      }
      
      // Rate limiting: ~3 requests per second
      if ((i + 1) % 3 === 0 && i + 1 < chunks.length) {
        await sleep(1000);
      }
      
    } catch (error: any) {
      console.error(`   ❌ Error:`, error.message);
      errorCount++;
      
      // If quota error, stop immediately
      if (error.message?.includes('quota') || error.message?.includes('insufficient')) {
        console.error(`\n🚨 OpenAI quota exceeded! Stopping.`);
        console.error(`   Progress: ${successCount}/${chunks.length} chunks stored\n`);
        break;
      }
      
      // Otherwise, continue with next chunk
      continue;
    }
  }
  
  console.log('\n' + '═'.repeat(70));
  console.log(`\n✅ DDP Specification Ingestion Complete!\n`);
  console.log(`📊 Results:`);
  console.log(`   - Total chunks: ${chunks.length}`);
  console.log(`   - Successfully stored: ${successCount}`);
  console.log(`   - Errors: ${errorCount}`);
  console.log(`   - Success rate: ${((successCount / chunks.length) * 100).toFixed(1)}%`);
  
  if (successCount > 0) {
    console.log(`\n🎯 Test the knowledge base:`);
    console.log(`   Ask: "On a DDP, how many bytes are in a sector?"`);
    console.log(`   Ask: "What are the different DDP standards?"`);
    console.log(`   Ask: "What's the maximum number of tracks on a CD?"`);
    console.log(`\n   The system should now answer with detailed DDP specs! 🚀\n`);
  }
}

// Run the script
embedAndStoreChunks().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});





