#!/usr/bin/env npx tsx
/**
 * Inspect Supabase content for Google RAG Engine migration
 * Checks what data we have stored - both vectors AND original content
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface TableStats {
  table: string;
  rowCount: number;
  hasContent: boolean;
  hasEmbedding: boolean;
  sampleFields: string[];
  contentPreview?: string;
}

async function inspectTable(
  tableName: string,
  contentField: string,
  embeddingField: string = 'embedding'
): Promise<TableStats | null> {
  try {
    // Get row count
    const { count, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log(`  ⚠️  ${tableName}: ${countError.message}`);
      return null;
    }

    // Get a sample row to inspect structure
    const { data: sample, error: sampleError } = await supabase
      .from(tableName)
      .select('*')
      .limit(1)
      .single();

    if (sampleError && sampleError.code !== 'PGRST116') {
      console.log(`  ⚠️  ${tableName} sample: ${sampleError.message}`);
    }

    const hasContent = sample && sample[contentField] && sample[contentField].length > 0;
    const hasEmbedding = sample && sample[embeddingField] && sample[embeddingField].length > 0;
    const sampleFields = sample ? Object.keys(sample) : [];

    return {
      table: tableName,
      rowCount: count || 0,
      hasContent: !!hasContent,
      hasEmbedding: !!hasEmbedding,
      sampleFields,
      contentPreview: hasContent ? sample[contentField].substring(0, 200) + '...' : undefined
    };
  } catch (err) {
    console.log(`  ❌ ${tableName}: ${err}`);
    return null;
  }
}

async function getSourceTypeBreakdown() {
  console.log('\n📊 aoma_unified_vectors source_type breakdown:');
  
  const { data, error } = await supabase
    .from('aoma_unified_vectors')
    .select('source_type');

  if (error) {
    console.log(`  ⚠️  Error: ${error.message}`);
    return;
  }

  const counts: Record<string, number> = {};
  for (const row of data || []) {
    counts[row.source_type] = (counts[row.source_type] || 0) + 1;
  }

  for (const [type, count] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${type}: ${count.toLocaleString()} documents`);
  }
}

async function getSampleContent(tableName: string, contentField: string, limit: number = 3) {
  console.log(`\n📝 Sample content from ${tableName}.${contentField}:`);
  
  const { data, error } = await supabase
    .from(tableName)
    .select(`id, ${contentField}, metadata`)
    .not(contentField, 'is', null)
    .limit(limit);

  if (error) {
    console.log(`  ⚠️  Error: ${error.message}`);
    return;
  }

  for (const row of data || []) {
    const content = row[contentField] as string;
    const preview = content.length > 300 ? content.substring(0, 300) + '...' : content;
    console.log(`\n  --- ID: ${row.id} ---`);
    console.log(`  Content: ${preview}`);
    if (row.metadata) {
      console.log(`  Metadata: ${JSON.stringify(row.metadata).substring(0, 200)}`);
    }
  }
}

async function main() {
  console.log('🔍 Inspecting Supabase content for Google RAG Engine migration\n');
  console.log('=' .repeat(70));

  // Check key tables
  const tables = [
    { name: 'aoma_unified_vectors', contentField: 'content' },
    { name: 'jira_tickets', contentField: 'content' },
    { name: 'documents', contentField: 'content_md' },
    { name: 'document_chunks', contentField: 'chunk_md' },
  ];

  console.log('\n📋 Table Statistics:\n');

  const results: TableStats[] = [];
  for (const table of tables) {
    const stats = await inspectTable(table.name, table.contentField);
    if (stats) {
      results.push(stats);
      const contentStatus = stats.hasContent ? '✅ Has content' : '❌ No content';
      const embeddingStatus = stats.hasEmbedding ? '✅ Has embeddings' : '⚠️  No embeddings';
      console.log(`  ${stats.table}:`);
      console.log(`    Rows: ${stats.rowCount.toLocaleString()}`);
      console.log(`    ${contentStatus}`);
      console.log(`    ${embeddingStatus}`);
      console.log(`    Fields: ${stats.sampleFields.join(', ')}`);
      console.log('');
    }
  }

  // Get source type breakdown for unified vectors
  await getSourceTypeBreakdown();

  // Get sample content from key tables
  await getSampleContent('aoma_unified_vectors', 'content', 3);
  await getSampleContent('jira_tickets', 'content', 2);

  // Summary
  console.log('\n' + '=' .repeat(70));
  console.log('\n📊 MIGRATION FEASIBILITY SUMMARY:\n');

  const totalWithContent = results.filter(r => r.hasContent).reduce((sum, r) => sum + r.rowCount, 0);
  console.log(`  Total rows with exportable content: ${totalWithContent.toLocaleString()}`);
  
  console.log('\n  Tables ready for Google RAG Engine export:');
  for (const r of results) {
    if (r.hasContent) {
      console.log(`    ✅ ${r.table}: ${r.rowCount.toLocaleString()} documents`);
    } else {
      console.log(`    ❌ ${r.table}: No content to export`);
    }
  }

  console.log('\n  VERDICT: ', totalWithContent > 0 
    ? '✅ Synthetic document export is FEASIBLE!'
    : '❌ No content found - need original documents');
}

main().catch(console.error);
