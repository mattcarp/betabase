/**
 * Debug: Why isn't vector search finding "Asset Upload Sorting Failed" tickets?
 * 
 * Run with: infisical run --env=dev -- npx tsx scripts/debug-vector-search.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function main() {
  console.log('🔍 Debugging Vector Search for "Asset Upload Sorting Failed"\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Step 1: Check if the tickets exist
  console.log('Step 1: Looking for tickets with exact phrase...\n');
  
  const { data: exactMatch } = await supabase
    .from('siam_vectors')
    .select('id, source_id, content, metadata')
    .eq('source_type', 'jira')
    .ilike('content', '%Asset Upload Sorting Failed%')
    .limit(10);

  console.log(`Found ${exactMatch?.length || 0} tickets with exact phrase "Asset Upload Sorting Failed":\n`);
  exactMatch?.forEach((t, i) => {
    console.log(`  ${i + 1}. ${t.source_id}: ${t.content?.substring(0, 100)}...`);
  });

  // Step 2: Check what's in the JIRA tickets overall
  console.log('\n\nStep 2: Checking total JIRA tickets...\n');
  
  const { count: totalJira } = await supabase
    .from('siam_vectors')
    .select('*', { count: 'exact', head: true })
    .eq('source_type', 'jira');

  console.log(`Total JIRA tickets in vector store: ${totalJira}`);

  // Step 3: Check what the actual ticket content looks like
  if (exactMatch && exactMatch.length > 0) {
    console.log('\n\nStep 3: Full content of first matching ticket:\n');
    console.log('─'.repeat(60));
    console.log(exactMatch[0].content);
    console.log('─'.repeat(60));
    console.log('\nMetadata:', JSON.stringify(exactMatch[0].metadata, null, 2));
  }

  // Step 4: Check if embeddings exist
  console.log('\n\nStep 4: Checking if tickets have embeddings...\n');
  
  const { data: withEmbedding } = await supabase
    .from('siam_vectors')
    .select('id, source_id, embedding')
    .eq('source_type', 'jira')
    .ilike('content', '%Asset Upload Sorting Failed%')
    .limit(1);

  if (withEmbedding && withEmbedding.length > 0) {
    const hasEmbedding = withEmbedding[0].embedding !== null;
    console.log(`Ticket ${withEmbedding[0].source_id} has embedding: ${hasEmbedding ? '✅ Yes' : '❌ No'}`);
    
    if (hasEmbedding) {
      console.log(`Embedding length: ${withEmbedding[0].embedding?.length || 0}`);
    }
  }

  // Step 5: Check the organization/division/app_under_test filters
  console.log('\n\nStep 5: Checking multi-tenant filters on tickets...\n');
  
  const { data: withFilters } = await supabase
    .from('siam_vectors')
    .select('id, source_id, organization, division, app_under_test')
    .eq('source_type', 'jira')
    .ilike('content', '%Asset Upload Sorting Failed%')
    .limit(5);

  withFilters?.forEach((t, i) => {
    console.log(`  ${i + 1}. ${t.source_id}:`);
    console.log(`     organization: ${t.organization || 'NULL'}`);
    console.log(`     division: ${t.division || 'NULL'}`);
    console.log(`     app_under_test: ${t.app_under_test || 'NULL'}`);
  });

  console.log('\n✅ Debug complete!');
  console.log('\nIf tickets have embeddings but aren\'t found, the issue is likely:');
  console.log('  1. Multi-tenant filters (org/division/app) don\'t match');
  console.log('  2. Source type filter excludes JIRA');
  console.log('  3. Embedding similarity threshold too high');
}

main().catch(console.error);








