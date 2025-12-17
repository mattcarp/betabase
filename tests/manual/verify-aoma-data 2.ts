/**
 * Verify AOMA Data in Multi-Tenant Vector Store
 */

// Load environment variables
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../../.env.local') });

import { supabase, DEFAULT_APP_CONTEXT } from '../../src/lib/supabase';

async function verifyAOMAData() {
  console.log('\n🔍 Verifying AOMA data in multi-tenant vector store...\n');

  // Check total vectors for AOMA
  const { count, error } = await supabase
    .from('siam_vectors')
    .select('id', { count: 'exact', head: true })
    .eq('organization', DEFAULT_APP_CONTEXT.organization)
    .eq('division', DEFAULT_APP_CONTEXT.division)
    .eq('app_under_test', DEFAULT_APP_CONTEXT.app_under_test);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`✅ Total AOMA vectors: ${count}`);

  // Check by source type
  const sourceTypes = ['knowledge', 'jira', 'git', 'firecrawl', 'openai_import'];
  
  for (const sourceType of sourceTypes) {
    const { count: typeCount } = await supabase
      .from('siam_vectors')
      .select('id', { count: 'exact', head: true })
      .eq('organization', DEFAULT_APP_CONTEXT.organization)
      .eq('division', DEFAULT_APP_CONTEXT.division)
      .eq('app_under_test', DEFAULT_APP_CONTEXT.app_under_test)
      .eq('source_type', sourceType);
    
    if (typeCount && typeCount > 0) {
      console.log(`  - ${sourceType}: ${typeCount} vectors`);
    }
  }

  // Sample some AOMA content
  console.log('\n📄 Sample AOMA content:\n');
  
  const { data: samples } = await supabase
    .from('siam_vectors')
    .select('source_type, content, metadata')
    .eq('organization', DEFAULT_APP_CONTEXT.organization)
    .eq('division', DEFAULT_APP_CONTEXT.division)
    .eq('app_under_test', DEFAULT_APP_CONTEXT.app_under_test)
    .limit(5);

  samples?.forEach((sample, i) => {
    console.log(`${i + 1}. [${sample.source_type}] ${sample.content.substring(0, 100)}...`);
    console.log(`   Metadata:`, JSON.stringify(sample.metadata).substring(0, 100));
    console.log('');
  });
}

verifyAOMAData().then(() => process.exit(0));

