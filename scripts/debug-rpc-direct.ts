/**
 * Debug: Test RPC function directly
 * 
 * Run with: infisical run --env=dev -- npx tsx scripts/debug-rpc-direct.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function main() {
  console.log('🔍 Testing RPC Functions Directly\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Import the embedding service
  const { GeminiEmbeddingService } = await import('../src/services/geminiEmbeddingService');
  
  const embeddingService = new GeminiEmbeddingService();
  
  // Get embedding for our query
  const query = 'Asset Upload Sorting Failed error';
  console.log(`Query: "${query}"`);
  console.log('Generating embedding...');
  
  const embedding = await embeddingService.generateEmbedding(query);
  console.log(`Embedding generated: ${embedding.length} dimensions\n`);

  // Try the Gemini RPC
  console.log('Calling match_siam_vectors_gemini...\n');
  
  const { data: results, error } = await supabase.rpc('match_siam_vectors_gemini', {
    p_organization: 'sony-music',
    p_division: 'digital-operations',
    p_app_under_test: 'aoma',
    query_embedding: JSON.stringify(embedding),
    match_threshold: 0.25,
    match_count: 20,
    filter_source_types: ['jira'],
  });

  if (error) {
    console.log(`❌ RPC error: ${error.message}`);
    console.log('Full error:', error);
  } else {
    console.log(`✅ Found ${results?.length || 0} JIRA tickets\n`);
    
    // Check for our target ticket
    const targetTickets = results?.filter((r: any) => 
      r.content?.includes('Asset Upload Sorting Failed') ||
      r.source_id?.includes('ITSM-55968')
    );
    
    console.log(`Tickets mentioning "Asset Upload Sorting Failed": ${targetTickets?.length || 0}\n`);
    
    console.log('Top 10 results:');
    results?.slice(0, 10).forEach((r: any, i: number) => {
      const preview = r.content?.substring(0, 80).replace(/\n/g, ' ');
      const hasTarget = r.content?.includes('Asset Upload Sorting Failed');
      console.log(`  ${i + 1}. [${r.similarity?.toFixed(3)}] ${r.source_id} ${hasTarget ? '✅ TARGET' : ''}`);
      console.log(`     ${preview}...`);
    });
  }

  console.log('\n✅ Debug complete!');
}

main().catch(console.error);









