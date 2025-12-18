/**
 * Debug: Check which embedding column has data
 * 
 * Run with: infisical run --env=dev -- npx tsx scripts/debug-embedding-columns.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function main() {
  console.log('🔍 Debugging Embedding Columns\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Check JIRA ticket - which embedding column has data?
  const { data: ticket } = await supabase
    .from('siam_vectors')
    .select('id, source_id, embedding, embedding_gemini')
    .eq('source_type', 'jira')
    .ilike('content', '%Asset Upload Sorting Failed%')
    .limit(1)
    .single();

  if (ticket) {
    console.log(`Ticket: ${ticket.source_id}`);
    console.log(`  embedding (OpenAI 1536d): ${ticket.embedding ? `✅ Has ${ticket.embedding.length} values` : '❌ NULL'}`);
    console.log(`  embedding_gemini (768d): ${ticket.embedding_gemini ? `✅ Has ${ticket.embedding_gemini.length} values` : '❌ NULL'}`);
  }

  // Check column counts
  console.log('\n\nChecking embedding coverage:\n');

  // How many JIRA tickets have OpenAI embedding?
  const { count: withOpenAI } = await supabase
    .from('siam_vectors')
    .select('*', { count: 'exact', head: true })
    .eq('source_type', 'jira')
    .not('embedding', 'is', null);

  console.log(`JIRA with OpenAI embedding (1536d): ${withOpenAI}`);

  // How many JIRA tickets have Gemini embedding?
  const { count: withGemini } = await supabase
    .from('siam_vectors')
    .select('*', { count: 'exact', head: true })
    .eq('source_type', 'jira')
    .not('embedding_gemini', 'is', null);

  console.log(`JIRA with Gemini embedding (768d): ${withGemini}`);

  // Now check which RPC function is being called
  console.log('\n\nNow testing direct vector search...\n');

  // Get a query embedding (we'll just test with a simple query)
  const { google } = await import('@ai-sdk/google');
  const { embed } = await import('ai');
  
  const { embedding } = await embed({
    model: google.textEmbeddingModel('text-embedding-004'),
    value: 'Asset Upload Sorting Failed error',
  });

  console.log(`Query embedding dimension: ${embedding.length}`);

  // Try the Gemini RPC
  const { data: geminiResults, error: geminiError } = await supabase.rpc('match_siam_vectors_gemini', {
    p_organization: 'sony-music',
    p_division: 'digital-operations',
    p_app_under_test: 'aoma',
    query_embedding: JSON.stringify(embedding),
    match_threshold: 0.25,
    match_count: 10,
    filter_source_types: ['jira'],
  });

  if (geminiError) {
    console.log(`❌ Gemini RPC error: ${geminiError.message}`);
  } else {
    console.log(`✅ Gemini RPC returned ${geminiResults?.length || 0} results`);
    geminiResults?.slice(0, 5).forEach((r: any, i: number) => {
      console.log(`  ${i + 1}. ${r.source_id} (similarity: ${r.similarity?.toFixed(3)})`);
    });
  }

  console.log('\n✅ Debug complete!');
}

main().catch(console.error);


