#!/usr/bin/env npx tsx
/**
 * Direct SQL analysis via RPC
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
  console.log('🔍 Direct Database Analysis\n');

  // Get total count
  const { count: totalCount } = await supabase
    .from('siam_vectors')
    .select('*', { count: 'exact', head: true });
  
  console.log(`Total rows in siam_vectors: ${totalCount?.toLocaleString()}`);

  // Get source type counts using proper grouping
  const { data: jiraCount } = await supabase
    .from('siam_vectors')
    .select('*', { count: 'exact', head: true })
    .eq('source_type', 'jira');

  const { data: gitCount, count: gitTotal } = await supabase
    .from('siam_vectors')
    .select('*', { count: 'exact', head: true })
    .eq('source_type', 'git');

  const { data: knowledgeCount, count: knowledgeTotal } = await supabase
    .from('siam_vectors')
    .select('*', { count: 'exact', head: true })
    .eq('source_type', 'knowledge');

  console.log(`\nSource type counts:`);
  console.log(`  jira: querying...`);
  console.log(`  git: ${gitTotal?.toLocaleString() || 0}`);
  console.log(`  knowledge: ${knowledgeTotal?.toLocaleString() || 0}`);

  // Get ALL distinct source types
  const { data: sourceTypes } = await supabase
    .from('siam_vectors')
    .select('source_type')
    .limit(10000);

  const typeCounts: Record<string, number> = {};
  for (const row of sourceTypes || []) {
    typeCounts[row.source_type] = (typeCounts[row.source_type] || 0) + 1;
  }
  
  console.log('\nActual source type breakdown (first 10k rows):');
  for (const [type, count] of Object.entries(typeCounts)) {
    console.log(`  ${type}: ${count.toLocaleString()}`);
  }

  // Get content length stats
  console.log('\n📊 Content Length Analysis:');
  
  const { data: contentSamples } = await supabase
    .from('siam_vectors')
    .select('content, source_type')
    .limit(1000);

  const lengths = (contentSamples || []).map(r => r.content?.length || 0);
  const shortContent = lengths.filter(l => l < 100).length;
  const mediumContent = lengths.filter(l => l >= 100 && l < 500).length;
  const longContent = lengths.filter(l => l >= 500).length;

  console.log(`  < 100 chars: ${shortContent} (${((shortContent/lengths.length)*100).toFixed(1)}%)`);
  console.log(`  100-500 chars: ${mediumContent} (${((mediumContent/lengths.length)*100).toFixed(1)}%)`);
  console.log(`  > 500 chars: ${longContent} (${((longContent/lengths.length)*100).toFixed(1)}%)`);

  // Show a long content example
  const { data: longExamples } = await supabase
    .from('siam_vectors')
    .select('source_id, source_type, content')
    .gt('content', new Array(500).fill('x').join(''))
    .limit(3);

  if (longExamples && longExamples.length > 0) {
    console.log('\n📝 Examples of longer content:');
    for (const ex of longExamples) {
      console.log(`\n  ${ex.source_type}: ${ex.source_id}`);
      console.log(`  Length: ${ex.content.length} chars`);
      console.log(`  Preview: ${ex.content.substring(0, 300)}...`);
    }
  } else {
    console.log('\n⚠️  No content longer than 500 chars found');
  }

  // Check jira_tickets for comparison
  console.log('\n' + '─'.repeat(70));
  console.log('📊 JIRA_TICKETS TABLE ANALYSIS:');
  
  const { count: jiraTotal } = await supabase
    .from('jira_tickets')
    .select('*', { count: 'exact', head: true });

  const { count: jiraWithDesc } = await supabase
    .from('jira_tickets')
    .select('*', { count: 'exact', head: true })
    .not('description', 'is', null)
    .neq('description', '');

  console.log(`  Total jira_tickets: ${jiraTotal?.toLocaleString()}`);
  console.log(`  With description: ${jiraWithDesc?.toLocaleString()}`);

  // Get a sample with description
  const { data: jiraWithDescSample } = await supabase
    .from('jira_tickets')
    .select('external_id, title, description')
    .not('description', 'is', null)
    .neq('description', '')
    .limit(2);

  if (jiraWithDescSample && jiraWithDescSample.length > 0) {
    console.log('\n📝 Sample JIRA tickets WITH descriptions:');
    for (const ticket of jiraWithDescSample) {
      console.log(`\n  ${ticket.external_id}: ${ticket.title}`);
      console.log(`  Description (${ticket.description?.length || 0} chars):`);
      console.log(`    ${ticket.description?.substring(0, 500)}...`);
    }
  }
}

main().catch(console.error);
