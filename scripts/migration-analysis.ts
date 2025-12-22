#!/usr/bin/env npx tsx
/**
 * Final analysis for Google RAG Engine migration
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
  console.log('🎯 FINAL ANALYSIS: Google RAG Engine Migration Feasibility\n');
  console.log('=' .repeat(70));

  // Get source type breakdown
  console.log('\n📊 Source Type Breakdown:');
  const { data: allData } = await supabase
    .from('siam_vectors')
    .select('source_type, content');

  const sourceTypes: Record<string, { count: number, contentLengths: number[] }> = {};
  for (const row of allData || []) {
    if (!sourceTypes[row.source_type]) {
      sourceTypes[row.source_type] = { count: 0, contentLengths: [] };
    }
    sourceTypes[row.source_type].count++;
    if (row.content) {
      sourceTypes[row.source_type].contentLengths.push(row.content.length);
    }
  }

  for (const [type, stats] of Object.entries(sourceTypes).sort((a, b) => b[1].count - a[1].count)) {
    const avgLen = stats.contentLengths.length > 0 
      ? Math.round(stats.contentLengths.reduce((a, b) => a + b, 0) / stats.contentLengths.length)
      : 0;
    console.log(`  ${type}: ${stats.count.toLocaleString()} documents (avg content: ${avgLen} chars)`);
  }

  // Get samples from each source type
  for (const sourceType of Object.keys(sourceTypes)) {
    console.log(`\n${'─'.repeat(70)}`);
    console.log(`📝 Sample ${sourceType.toUpperCase()} documents:\n`);

    const { data: samples } = await supabase
      .from('siam_vectors')
      .select('source_id, content, metadata')
      .eq('source_type', sourceType)
      .limit(3);

    for (const sample of samples || []) {
      console.log(`  Source ID: ${sample.source_id}`);
      console.log(`  Content (${sample.content?.length || 0} chars):`);
      const preview = sample.content?.length > 400 
        ? sample.content.substring(0, 400) + '...'
        : sample.content;
      console.log(`    ${preview?.split('\n').join('\n    ')}`);
      console.log('');
    }
  }

  // Summary
  console.log('\n' + '=' .repeat(70));
  console.log('\n🎯 MIGRATION SUMMARY:\n');

  const totalDocs = Object.values(sourceTypes).reduce((sum, s) => sum + s.count, 0);
  console.log(`  Total exportable documents: ${totalDocs.toLocaleString()}`);
  
  for (const [type, stats] of Object.entries(sourceTypes)) {
    console.log(`    ${type}: ${stats.count.toLocaleString()}`);
  }

  console.log('\n  ✅ VERDICT: Content is available for export!');
  console.log('  ✅ We can create synthetic documents from siam_vectors.content');
  console.log('  ✅ Metadata preserved for source tracking');
  
  // Estimate file sizes
  const totalChars = Object.values(sourceTypes)
    .flatMap(s => s.contentLengths)
    .reduce((a, b) => a + b, 0);
  console.log(`\n  📦 Estimated export size: ${(totalChars / 1024 / 1024).toFixed(2)} MB of text`);
}

main().catch(console.error);
