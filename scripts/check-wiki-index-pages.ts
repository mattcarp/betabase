#!/usr/bin/env npx tsx

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function check() {
  // Check wiki_documents
  const { data: sample } = await supabase
    .from('wiki_documents')
    .select('id, title, url, markdown_content')
    .eq('app_name', 'AOMA')
    .limit(10);

  console.log('Wiki documents sample:');
  sample?.forEach((row) => {
    const isIndex = row.markdown_content?.includes('Recently Updated');
    console.log(
      `  [${isIndex ? 'INDEX' : 'CONTENT'}] ${row.title} (${row.markdown_content?.length || 0} chars)`
    );
    console.log(`    URL: ${row.url}`);
    console.log(`    Preview: ${row.markdown_content?.substring(0, 100)}...\n`);
  });

  // Count index vs content pages
  const { data: all } = await supabase
    .from('wiki_documents')
    .select('markdown_content')
    .eq('app_name', 'AOMA');

  if (all) {
    const indexPages = all.filter((r) => r.markdown_content?.includes('Recently Updated')).length;
    const contentPages = all.length - indexPages;
    console.log(`\nTotal: ${all.length} pages`);
    console.log(`  Index pages: ${indexPages}`);
    console.log(`  Content pages: ${contentPages}`);
  }
}
check().catch(console.error);
