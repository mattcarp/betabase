/**
 * Direct Query to AOMA Vector Store (bypasses app initialization)
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local
config({ path: resolve(__dirname, '../../.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log('\n🔍 Connecting to Supabase...');
console.log(`URL: ${url}`);
console.log(`Key: ${key?.substring(0, 20)}...`);

const supabase = createClient(url, key);

async function queryAOMAData() {
  console.log('\n📊 Querying AOMA data in siam_vectors table...\n');

  // Query total count
  const { count, error } = await supabase
    .from('siam_vectors')
    .select('id', { count: 'exact', head: true })
    .eq('organization', 'sony-music')
    .eq('division', 'digital-operations')
    .eq('app_under_test', 'aoma');

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`✅ Total AOMA vectors: ${count}\n`);

  // Query by source type
  const { data: stats } = await supabase
    .from('siam_vectors')
    .select('source_type')
    .eq('organization', 'sony-music')
    .eq('division', 'digital-operations')
    .eq('app_under_test', 'aoma');

  if (stats) {
    const sourceCounts = stats.reduce((acc, row) => {
      acc[row.source_type] = (acc[row.source_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('📈 Breakdown by source type:');
    Object.entries(sourceCounts).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count} vectors`);
    });
  }

  // Sample content
  console.log('\n📄 Sample AOMA content (first 3 rows):\n');
  
  const { data: samples } = await supabase
    .from('siam_vectors')
    .select('source_type, content, metadata, created_at')
    .eq('organization', 'sony-music')
    .eq('division', 'digital-operations')
    .eq('app_under_test', 'aoma')
    .order('created_at', { ascending: false })
    .limit(3);

  samples?.forEach((sample, i) => {
    console.log(`${i + 1}. [${sample.source_type}] (${sample.created_at})`);
    console.log(`   Content: ${sample.content.substring(0, 150).replace(/\n/g, ' ')}...`);
    if (sample.metadata.title || sample.metadata.url) {
      console.log(`   Title: ${sample.metadata.title || sample.metadata.url || 'N/A'}`);
    }
    console.log('');
  });
}

queryAOMAData().then(() => {
  console.log('✅ Query complete!');
  process.exit(0);
}).catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});






