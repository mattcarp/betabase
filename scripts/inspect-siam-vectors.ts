#!/usr/bin/env npx tsx
/**
 * Deep dive into siam_vectors table - the main vector store
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
  console.log('🔍 Deep dive into siam_vectors table (20,483 rows)\n');

  // Get sample rows with all fields
  const { data, error } = await supabase
    .from('siam_vectors')
    .select('*')
    .limit(5);

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No data found in siam_vectors');
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
    console.log(`  ${key}: ${type}`);
  }

  // Show sample data
  console.log('\n📝 Sample vectors:\n');
  for (const row of data) {
    console.log('=' .repeat(70));
    for (const [key, value] of Object.entries(row)) {
      if (key === 'embedding' || key === 'embedding_gemini') {
        const emb = value as number[] | null;
        console.log(`${key}: ${emb ? `vector[${emb.length}]` : 'null'}`);
      } else if (typeof value === 'object' && value !== null) {
        console.log(`${key}: ${JSON.stringify(value).substring(0, 300)}`);
      } else if (typeof value === 'string' && value.length > 500) {
        console.log(`${key}: ${value.substring(0, 500)}...`);
      } else {
        console.log(`${key}: ${value}`);
      }
    }
    console.log('');
  }

  // Get content statistics
  console.log('\n📊 Content Field Analysis:');
  
  // Find the content field
  const contentFields = ['content', 'text', 'chunk', 'body', 'raw_content'];
  for (const field of contentFields) {
    if (firstRow[field] !== undefined) {
      const { count } = await supabase
        .from('siam_vectors')
        .select('*', { count: 'exact', head: true })
        .not(field, 'is', null)
        .neq(field, '');
      console.log(`  ${field}: ${count?.toLocaleString() || 0} non-empty`);
    }
  }

  // Check source types if exists
  if (firstRow['source_type'] !== undefined) {
    console.log('\n📊 Source Type Breakdown:');
    const { data: sourceData } = await supabase
      .from('siam_vectors')
      .select('source_type');
    
    const counts: Record<string, number> = {};
    for (const row of sourceData || []) {
      counts[row.source_type] = (counts[row.source_type] || 0) + 1;
    }
    for (const [type, count] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${type}: ${count.toLocaleString()}`);
    }
  }

  // Check embedding dimensions
  console.log('\n📊 Embedding Analysis:');
  const embeddingFields = ['embedding', 'embedding_gemini', 'embedding_openai'];
  for (const field of embeddingFields) {
    if (firstRow[field] !== undefined) {
      const { count } = await supabase
        .from('siam_vectors')
        .select('*', { count: 'exact', head: true })
        .not(field, 'is', null);
      
      const sampleEmb = firstRow[field] as number[] | null;
      console.log(`  ${field}: ${count?.toLocaleString() || 0} rows, dimensions: ${sampleEmb?.length || 'N/A'}`);
    }
  }
}

main().catch(console.error);
