#!/usr/bin/env tsx
/**
 * Migrate All Embeddings to Gemini text-embedding-004
 * 
 * Re-embeds all knowledge base content using Gemini's 768-dimensional embeddings
 * to replace corrupted/OpenAI embeddings.
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

interface EmbeddingBatch {
  id: string;
  content: string;
  table: string;
}

const BATCH_SIZE = 10;
const DELAY_MS = 1000; // Rate limiting

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error('Embedding error:', error);
    throw error;
  }
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function migrateWikiDocuments() {
  console.log('\n📚 Migrating wiki_documents...');
  
  const { data: docs, error } = await supabase
    .from('wiki_documents')
    .select('id, title, markdown_content')
    .not('markdown_content', 'is', null)
    .limit(1000);
  
  if (error) throw error;
  
  console.log(`   Found ${docs.length} documents`);
  
  let updated = 0;
  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = docs.slice(i, i + BATCH_SIZE);
    
    for (const doc of batch) {
      const content = `${doc.title}\n\n${doc.markdown_content}`.slice(0, 10000);
      const embedding = await generateEmbedding(content);
      
      await supabase
        .from('wiki_documents')
        .update({ embedding })
        .eq('id', doc.id);
      
      updated++;
      process.stdout.write(`\r   Progress: ${updated}/${docs.length}`);
    }
    
    if (i + BATCH_SIZE < docs.length) {
      await delay(DELAY_MS);
    }
  }
  
  console.log(`\n   ✅ Updated ${updated} wiki documents`);
}

async function migrateCrawledPages() {
  console.log('\n🌐 Migrating crawled_pages...');
  
  const { data: pages, error } = await supabase
    .from('crawled_pages')
    .select('id, title, main_content')
    .not('main_content', 'is', null)
    .limit(1000);
  
  if (error) throw error;
  
  console.log(`   Found ${pages.length} pages`);
  
  let updated = 0;
  for (let i = 0; i < pages.length; i += BATCH_SIZE) {
    const batch = pages.slice(i, i + BATCH_SIZE);
    
    for (const page of batch) {
      const content = `${page.title || ''}\n\n${page.main_content}`.slice(0, 10000);
      const embedding = await generateEmbedding(content);
      
      await supabase
        .from('crawled_pages')
        .update({ content_embedding: embedding })
        .eq('id', page.id);
      
      updated++;
      process.stdout.write(`\r   Progress: ${updated}/${pages.length}`);
    }
    
    if (i + BATCH_SIZE < pages.length) {
      await delay(DELAY_MS);
    }
  }
  
  console.log(`\n   ✅ Updated ${updated} crawled pages`);
}

async function migrateJiraTickets() {
  console.log('\n📋 Migrating jira_tickets...');
  
  const { data: tickets, error } = await supabase
    .from('jira_tickets')
    .select('id, summary, description')
    .limit(1000);
  
  if (error) throw error;
  
  console.log(`   Found ${tickets.length} tickets`);
  
  let updated = 0;
  for (let i = 0; i < tickets.length; i += BATCH_SIZE) {
    const batch = tickets.slice(i, i + BATCH_SIZE);
    
    for (const ticket of batch) {
      const content = `${ticket.summary || ''}\n\n${ticket.description || ''}`.slice(0, 10000);
      const embedding = await generateEmbedding(content);
      
      await supabase
        .from('jira_tickets')
        .update({ embedding })
        .eq('id', ticket.id);
      
      updated++;
      process.stdout.write(`\r   Progress: ${updated}/${tickets.length}`);
    }
    
    if (i + BATCH_SIZE < tickets.length) {
      await delay(DELAY_MS);
    }
  }
  
  console.log(`\n   ✅ Updated ${updated} JIRA tickets`);
}

async function migrateSiamVectors() {
  console.log('\n🔮 Migrating siam_vectors...');
  
  const { data: vectors, error } = await supabase
    .from('siam_vectors')
    .select('id, content')
    .not('content', 'is', null)
    .limit(1000);
  
  if (error) throw error;
  
  console.log(`   Found ${vectors.length} vectors`);
  
  let updated = 0;
  for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
    const batch = vectors.slice(i, i + BATCH_SIZE);
    
    for (const vector of batch) {
      const embedding = await generateEmbedding(vector.content.slice(0, 10000));
      
      await supabase
        .from('siam_vectors')
        .update({ embedding })
        .eq('id', vector.id);
      
      updated++;
      process.stdout.write(`\r   Progress: ${updated}/${vectors.length}`);
    }
    
    if (i + BATCH_SIZE < vectors.length) {
      await delay(DELAY_MS);
    }
  }
  
  console.log(`\n   ✅ Updated ${updated} SIAM vectors`);
}

async function main() {
  console.log('🚀 Starting Gemini Embedding Migration');
  console.log('   Model: text-embedding-004 (768 dimensions)');
  console.log('   Batch size:', BATCH_SIZE);
  
  try {
    await migrateWikiDocuments();
    await migrateCrawledPages();
    await migrateJiraTickets();
    await migrateSiamVectors();
    
    console.log('\n✅ Migration Complete!');
    console.log('   All embeddings now use Gemini text-embedding-004');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
