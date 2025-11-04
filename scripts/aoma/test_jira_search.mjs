#!/usr/bin/env node

/**
 * Test JIRA ticket semantic search
 * Verify embeddings are working correctly
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment
dotenv.config({ path: ['.env.local', '.env'] });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');

console.log('🔍 JIRA Ticket Search Tester\n');
console.log('════════════════════════════════════════════════════════════════════\n');

// Initialize clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test queries
const testQueries = [
  "How do I upload assets to AOMA?",
  "I need to add a new user to the system",
  "How do I export metadata?",
  "Problems with asset registration",
  "Need help with digital orders",
  "How to refresh metadata?",
  "Setting up user permissions",
  "Bulk upload issues"
];

console.log('📝 Test Queries:');
testQueries.forEach((q, i) => console.log(`   ${i + 1}. ${q}`));
console.log('\n');

// Test each query
for (const [index, query] of testQueries.entries()) {
  console.log(`\n🔎 Query ${index + 1}/${testQueries.length}: "${query}"`);
  console.log('─'.repeat(70));
  
  try {
    // Create embedding for query
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
      dimensions: 1536
    });
    
    const embedding = response.data[0].embedding;
    
    // Search for similar tickets
    const { data, error } = await supabase.rpc('match_jira_tickets', {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: 3
    });
    
    if (error) {
      console.error('❌ Search error:', error.message);
      continue;
    }
    
    if (!data || data.length === 0) {
      console.log('⚠️  No results found');
      continue;
    }
    
    // Display results
    console.log(`✅ Found ${data.length} relevant ticket(s):\n`);
    
    data.forEach((result, i) => {
      console.log(`   ${i + 1}. [${result.metadata.ticketId}] (similarity: ${(result.similarity * 100).toFixed(1)}%)`);
      console.log(`      ${result.summary}`);
      console.log(`      Type: ${result.metadata.type} | Status: ${result.metadata.status} | Priority: ${result.metadata.priority}`);
      
      // Show snippet of content
      const contentSnippet = result.content
        .substring(0, 150)
        .replace(/\n/g, ' ')
        .trim();
      console.log(`      "${contentSnippet}..."`);
      console.log();
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

console.log('\n════════════════════════════════════════════════════════════════════');
console.log('✨ Search Test Complete!');
console.log('════════════════════════════════════════════════════════════════════\n');

