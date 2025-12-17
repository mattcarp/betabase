/**
 * Debug: Search for code in vectors
 * 
 * Run with: infisical run --env=dev -- npx tsx scripts/debug-code-search.ts
 */

import { createClient } from '@supabase/supabase-js';
import { getGeminiEmbeddingService } from '../src/services/geminiEmbeddingService';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const embeddingService = getGeminiEmbeddingService();
  
  const query = "asset sorting by sequence and side reducers dolby";
  
  console.log("🔍 Query:", query);
  
  // Generate embedding
  const embedding = await embeddingService.generateEmbedding(query);
  
  console.log("✅ Embedding generated, length:", embedding.length);
  
  // Search for code specifically
  const { data, error } = await supabase.rpc('match_siam_vectors_gemini', {
    query_embedding: embedding,
    match_threshold: 0.3,
    match_count: 10,
    filter_source_types: ['git'],
    p_organization: null,
    p_division: null,
    p_app_under_test: null
  });
  
  if (error) {
    console.error("❌ Error:", error);
    return;
  }
  
  console.log("\n📊 Code Results:", data?.length || 0);
  data?.forEach((r: any, i: number) => {
    console.log(`\n${i+1}. Score: ${r.similarity.toFixed(3)}`);
    console.log(`   File: ${r.metadata?.file_path}`);
    console.log(`   Lines: ${r.metadata?.line_range}`);
    console.log(`   Functions: ${r.metadata?.functions?.join(', ') || 'N/A'}`);
    
    // Show first 300 chars
    const preview = r.content?.substring(0, 300)?.replace(/\n/g, '\n   │ ') || '';
    console.log(`   │ ${preview}...`);
  });
}

main().catch(console.error);
