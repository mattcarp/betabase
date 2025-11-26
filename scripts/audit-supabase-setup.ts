import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 SUPABASE SETUP AUDIT\n');
console.log('=' .repeat(80));
console.log('\n📍 INSTANCE INFORMATION');
console.log('-'.repeat(80));
console.log('URL:', supabaseUrl);
console.log('Service Key exists:', !!supabaseServiceKey);
console.log('Instance Type:', supabaseUrl?.includes('127.0.0.1') ? 'LOCAL' : 'REMOTE');
console.log('');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listAllTables() {
  console.log('\n📊 TABLES IN DATABASE');
  console.log('-'.repeat(80));
  
  const { data, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .order('table_name');

  if (error) {
    // Try alternative approach
    const tables = [
      'siam_vectors',
      'test_results',
      'test_runs',
      'test_specs',
      'generated_tests',
      'test_feedback',
      'rlhf_feedback',
      'firecrawl_cache',
      'migration_status'
    ];
    
    console.log('ℹ️  Using predefined table list (schema query not available)\n');
    
    for (const table of tables) {
      const { count, error: countError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (!countError) {
        console.log(`✅ ${table.padEnd(30)} - ${count || 0} records`);
      } else {
        console.log(`❌ ${table.padEnd(30)} - Not found or no access`);
      }
    }
  } else {
    for (const row of data || []) {
      const { count } = await supabase
        .from(row.table_name)
        .select('*', { count: 'exact', head: true });
      console.log(`✅ ${row.table_name.padEnd(30)} - ${count || 0} records`);
    }
  }
}

async function checkAOMAVectors() {
  console.log('\n\n🎯 AOMA KNOWLEDGE BASE (siam_vectors)');
  console.log('-'.repeat(80));
  
  const { data: allVectors, error: allError, count: totalCount } = await supabase
    .from('siam_vectors')
    .select('*', { count: 'exact' })
    .limit(0);

  if (allError) {
    console.log('❌ siam_vectors table not accessible:', allError.message);
    return;
  }

  console.log(`Total vectors: ${totalCount || 0}`);

  // Check for AOMA-specific data
  const { data: aomaVectors, count: aomaCount } = await supabase
    .from('siam_vectors')
    .select('*', { count: 'exact' })
    .eq('app_under_test', 'aoma')
    .limit(5);

  console.log(`AOMA vectors: ${aomaCount || 0}`);
  
  if (aomaVectors && aomaVectors.length > 0) {
    console.log('\nSample AOMA records:');
    aomaVectors.forEach((v, i) => {
      console.log(`\n${i + 1}. Source: ${v.source_type}`);
      console.log(`   Content preview: ${v.content?.substring(0, 100)}...`);
      console.log(`   Metadata:`, v.metadata);
    });
  }

  // Check breakdown by source type
  const { data: sourceBreakdown } = await supabase
    .from('siam_vectors')
    .select('source_type')
    .eq('app_under_test', 'aoma');

  if (sourceBreakdown) {
    const breakdown = sourceBreakdown.reduce((acc: any, v) => {
      acc[v.source_type] = (acc[v.source_type] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📈 AOMA Data Breakdown by Source:');
    Object.entries(breakdown).forEach(([source, count]) => {
      console.log(`   ${source.padEnd(20)}: ${count}`);
    });
  }
}

async function checkTestData() {
  console.log('\n\n🧪 TEST DATA');
  console.log('-'.repeat(80));
  
  const { count: testResultsCount } = await supabase
    .from('test_results')
    .select('*', { count: 'exact', head: true });

  const { count: testRunsCount } = await supabase
    .from('test_runs')
    .select('*', { count: 'exact', head: true });

  console.log(`Test Results: ${testResultsCount || 0}`);
  console.log(`Test Runs: ${testRunsCount || 0}`);
}

async function checkRLHFData() {
  console.log('\n\n💬 RLHF FEEDBACK DATA');
  console.log('-'.repeat(80));
  
  const { count, error } = await supabase
    .from('rlhf_feedback')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.log('❌ rlhf_feedback table not accessible:', error.message);
  } else {
    console.log(`RLHF Feedback records: ${count || 0}`);
  }
}

async function testRAGQuery() {
  console.log('\n\n🤖 TESTING RAG QUERY: "What is AOMA?"');
  console.log('-'.repeat(80));
  
  // Check if we can query AOMA data
  const { data, error } = await supabase
    .from('siam_vectors')
    .select('content, metadata, source_type')
    .eq('app_under_test', 'aoma')
    .ilike('content', '%AOMA%')
    .limit(3);

  if (error) {
    console.log('❌ Error querying AOMA data:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚠️  No AOMA data found in vectors table');
    console.log('   The AI will not be able to answer "What is AOMA?"');
    return;
  }

  console.log(`✅ Found ${data.length} relevant AOMA records`);
  console.log('\nSample content that would be used to answer:');
  data.forEach((record, i) => {
    console.log(`\n${i + 1}. [${record.source_type}]`);
    console.log(`   ${record.content.substring(0, 200)}...`);
  });
}

async function main() {
  try {
    await listAllTables();
    await checkAOMAVectors();
    await checkTestData();
    await checkRLHFData();
    await testRAGQuery();
    
    console.log('\n\n' + '='.repeat(80));
    console.log('✨ AUDIT COMPLETE');
    console.log('='.repeat(80));
  } catch (err) {
    console.error('\n❌ Unexpected error:', err);
  }
}

main();
