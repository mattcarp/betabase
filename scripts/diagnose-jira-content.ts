#!/usr/bin/env npx tsx

/**
 * Diagnose JIRA content in all tables
 * Run: npx tsx scripts/diagnose-jira-content.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function diagnose() {
  console.log('🔍 JIRA CONTENT DIAGNOSIS');
  console.log('='.repeat(70));

  // 1. Check jira_ticket_embeddings table (source of migration)
  console.log('\n📊 TABLE: jira_ticket_embeddings');
  
  const { data: embedStats, error: embedErr } = await supabase.rpc('exec_sql', {
    query: `
      SELECT 
        COUNT(*) as total,
        COUNT(description) FILTER (WHERE description IS NOT NULL AND description != '') as with_description,
        COUNT(embedding) FILTER (WHERE embedding IS NOT NULL) as with_embedding,
        AVG(LENGTH(summary)) as avg_summary_len,
        AVG(LENGTH(COALESCE(description, ''))) as avg_desc_len
      FROM jira_ticket_embeddings
    `
  });
  
  if (embedErr) {
    // Table might not exist or RPC not available, try direct query
    const { count: embedCount } = await supabase
      .from('jira_ticket_embeddings')
      .select('*', { count: 'exact', head: true });
    console.log(`  Total rows: ${embedCount || 'table not found'}`);
    
    // Sample content
    const { data: embedSample } = await supabase
      .from('jira_ticket_embeddings')
      .select('ticket_key, summary, description')
      .not('description', 'is', null)
      .limit(5);
    
    if (embedSample?.length) {
      console.log('\n  Sample rows WITH descriptions:');
      embedSample.forEach(row => {
        console.log(`    ${row.ticket_key}: "${row.summary?.substring(0, 50)}..."`);
        console.log(`      Desc (${row.description?.length || 0} chars): "${row.description?.substring(0, 100)}..."`);
      });
    } else {
      console.log('  ⚠️  NO rows with descriptions found!');
    }
  } else {
    console.log('  Stats:', embedStats);
  }

  // 2. Check jira_tickets table
  console.log('\n📊 TABLE: jira_tickets');
  
  const { count: ticketCount } = await supabase
    .from('jira_tickets')
    .select('*', { count: 'exact', head: true });
  console.log(`  Total rows: ${ticketCount}`);

  const { data: ticketSample } = await supabase
    .from('jira_tickets')
    .select('external_id, title, description, status, priority')
    .not('description', 'is', null)
    .neq('description', '')
    .neq('description', '[Refreshed by automated system]')
    .limit(5);
  
  if (ticketSample?.length) {
    console.log('\n  Sample rows WITH real descriptions:');
    ticketSample.forEach(row => {
      console.log(`    ${row.external_id}: "${row.title?.substring(0, 50)}..."`);
      console.log(`      Desc (${row.description?.length || 0} chars): "${row.description?.substring(0, 100)}..."`);
    });
  } else {
    console.log('  ⚠️  NO rows with real descriptions found!');
  }

  // 3. Check siam_vectors JIRA content
  console.log('\n📊 TABLE: siam_vectors (source_type=jira)');
  
  const { count: siamJiraCount } = await supabase
    .from('siam_vectors')
    .select('*', { count: 'exact', head: true })
    .eq('source_type', 'jira');
  console.log(`  Total JIRA rows: ${siamJiraCount}`);

  const { data: siamSample } = await supabase
    .from('siam_vectors')
    .select('source_id, content')
    .eq('source_type', 'jira')
    .order('id', { ascending: false })
    .limit(10);
  
  if (siamSample?.length) {
    console.log('\n  Sample JIRA content in siam_vectors:');
    siamSample.forEach(row => {
      console.log(`    ${row.source_id} (${row.content?.length || 0} chars):`);
      console.log(`      "${row.content?.substring(0, 150)}..."`);
    });

    // Content length distribution
    const { data: lengthDist } = await supabase
      .from('siam_vectors')
      .select('content')
      .eq('source_type', 'jira');
    
    if (lengthDist) {
      const lengths = lengthDist.map(r => r.content?.length || 0);
      const under100 = lengths.filter(l => l < 100).length;
      const under500 = lengths.filter(l => l >= 100 && l < 500).length;
      const over500 = lengths.filter(l => l >= 500).length;
      
      console.log('\n  Content length distribution:');
      console.log(`    Under 100 chars: ${under100} (${((under100/lengths.length)*100).toFixed(1)}%)`);
      console.log(`    100-500 chars: ${under500} (${((under500/lengths.length)*100).toFixed(1)}%)`);
      console.log(`    Over 500 chars: ${over500} (${((over500/lengths.length)*100).toFixed(1)}%)`);
      
      // Find the richest content
      const richest = lengthDist.sort((a, b) => (b.content?.length || 0) - (a.content?.length || 0)).slice(0, 3);
      console.log('\n  Richest JIRA content found:');
      richest.forEach(row => {
        console.log(`    (${row.content?.length} chars): "${row.content?.substring(0, 200)}..."`);
      });
    }
  }

  // 4. Check what tables actually exist
  console.log('\n📊 ALL TABLES with jira/ticket in name:');
  const { data: allTables } = await supabase
    .from('information_schema.tables' as any)
    .select('table_name')
    .eq('table_schema', 'public');
  
  // Direct listing attempt
  const tables = ['jira_tickets', 'jira_ticket_embeddings', 'siam_vectors', 'aoma_unified_vectors', 'documents', 'document_chunks'];
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    console.log(`  ${table}: ${error ? 'NOT FOUND' : `${count} rows`}`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('DIAGNOSIS COMPLETE');
}

diagnose().catch(console.error);
