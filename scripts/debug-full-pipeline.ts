/**
 * Debug: Full RAG pipeline - embedding + vector search
 * Compare with what the chat API does
 * 
 * Run with: infisical run --env=dev -- npx tsx scripts/debug-full-pipeline.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function main() {
  console.log('🔍 Full Pipeline Debug\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Import the embedding service - SAME one used by SupabaseVectorService
  const { GeminiEmbeddingService } = await import('../src/services/geminiEmbeddingService');
  const embeddingService = new GeminiEmbeddingService();
  
  // Test with the EXACT query from the chat
  const query = 'Asset Upload Sorting Failed error - do we have any JIRA tickets about this exact error?';
  console.log(`Query: "${query.substring(0, 50)}..."\n`);
  
  // Generate embedding
  console.log('Generating embedding...');
  const embedding = await embeddingService.generateEmbedding(query);
  console.log(`Embedding: ${embedding.length} dimensions\n`);
  console.log(`First 5 values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}]`);
  
  // Call RPC with JIRA filter
  console.log('\n\nCalling match_siam_vectors_gemini with JIRA filter...\n');
  
  const { data: jiraResults, error: jiraError } = await supabase.rpc('match_siam_vectors_gemini', {
    p_organization: 'sony-music',
    p_division: 'digital-operations',
    p_app_under_test: 'aoma',
    query_embedding: JSON.stringify(embedding),
    match_threshold: 0.25,
    match_count: 20,
    filter_source_types: ['jira'],
  });

  if (jiraError) {
    console.log(`❌ Error: ${jiraError.message}`);
    return;
  }

  console.log(`✅ Found ${jiraResults?.length || 0} JIRA tickets\n`);
  console.log('Top 15 results:');
  jiraResults?.slice(0, 15).forEach((r: any, i: number) => {
    const preview = r.content?.substring(0, 60).replace(/\n/g, ' ');
    const hasTarget = r.content?.includes('Asset Upload Sorting Failed');
    console.log(`  ${(i + 1).toString().padStart(2)}. [${(r.similarity * 100).toFixed(1)}%] ${r.source_id} ${hasTarget ? '✅ TARGET' : ''}`);
    console.log(`      ${preview}...`);
  });

  // Count how many target tickets are in results
  const targetCount = jiraResults?.filter((r: any) => 
    r.content?.includes('Asset Upload Sorting Failed') ||
    r.source_id?.match(/ITSM-(55968|56940|71656|74175)/)
  ).length || 0;

  console.log(`\n📊 TARGET TICKETS IN RESULTS: ${targetCount} of 4`);
  
  if (targetCount === 0) {
    console.log('\n⚠️  TARGET TICKETS NOT FOUND! Let me try a simpler query...\n');
    
    // Try simpler query
    const simpleQuery = 'Asset Upload Sorting Failed';
    const simpleEmbedding = await embeddingService.generateEmbedding(simpleQuery);
    
    console.log(`Simple query: "${simpleQuery}"`);
    console.log(`Embedding: ${simpleEmbedding.length} dimensions`);
    console.log(`First 5 values: [${simpleEmbedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}]`);
    
    const { data: simpleResults } = await supabase.rpc('match_siam_vectors_gemini', {
      p_organization: 'sony-music',
      p_division: 'digital-operations',
      p_app_under_test: 'aoma',
      query_embedding: JSON.stringify(simpleEmbedding),
      match_threshold: 0.25,
      match_count: 10,
      filter_source_types: ['jira'],
    });

    console.log(`\n✅ Simple query found ${simpleResults?.length || 0} results:`);
    simpleResults?.slice(0, 5).forEach((r: any, i: number) => {
      const hasTarget = r.content?.includes('Asset Upload Sorting Failed');
      console.log(`  ${i + 1}. [${(r.similarity * 100).toFixed(1)}%] ${r.source_id} ${hasTarget ? '✅ TARGET' : ''}`);
    });
  }

  console.log('\n✅ Debug complete!');
}

main().catch(console.error);


