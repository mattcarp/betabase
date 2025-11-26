#!/usr/bin/env npx tsx
/**
 * Quick test: Can we now retrieve AOMA knowledge?
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const openaiKey = process.env.OPENAI_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const openai = new OpenAI({ apiKey: openaiKey });

async function test() {
  const query = "what is AOMA";
  
  console.log(`🔍 Testing: "${query}"\n`);
  
  // Generate real embedding
  console.log('Generating OpenAI embedding...');
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  });
  const queryEmbedding = embeddingResponse.data[0].embedding;
  console.log(`✅ Got ${queryEmbedding.length}-dim embedding\n`);
  
  // Search with low threshold to see what we get
  console.log('Searching siam_vectors with threshold 0.25...');
  const { data, error } = await supabase.rpc('match_siam_vectors', {
    p_organization: 'sony-music',
    p_division: 'digital-operations',
    p_app_under_test: 'aoma',
    query_embedding: queryEmbedding,
    match_threshold: 0.25,
    match_count: 10
  });
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log(`\n✅ Found ${data?.length || 0} results:\n`);
  
  data?.forEach((r: any, i: number) => {
    console.log(`${i + 1}. [${r.source_type}] Similarity: ${(r.similarity * 100).toFixed(1)}%`);
    console.log(`   ${r.content?.substring(0, 150)}...`);
    console.log('');
  });
  
  if (!data?.length) {
    console.log('⚠️  No results! Let\'s try with threshold 0.0 to see all matches...\n');
    
    const { data: allData } = await supabase.rpc('match_siam_vectors', {
      p_organization: 'sony-music',
      p_division: 'digital-operations',
      p_app_under_test: 'aoma',
      query_embedding: queryEmbedding,
      match_threshold: 0.0,
      match_count: 5
    });
    
    console.log(`With threshold 0.0: ${allData?.length || 0} results`);
    allData?.forEach((r: any, i: number) => {
      console.log(`${i + 1}. Similarity: ${(r.similarity * 100).toFixed(1)}% - ${r.content?.substring(0, 80)}...`);
    });
  }
}

test().catch(console.error);
