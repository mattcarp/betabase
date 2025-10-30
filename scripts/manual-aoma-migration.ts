#!/usr/bin/env tsx
/**
 * Manual AOMA Document Migration to Supabase
 * 
 * This script processes original AOMA source documents and uploads them to Supabase.
 * Use this if you have access to the original documents (PDFs, DOCX, MD, TXT).
 * 
 * Usage:
 *   1. Place all AOMA documents in: ./aoma-source-docs/
 *   2. Run: tsx scripts/manual-aoma-migration.ts
 * 
 * Supported Formats:
 *   - PDF (.pdf)
 *   - Word Documents (.docx)
 *   - Markdown (.md)
 *   - Plain Text (.txt)
 * 
 * Environment Variables Required:
 *   OPENAI_API_KEY - For generating embeddings
 *   SUPABASE_SERVICE_ROLE_KEY - For database access
 *   NEXT_PUBLIC_SUPABASE_URL - Supabase project URL
 */

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

// Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const SOURCE_DIR = path.join(process.cwd(), 'aoma-source-docs');
const CHUNK_SIZE = 1000; // Characters per chunk
const CHUNK_OVERLAP = 200; // Overlap between chunks
const BATCH_SIZE = 5; // Embeddings to generate in parallel

// Initialize clients
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

interface ProcessedDocument {
  filename: string;
  filepath: string;
  content: string;
  metadata: Record<string, any>;
}

interface DocumentChunk {
  content: string;
  sourceFile: string;
  chunkIndex: number;
  totalChunks: number;
  metadata: Record<string, any>;
}

/**
 * Validate environment and prerequisites
 */
function validateEnvironment(): void {
  console.log('🔍 Validating environment...\n');

  const missing: string[] = [];
  
  if (!OPENAI_API_KEY) missing.push('OPENAI_API_KEY');
  if (!SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!SUPABASE_SERVICE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('Please set them in your .env file');
    process.exit(1);
  }
  
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`❌ Source directory not found: ${SOURCE_DIR}`);
    console.error('Please create it and add your AOMA documents:');
    console.error(`  mkdir -p ${SOURCE_DIR}`);
    console.error(`  cp /path/to/your/docs/* ${SOURCE_DIR}/`);
    process.exit(1);
  }
  
  console.log('✅ Environment validated');
  console.log(`📁 Source directory: ${SOURCE_DIR}\n`);
}

/**
 * Extract text from different file formats
 */
async function extractText(filepath: string): Promise<string> {
  const ext = path.extname(filepath).toLowerCase();
  
  try {
    switch (ext) {
      case '.txt':
      case '.md':
        return fs.readFileSync(filepath, 'utf-8');
      
      case '.pdf':
        try {
          const dataBuffer = fs.readFileSync(filepath);
          const data = await pdfParse(dataBuffer);
          return data.text;
        } catch (error) {
          console.warn(`⚠️  PDF extraction failed for: ${filepath}`);
          console.warn('    Error:', error instanceof Error ? error.message : String(error));
          return '';
        }
      
      case '.docx':
        try {
          const result = await mammoth.extractRawText({ path: filepath });
          return result.value;
        } catch (error) {
          console.warn(`⚠️  DOCX extraction failed for: ${filepath}`);
          console.warn('    Error:', error instanceof Error ? error.message : String(error));
          return '';
        }
      
      default:
        console.warn(`⚠️  Unsupported file format: ${ext}`);
        return '';
    }
  } catch (error) {
    console.error(`❌ Failed to extract text from ${filepath}:`, error);
    return '';
  }
}

/**
 * Find all documents in source directory
 */
async function findSourceDocuments(): Promise<ProcessedDocument[]> {
  console.log('📂 Scanning for source documents...\n');
  
  const pattern = path.join(SOURCE_DIR, '**/*.{txt,md,pdf,docx}');
  const files = await glob(pattern);
  
  if (files.length === 0) {
    console.error('❌ No documents found in:', SOURCE_DIR);
    console.error('Supported formats: .txt, .md, .pdf, .docx');
    process.exit(1);
  }
  
  console.log(`Found ${files.length} files:`);
  files.forEach(f => console.log(`  - ${path.relative(SOURCE_DIR, f)}`));
  console.log('');
  
  const processed: ProcessedDocument[] = [];
  
  for (const filepath of files) {
    const filename = path.basename(filepath);
    console.log(`Processing: ${filename}...`);
    
    const content = await extractText(filepath);
    
    if (!content || content.length < 50) {
      console.warn(`  ⚠️  Skipping (empty or too short)`);
      continue;
    }
    
    processed.push({
      filename,
      filepath,
      content,
      metadata: {
        original_filename: filename,
        original_path: filepath,
        file_size: fs.statSync(filepath).size,
        processed_at: new Date().toISOString(),
      }
    });
    
    console.log(`  ✅ Extracted ${content.length} characters`);
  }
  
  console.log(`\n✅ Processed ${processed.length} documents\n`);
  return processed;
}

/**
 * Chunk a document into smaller pieces
 */
function chunkDocument(doc: ProcessedDocument): DocumentChunk[] {
  const { content, filename, metadata } = doc;
  const chunks: DocumentChunk[] = [];
  
  let start = 0;
  let chunkIndex = 0;
  
  while (start < content.length) {
    const end = Math.min(start + CHUNK_SIZE, content.length);
    const chunkContent = content.slice(start, end);
    
    chunks.push({
      content: chunkContent,
      sourceFile: filename,
      chunkIndex,
      totalChunks: 0, // Will update after all chunks created
      metadata: {
        ...metadata,
        chunk_index: chunkIndex,
        chunk_start: start,
        chunk_end: end,
      }
    });
    
    chunkIndex++;
    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  
  // Update total chunks count
  chunks.forEach(chunk => {
    chunk.totalChunks = chunks.length;
    chunk.metadata.total_chunks = chunks.length;
  });
  
  return chunks;
}

/**
 * Generate embeddings for chunks
 */
async function generateEmbeddings(
  chunks: DocumentChunk[]
): Promise<Array<{ chunk: DocumentChunk; embedding: number[] }>> {
  console.log(`\n🧮 Generating embeddings for ${chunks.length} chunks...\n`);
  
  const results: Array<{ chunk: DocumentChunk; embedding: number[] }> = [];
  
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
  
  console.log(`\n✅ Generated ${results.length} embeddings\n`);
  return results;
}

/**
 * Insert chunks into Supabase
 */
async function insertIntoSupabase(
  chunksWithEmbeddings: Array<{ chunk: DocumentChunk; embedding: number[] }>
): Promise<{ success: number; failed: number }> {
  console.log(`📤 Inserting ${chunksWithEmbeddings.length} chunks into Supabase...\n`);
  
  let success = 0;
  let failed = 0;
  
  const INSERT_BATCH_SIZE = 10;
  
  for (let i = 0; i < chunksWithEmbeddings.length; i += INSERT_BATCH_SIZE) {
    const batch = chunksWithEmbeddings.slice(i, i + INSERT_BATCH_SIZE);
    const progress = `[${i + 1}-${Math.min(i + INSERT_BATCH_SIZE, chunksWithEmbeddings.length)}/${chunksWithEmbeddings.length}]`;
    
    try {
      console.log(`${progress} Inserting batch...`);
      
      const promises = batch.map(({ chunk, embedding }) => {
        const sourceId = `${chunk.sourceFile}_chunk_${chunk.chunkIndex}`;
        
        return supabase.rpc('upsert_aoma_vector', {
          p_content: chunk.content,
          p_embedding: embedding,
          p_source_type: 'aoma_manual_import', // Special marker for manual imports
          p_source_id: sourceId,
          p_metadata: {
            ...chunk.metadata,
            migration_type: 'manual',
            migration_script: 'manual-aoma-migration.ts',
            migrated_at: new Date().toISOString(),
          }
        });
      });
      
      const results = await Promise.allSettled(promises);
      
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          success++;
        } else {
          failed++;
          console.error(`  ❌ Insert failed:`, result.reason);
        }
      });
      
      console.log(`${progress} ✅ Inserted (${success} total success, ${failed} total failed)`);
      
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
  console.log('\n🚀 Manual AOMA Document Migration to Supabase');
  console.log('==============================================\n');
  
  const startTime = Date.now();
  
  try {
    // Step 1: Validate environment
    validateEnvironment();
    
    // Step 2: Find and process source documents
    const documents = await findSourceDocuments();
    
    if (documents.length === 0) {
      console.log('⚠️  No documents to migrate');
      return;
    }
    
    // Step 3: Chunk documents
    console.log(`✂️  Chunking ${documents.length} documents...\n`);
    const allChunks: DocumentChunk[] = [];
    
    for (const doc of documents) {
      const chunks = chunkDocument(doc);
      allChunks.push(...chunks);
      console.log(`  ${doc.filename}: ${chunks.length} chunks`);
    }
    
    console.log(`\n✅ Created ${allChunks.length} total chunks\n`);
    
    // Step 4: Generate embeddings
    const chunksWithEmbeddings = await generateEmbeddings(allChunks);
    
    // Step 5: Insert into Supabase
    const { success, failed } = await insertIntoSupabase(chunksWithEmbeddings);
    
    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log('\n📊 Migration Summary');
    console.log('===================');
    console.log(`Documents processed: ${documents.length}`);
    console.log(`Chunks created: ${allChunks.length}`);
    console.log(`Embeddings generated: ${chunksWithEmbeddings.length}`);
    console.log(`Successfully inserted: ${success}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success rate: ${((success / chunksWithEmbeddings.length) * 100).toFixed(1)}%`);
    console.log(`Duration: ${duration}s`);
    
    if (success > 0) {
      console.log('\n✅ Migration completed successfully!');
      console.log('\n🎯 Next Steps:');
      console.log('1. Verify results in Supabase:');
      console.log(`   SELECT COUNT(*) FROM aoma_unified_vectors WHERE source_type = 'aoma_manual_import';`);
      console.log('2. Test a query:');
      console.log(`   Run a chat query that should return AOMA docs`);
      console.log('3. Update orchestrator to use Supabase for AOMA docs (see COMPLETE_ARCHITECTURE_REVIEW.md)');
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrate();

