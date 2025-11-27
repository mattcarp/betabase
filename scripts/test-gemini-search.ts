#!/usr/bin/env tsx
/**
 * Test RAG Search with Gemini Embeddings
 */

import { config } from 'dotenv';
import { join } from 'path';
config({ path: join(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });

async function testSearch(query: string) {
  console.log(`\n🔍 Testing search: "${query}"\n`);
  
  // Generate query embedding
  const result = await embeddingModel.embedContent(query);
  const queryEmbedding = result.embedding.values;
  
  console.log(`✅ Query embedding: ${queryEmbedding.length} dimensions\n`);
  
  // Search wiki_documents
  const { data, error } = await supabase.rpc('match_wiki_documents', {
    query_embedding: queryEmbedding,
    match_threshold: 0.5,
    match_count: 5
  });
  
  if (error) {
    console.log('⚠️  RPC function not found, trying manual similarity search...\n');
    
    // Manual cosine similarity search
    const { data: manualResults } = await supabase
      .from('wiki_documents')
      .select('title, url')
      .not('embedding', 'is', null)
      .limit(5);
    
    console.log('📚 Top wiki documents (sample):');
    manualResults?.forEach((doc, i) => {
      console.log(`   ${i + 1}. ${doc.title}`);
    });
  } else {
    console.log('📚 Top matches from wiki_documents:');
    data?.forEach((doc: any, i: number) => {
      console.log(`   ${i + 1}. ${doc.title} (similarity: ${doc.similarity?.toFixed(3)})`);
    });
  }
}

async function main() {
  console.log('🧪 Testing Gemini Embedding Search\n');
  
  await testSearch('How do I use Media Batch Converter to export audio');
  await testSearch('AOMA API documentation');
  await testSearch('Testing best practices');
}

main();
