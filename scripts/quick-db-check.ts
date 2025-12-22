import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load env vars
config({ path: '.env.local' });

const supabase = createClient(
  'https://kfxetwuuzljhybfgmpuc.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log('=== QUICK DATABASE CHECK ===\n');

  // 1. Check siam_vectors content quality
  console.log('--- siam_vectors: Content Length Distribution ---');
  const { data: siamStats, error: siamErr } = await supabase
    .from('siam_vectors')
    .select('id, content, source_type, metadata')
    .limit(100);
  
  if (siamErr) {
    console.error('siam_vectors error:', siamErr);
  } else {
    const byType: Record<string, { count: number, avgLen: number, samples: string[] }> = {};
    for (const row of siamStats || []) {
      const type = row.source_type || 'unknown';
      if (!byType[type]) byType[type] = { count: 0, avgLen: 0, samples: [] };
      byType[type].count++;
      byType[type].avgLen += (row.content?.length || 0);
      if (byType[type].samples.length < 3) {
        byType[type].samples.push(row.content?.substring(0, 200) || '(empty)');
      }
    }
    for (const [type, stats] of Object.entries(byType)) {
      console.log(`\n${type.toUpperCase()}: ${stats.count} rows, avg length: ${Math.round(stats.avgLen / stats.count)} chars`);
      console.log('Samples:');
      stats.samples.forEach((s, i) => console.log(`  ${i + 1}. ${s}...`));
    }
  }

  // 2. Check jira_tickets table
  console.log('\n\n--- jira_tickets: Field Population ---');
  const { data: jiraData, error: jiraErr } = await supabase
    .from('jira_tickets')
    .select('id, external_id, title, description, metadata')
    .limit(50);

  if (jiraErr) {
    console.error('jira_tickets error:', jiraErr);
  } else {
    let hasDesc = 0;
    let hasTitle = 0;
    let hasMeta = 0;
    const richSamples: any[] = [];

    for (const row of jiraData || []) {
      if (row.title && row.title.length > 10) hasTitle++;
      if (row.description && row.description.length > 50) {
        hasDesc++;
        if (richSamples.length < 5) richSamples.push(row);
      }
      if (row.metadata && Object.keys(row.metadata).length > 0) hasMeta++;
    }

    console.log(`Of ${jiraData?.length} sampled rows:`);
    console.log(`  - Has meaningful title: ${hasTitle}`);
    console.log(`  - Has meaningful description (>50 chars): ${hasDesc}`);
    console.log(`  - Has metadata: ${hasMeta}`);

    if (richSamples.length > 0) {
      console.log('\nRichest description samples:');
      richSamples.forEach((r, i) => {
        console.log(`\n${i + 1}. ${r.external_id}: ${r.title}`);
        console.log(`   Description: ${r.description?.substring(0, 300)}...`);
      });
    }
  }

  // 3. Search for AOMA-related content
  console.log('\n\n--- Searching for "AOMA" in content ---');
  const { data: aomaResults, error: aomaErr } = await supabase
    .from('siam_vectors')
    .select('id, content, source_type, metadata')
    .ilike('content', '%aoma%')
    .limit(20);

  if (aomaErr) {
    console.error('AOMA search error:', aomaErr);
  } else {
    console.log(`Found ${aomaResults?.length} rows containing "AOMA"`);
    aomaResults?.slice(0, 5).forEach((r, i) => {
      console.log(`\n${i + 1}. [${r.source_type}] ${r.content?.substring(0, 300)}...`);
    });
  }

  // 4. Get total row counts
  console.log('\n\n--- Total Row Counts ---');
  const { count: siamCount } = await supabase.from('siam_vectors').select('*', { count: 'exact', head: true });
  const { count: jiraCount } = await supabase.from('jira_tickets').select('*', { count: 'exact', head: true });
  console.log(`siam_vectors: ${siamCount} rows`);
  console.log(`jira_tickets: ${jiraCount} rows`);
}

main().catch(console.error);
