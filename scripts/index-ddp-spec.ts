#!/usr/bin/env ts-node

/**
 * Quick script to index the new DDP technical specification document
 * into the siam_vectors table so the chat can find it.
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

async function indexDDPSpec() {
  console.log('📄 Reading DDP specification document...\n');
  
  // Read the markdown file
  const filePath = join(__dirname, '..', 'docs', 'audio', 'ddp-technical-specifications.md');
  const content = readFileSync(filePath, 'utf-8');
  
  console.log(`✅ Read ${content.length} characters\n`);
  
  // Truncate content if needed (OpenAI limit is ~8000 tokens)
  const truncatedContent = content.length > 30000 ? content.substring(0, 30000) : content;
  
  // Generate embedding using OpenAI (same as the system uses)
  console.log('🧠 Generating 1536-dimensional embedding with OpenAI...\n');
  const { embedding } = await embed({
    model: openai.embedding("text-embedding-3-small"),
    value: truncatedContent,
  });
  
  console.log(`✅ Generated ${embedding.length}-dimensional embedding\n`);
  
  // Initialize Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // Prepare the document (matching multi-tenant schema)
  const document = {
    organization: 'sony-music',
    division: 'digital-ops',
    app_under_test: 'aoma',
    content: content,
    embedding: embedding,
    source_type: 'knowledge', // Technical documentation
    source_id: 'docs/audio/ddp-technical-specifications.md',
    metadata: {
      source_name: 'DDP Technical Specifications',
      file_path: 'docs/audio/ddp-technical-specifications.md',
      title: 'DDP (Disc Description Protocol) Technical Specifications',
      description: 'Complete technical specifications for DDP format including Red Book audio standard, sector structure, and manufacturing workflow',
      keywords: ['DDP', 'Red Book', 'CD', 'audio', '2352 bytes', '74 minutes', '99 tracks', 'sector', 'SACD', 'Blu-ray', 'manufacturing', 'Red Book standard'],
      indexed_at: new Date().toISOString(),
      doc_type: 'technical-specification',
    },
    updated_at: new Date().toISOString(),
  };
  
  console.log('💾 Upserting to siam_vectors table...\n');
  
  // Upsert to database
  const { data, error } = await supabase
    .from('siam_vectors')
    .upsert(document, {
      onConflict: 'organization,division,app_under_test,source_type,source_id', // Multi-tenant unique constraint
      ignoreDuplicates: false,
    })
    .select();
  
  if (error) {
    console.error('❌ Error upserting document:', error);
    process.exit(1);
  }
  
  console.log('✅ Successfully indexed DDP specification!\n');
  console.log('📊 Document details:');
  console.log(`   - Content length: ${content.length} characters`);
  console.log(`   - Embedding dimensions: ${embedding.length}`);
  console.log(`   - Source type: knowledge`);
  console.log(`   - Organization: sony-music`);
  console.log(`   - Division: digital-ops`);
  console.log(`   - App under test: aoma`);
  console.log(`\n🎯 Now try asking in the chat:`);
  console.log(`   "On a DDP, how many bytes are in a sector?"`);
  console.log(`   "What are the DDP standards and what can they be used for?"`);
  console.log(`\n   It should now answer with the correct specs! 🚀\n`);
}

// Run the script
indexDDPSpec().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

