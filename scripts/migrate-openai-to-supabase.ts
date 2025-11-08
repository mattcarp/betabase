#!/usr/bin/env tsx
/**
 * Migration Script: OpenAI Vector Store → Supabase pgvector
 * 
 * This script:
 * 1. Exports all documents from OpenAI Vector Store
 * 2. Chunks documents optimally (1000 chars, 200 overlap)
 * 3. Generates embeddings using OpenAI's embedding API
 * 4. Batch inserts into Supabase siam_vectors table
 * 
 * Usage:
 *   tsx scripts/migrate-openai-to-supabase.ts [--dry-run] [--limit=10]
 * 
 * Environment Variables Required:
 *   OPENAI_API_KEY - OpenAI API key
 *   SUPABASE_SERVICE_ROLE_KEY - Supabase service role key
 *   NEXT_PUBLIC_SUPABASE_URL - Supabase URL
 */

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const VECTOR_STORE_ID = process.env.VECTOR_STORE_ID || 'vs_3dqHL3Wcmt1WrUof0qS4UQqo';

// Chunking configuration
const CHUNK_SIZE = 1000; // Characters per chunk
const CHUNK_OVERLAP = 200; // Overlap between chunks
const BATCH_SIZE = 5; // Embeddings to generate in parallel

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const limitArg = args.find(arg => arg.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : undefined;

interface ExportedDocument {
  id: string;
  filename?: string;
  created_at: number;
  content: string;
  metadata: Record<string, any>;
}

interface DocumentChunk {
  content: string;
  sourceFileId: string;
  sourceFilename?: string;
  chunkIndex: number;
  totalChunks: number;
  metadata: Record<string, any>;
}

// Initialize clients
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

/**
 * Validate environment variables
 */
function validateEnvironment(): void {
  const missing: string[] = [];
  
  if (!OPENAI_API_KEY) missing.push('OPENAI_API_KEY');
  if (!SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!SUPABASE_SERVICE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('Please set them in your .env file');
    process.exit(1);
  }
  
  console.log('✅ Environment variables validated');
}

/**
 * Export documents from OpenAI Vector Store
 * Using the exact approach provided by OpenAI support
 */
async function exportOpenAIVectorStore(): Promise<ExportedDocument[]> {
  console.log(`\n📥 Exporting documents from OpenAI Vector Store: ${VECTOR_STORE_ID}`);
  
  try {
    // Step 1: List all files linked to the vector store
    // Using vectorStores.files API (OpenAI SDK v6.1.0)
    console.log('Listing files from vector store...');
    const vectorStoreFiles = await openai.vectorStores.files.list(VECTOR_STORE_ID);
    const files = vectorStoreFiles.data;
    
    console.log(`Found ${files.length} files in vector store`);
    
    if (limit) {
      console.log(`⚠️  Limiting to first ${limit} files (--limit flag)`);
    }
    
    const exportedDocs: ExportedDocument[] = [];
    const filesToProcess = limit ? files.slice(0, limit) : files;
    
    // Step 2: Download each file
    for (let i = 0; i < filesToProcess.length; i++) {
      const fileEntry = filesToProcess[i];
      const progress = `[${i + 1}/${filesToProcess.length}]`;
      
      try {
        const fileId = fileEntry.id;
        
        // Get filename from vector store entry (more reliable)
        const fileName = fileEntry.id; // We'll get the real name from file metadata
        
        console.log(`${progress} Downloading file: ${fileId}...`);
        
        // Download file content (OpenAI-recommended approach)
        const response = await openai.files.content(fileId);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const text = new TextDecoder().decode(buffer);
        
        // Get file metadata for additional details
        const fileDetails = await openai.files.retrieve(fileId);
        
        exportedDocs.push({
          id: fileId,
          filename: fileDetails.filename || `${fileId}.txt`,
          created_at: fileDetails.created_at,
          content: text,
          metadata: {
            openai_file_id: fileId,
            filename: fileDetails.filename,
            purpose: fileDetails.purpose,
            bytes: fileDetails.bytes,
            created_at: fileDetails.created_at,
            vector_store_id: VECTOR_STORE_ID,
          }
        });
        
        console.log(`${progress} ✅ Exported: ${fileDetails.filename} (${text.length} chars)`);
      } catch (error) {
        console.error(`${progress} ❌ Failed to export ${fileEntry.id}:`, error);
        // Continue with next file instead of failing completely
      }
    }
    
    console.log(`\n✅ Exported ${exportedDocs.length} documents`);
    
    // Save backup
    const backupPath = path.join(process.cwd(), 'scripts', 'openai-vector-export.json');
    fs.writeFileSync(backupPath, JSON.stringify(exportedDocs, null, 2));
    console.log(`💾 Backup saved to: ${backupPath}`);
    
    return exportedDocs;
  } catch (error) {
    console.error('❌ Failed to export vector store:', error);
    throw error;
  }
}

/**
 * Chunk a document into smaller pieces
 */
function chunkDocument(doc: ExportedDocument): DocumentChunk[] {
  const { content, id, filename, metadata } = doc;
  const chunks: DocumentChunk[] = [];
  
  // Simple character-based chunking with overlap
  let start = 0;
  let chunkIndex = 0;
  
  while (start < content.length) {
    const end = Math.min(start + CHUNK_SIZE, content.length);
    const chunkContent = content.slice(start, end);
    
    chunks.push({
      content: chunkContent,
      sourceFileId: id,
      sourceFilename: filename,
      chunkIndex,
      totalChunks: 0, // Will be updated after all chunks are created
      metadata: {
        ...metadata,
        chunk_index: chunkIndex,
        chunk_start: start,
        chunk_end: end,
      }
    });
    
    chunkIndex++;
    start += CHUNK_SIZE - CHUNK_OVERLAP; // Overlap for context continuity
  }
  
  // Update total chunks count
  chunks.forEach(chunk => {
    chunk.totalChunks = chunks.length;
    chunk.metadata.total_chunks = chunks.length;
  });
  
  return chunks;
}

/**
 * Generate embeddings for chunks in batches
 */
async function generateEmbeddings(chunks: DocumentChunk[]): Promise<Array<{ chunk: DocumentChunk; embedding: number[] }>> {
  console.log(`\n🧮 Generating embeddings for ${chunks.length} chunks...`);
  
  const results: Array<{ chunk: DocumentChunk; embedding: number[] }> = [];
  
  // Process in batches to avoid rate limits
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const progress = `[${i + 1}-${Math.min(i + BATCH_SIZE, chunks.length)}/${chunks.length}]`;
    
    try {
      console.log(`${progress} Generating embeddings...`);
      
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: batch.map(c => c.content),
        encoding_format: 'float',
      });
      
      response.data.forEach((embeddingData, idx) => {
        results.push({
          chunk: batch[idx],
          embedding: embeddingData.embedding
        });
      });
      
      console.log(`${progress} ✅ Generated ${batch.length} embeddings`);
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`${progress} ❌ Failed to generate embeddings:`, error);
      throw error;
    }
  }
  
  console.log(`✅ Generated ${results.length} embeddings`);
  return results;
}

/**
 * Insert chunks into Supabase
 */
async function insertIntoSupabase(
  chunksWithEmbeddings: Array<{ chunk: DocumentChunk; embedding: number[] }>
): Promise<{ success: number; failed: number }> {
  console.log(`\n📤 Inserting ${chunksWithEmbeddings.length} chunks into Supabase...`);
  
  let success = 0;
  let failed = 0;
  
  // Process in smaller batches
  const INSERT_BATCH_SIZE = 10;
  
  for (let i = 0; i < chunksWithEmbeddings.length; i += INSERT_BATCH_SIZE) {
    const batch = chunksWithEmbeddings.slice(i, i + INSERT_BATCH_SIZE);
    const progress = `[${i + 1}-${Math.min(i + INSERT_BATCH_SIZE, chunksWithEmbeddings.length)}/${chunksWithEmbeddings.length}]`;
    
    try {
      console.log(`${progress} Inserting batch...`);
      
      // Use the upsert_aoma_vector RPC function
      const promises = batch.map(({ chunk, embedding }) => {
        return supabase.rpc('upsert_aoma_vector', {
          p_content: chunk.content,
          p_embedding: embedding,
          p_source_type: 'openai_import',
          p_source_id: `${chunk.sourceFileId}_chunk_${chunk.chunkIndex}`,
          p_metadata: {
            ...chunk.metadata,
            migrated_at: new Date().toISOString(),
            migration_script: 'migrate-openai-to-supabase.ts'
          }
        });
      });
      
      const results = await Promise.allSettled(promises);
      
      results.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          success++;
        } else {
          failed++;
          console.error(`${progress} Failed to insert chunk:`, result.reason);
        }
      });
      
      console.log(`${progress} ✅ Inserted ${batch.length} chunks (${success} success, ${failed} failed)`);
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`${progress} ❌ Batch insert failed:`, error);
      failed += batch.length;
    }
  }
  
  return { success, failed };
}

/**
 * Main migration function
 */
async function migrate(): Promise<void> {
  console.log('🚀 Starting OpenAI → Supabase Migration');
  console.log('=====================================\n');
  
  if (isDryRun) {
    console.log('⚠️  DRY RUN MODE - No data will be inserted into Supabase\n');
  }
  
  const startTime = Date.now();
  
  try {
    // Step 1: Validate environment
    validateEnvironment();
    
    // Step 2: Export from OpenAI
    const documents = await exportOpenAIVectorStore();
    
    if (documents.length === 0) {
      console.log('⚠️  No documents to migrate');
      return;
    }
    
    // Step 3: Chunk documents
    console.log(`\n✂️  Chunking ${documents.length} documents...`);
    const allChunks: DocumentChunk[] = [];
    
    for (const doc of documents) {
      const chunks = chunkDocument(doc);
      allChunks.push(...chunks);
      console.log(`  ${doc.filename}: ${chunks.length} chunks`);
    }
    
    console.log(`✅ Created ${allChunks.length} total chunks`);
    
    // Step 4: Generate embeddings
    const chunksWithEmbeddings = await generateEmbeddings(allChunks);
    
    // Step 5: Insert into Supabase (unless dry run)
    if (isDryRun) {
      console.log('\n⚠️  DRY RUN - Skipping Supabase insertion');
      console.log(`Would have inserted ${chunksWithEmbeddings.length} chunks`);
    } else {
      const { success, failed } = await insertIntoSupabase(chunksWithEmbeddings);
      
      console.log('\n📊 Migration Summary:');
      console.log(`  Documents exported: ${documents.length}`);
      console.log(`  Chunks created: ${allChunks.length}`);
      console.log(`  Embeddings generated: ${chunksWithEmbeddings.length}`);
      console.log(`  Successfully inserted: ${success}`);
      console.log(`  Failed: ${failed}`);
      console.log(`  Success rate: ${((success / chunksWithEmbeddings.length) * 100).toFixed(1)}%`);
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ Migration completed in ${duration}s`);
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrate();

