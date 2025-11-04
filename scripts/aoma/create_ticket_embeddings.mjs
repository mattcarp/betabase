#!/usr/bin/env node

/**
 * Create embeddings from JIRA tickets for RAG training
 * Converts support tickets into searchable knowledge base
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');

const INPUT_FILE = path.join(projectRoot, 'docs/aoma/training-data/jira-tickets-processed.json');
const OUTPUT_FILE = path.join(projectRoot, 'docs/aoma/training-data/ticket-chunks.json');

console.log('🔮 JIRA Ticket Embedding Creator\n');
console.log('════════════════════════════════════════════════════════════════════\n');

// Read processed tickets
console.log('📖 Reading processed tickets...');
const tickets = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
console.log(`   ✅ Loaded ${tickets.length.toLocaleString()} tickets\n`);

// Convert tickets to chunks suitable for embeddings
console.log('✂️  Creating knowledge chunks...');

const chunks = [];

tickets.forEach(ticket => {
  // Skip tickets without meaningful content
  if (!ticket.summary && !ticket.description) {
    return;
  }
  
  // Create a comprehensive chunk for each ticket
  const chunk = {
    id: ticket.id,
    type: 'jira_ticket',
    
    // Main content
    content: [
      `Issue: ${ticket.summary}`,
      ticket.description ? `\n\nDescription: ${ticket.description}` : '',
      ticket.resolution ? `\n\nResolution: ${ticket.resolution}` : '',
      ticket.comments.length > 0 ? `\n\nComments:\n${ticket.comments.slice(0, 3).join('\n---\n')}` : ''
    ].filter(Boolean).join(''),
    
    // Metadata for filtering and context
    metadata: {
      ticketId: ticket.id,
      type: ticket.type,
      status: ticket.status,
      priority: ticket.priority,
      created: ticket.created,
      resolved: ticket.resolved,
      aomaTeam: ticket.aomaTeam,
      application: ticket.application,
      environment: ticket.environment,
      assetType: ticket.assetType,
      commentCount: ticket.comments.length,
      isAomaRelated: !!(
        ticket.aomaTeam || 
        ticket.summary?.toLowerCase().includes('aoma') || 
        ticket.description?.toLowerCase().includes('aoma')
      )
    },
    
    // Short summary for display
    summary: ticket.summary,
    
    // Quick reference
    url: ticket.id ? `https://jira.sonymusic.com/browse/${ticket.id}` : null
  };
  
  chunks.push(chunk);
});

console.log(`   ✅ Created ${chunks.length.toLocaleString()} knowledge chunks\n`);

// Analyze chunk quality
console.log('📊 Analyzing chunk quality...');

const stats = {
  total: chunks.length,
  aomaRelated: chunks.filter(c => c.metadata.isAomaRelated).length,
  withResolution: chunks.filter(c => c.metadata.resolved).length,
  withComments: chunks.filter(c => c.metadata.commentCount > 0).length,
  avgContentLength: Math.round(
    chunks.reduce((sum, c) => sum + c.content.length, 0) / chunks.length
  ),
  byPriority: {},
  byType: {}
};

chunks.forEach(chunk => {
  stats.byPriority[chunk.metadata.priority] = (stats.byPriority[chunk.metadata.priority] || 0) + 1;
  stats.byType[chunk.metadata.type] = (stats.byType[chunk.metadata.type] || 0) + 1;
});

console.log(`   • Total chunks: ${stats.total.toLocaleString()}`);
console.log(`   • AOMA-related: ${stats.aomaRelated.toLocaleString()} (${((stats.aomaRelated/stats.total)*100).toFixed(1)}%)`);
console.log(`   • With resolution: ${stats.withResolution.toLocaleString()} (${((stats.withResolution/stats.total)*100).toFixed(1)}%)`);
console.log(`   • With comments: ${stats.withComments.toLocaleString()} (${((stats.withComments/stats.total)*100).toFixed(1)}%)`);
console.log(`   • Avg content length: ${stats.avgContentLength} chars\n`);

// Save chunks
console.log('💾 Saving knowledge chunks...');
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(chunks, null, 2));
console.log(`   ✅ Saved to ${path.relative(projectRoot, OUTPUT_FILE)}\n`);

// Create sample queries file
console.log('💡 Creating sample queries...');

const sampleQueries = chunks
  .filter(c => c.metadata.isAomaRelated)
  .slice(0, 20)
  .map(c => ({
    query: c.summary,
    expectedTicket: c.id,
    category: c.metadata.type
  }));

const QUERIES_FILE = path.join(path.dirname(OUTPUT_FILE), 'sample-queries.json');
fs.writeFileSync(QUERIES_FILE, JSON.stringify(sampleQueries, null, 2));
console.log(`   ✅ Saved to ${path.relative(projectRoot, QUERIES_FILE)}\n`);

// Print summary
console.log('════════════════════════════════════════════════════════════════════');
console.log('✨ Embedding Preparation Complete!\n');
console.log('📊 Statistics:');
Object.entries(stats.byType)
  .sort((a, b) => b[1] - a[1])
  .forEach(([type, count]) => {
    console.log(`   • ${type}: ${count.toLocaleString()} chunks`);
  });
console.log('\n💡 Next Steps:');
console.log('   1. Upload chunks to vector database (Supabase/Pinecone)');
console.log('   2. Create embeddings using OpenAI/Anthropic');
console.log('   3. Test semantic search with sample queries');
console.log('   4. Integrate into chatbot for support');
console.log('════════════════════════════════════════════════════════════════════\n');

