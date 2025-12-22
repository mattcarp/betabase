#!/usr/bin/env npx tsx
/**
 * Deep dive into jira_tickets table structure
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log('🔍 Deep dive into jira_tickets table\n');

  // Get sample rows with all fields
  const { data, error } = await supabase
    .from('jira_tickets')
    .select('*')
    .limit(5);

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No data found in jira_tickets');
    return;
  }

  // Show schema
  console.log('📋 Table Schema (fields found):');
  const firstRow = data[0];
  for (const [key, value] of Object.entries(firstRow)) {
    const type = Array.isArray(value) 
      ? `array[${value.length}]` 
      : typeof value === 'object' && value !== null
        ? 'object'
        : typeof value;
    const preview = type === 'string' && (value as string).length > 100
      ? (value as string).substring(0, 100) + '...'
      : type === 'object' && value !== null
        ? JSON.stringify(value).substring(0, 100) + '...'
        : String(value);
    console.log(`  ${key}: ${type}`);
  }

  // Show sample data
  console.log('\n📝 Sample JIRA tickets:\n');
  for (const row of data) {
    console.log('=' .repeat(70));
    console.log(`ID: ${row.id}`);
    console.log(`External ID: ${row.external_id}`);
    console.log(`Title: ${row.title}`);
    console.log(`Status: ${row.status}`);
    console.log(`Priority: ${row.priority}`);
    console.log(`Description: ${row.description ? (row.description.length > 500 ? row.description.substring(0, 500) + '...' : row.description) : 'N/A'}`);
    console.log(`Metadata: ${row.metadata ? JSON.stringify(row.metadata).substring(0, 200) : 'N/A'}`);
    console.log(`Has Embedding: ${row.embedding ? 'Yes (' + row.embedding.length + ' dims)' : 'No'}`);
    console.log('');
  }

  // Get total with description
  const { count: withDesc } = await supabase
    .from('jira_tickets')
    .select('*', { count: 'exact', head: true })
    .not('description', 'is', null)
    .neq('description', '');

  const { count: withTitle } = await supabase
    .from('jira_tickets')
    .select('*', { count: 'exact', head: true })
    .not('title', 'is', null);

  const { count: withEmbedding } = await supabase
    .from('jira_tickets')
    .select('*', { count: 'exact', head: true })
    .not('embedding', 'is', null);

  console.log('\n📊 Content Statistics:');
  console.log(`  Total rows: 10,927`);
  console.log(`  With title: ${withTitle?.toLocaleString() || 0}`);
  console.log(`  With description: ${withDesc?.toLocaleString() || 0}`);
  console.log(`  With embedding: ${withEmbedding?.toLocaleString() || 0}`);

  // Check what tables exist
  console.log('\n📋 Checking for other vector tables...');
  
  const tablesToCheck = [
    'siam_vectors',
    'siam_chunks', 
    'siam_documents',
    'vector_store',
    'embeddings',
    'knowledge_base',
    'rag_documents'
  ];

  for (const table of tablesToCheck) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (!error) {
      console.log(`  ✅ ${table}: ${count?.toLocaleString() || 0} rows`);
    }
  }
}

main().catch(console.error);
