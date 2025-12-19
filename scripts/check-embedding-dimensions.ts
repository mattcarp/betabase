#!/usr/bin/env ts-node
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

async function checkDimensions() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const { data, error } = await supabase
    .from('siam_vectors')
    .select('source_type, embedding')
    .eq('app_under_test', 'aoma')
    .limit(10);
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('\n📊 Embedding Dimensions in Database:\n');
  const dimensions = new Map<string, number>();
  
  data?.forEach((row: any) => {
    const dim = row.embedding?.length || 0;
    const current = dimensions.get(row.source_type) || 0;
    if (!current || current === dim) {
      dimensions.set(row.source_type, dim);
    } else {
      console.warn(`⚠️  Mixed dimensions in ${row.source_type}: ${current}d and ${dim}d`);
    }
  });
  
  dimensions.forEach((dim, sourceType) => {
    const provider = dim === 1536 ? 'OpenAI' : dim === 768 ? 'Gemini' : 'Unknown';
    console.log(`  ${sourceType}: ${dim}d (${provider})`);
  });
  
  console.log('\n');
}

checkDimensions();


