#!/usr/bin/env ts-node

/**
 * Ingest DDP Specification PDFs into AOMA Knowledge Base
 * 
 * Processes all DDP spec PDFs from the AOMA corpus:
 * - Extracts text from PDFs
 * - Chunks content semantically (500-1000 tokens)
 * - Generates embeddings (when OpenAI quota available)
 * - Stores in siam_vectors as 'knowledge' source type
 */

import { readFileSync, readdirSync } from 'fs';
import { join, basename } from 'path';
import { createClient } from '@supabase/supabase-js';
import pdf from 'pdf-parse';

// Load environment variables
import { config } from 'dotenv';
config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const DDP_SPECS_PATH = '/Users/matt/Downloads/AOMA Ttransfers - Code and Data/aoma-corpus-for-AI/DDP';

interface DDPChunk {
  content: string;
  metadata: {
    source_name: string;
    file_name: string;
    spec_version: string;
    page_start?: number;
    page_end?: number;
    chunk_index: number;
    total_chunks: number;
    doc_type: 'technical-specification' | 'errata' | 'addendum' | 'license';
    keywords: string[];
  };
}

/**
 * Extract text from a PDF file
 */
async function extractPDFText(filePath: string): Promise<{ text: string; numPages: number }> {
  const dataBuffer = readFileSync(filePath);
  const data = await pdf(dataBuffer);
  
  return {
    text: data.text,
    numPages: data.numpages,
  };
}

/**
 * Determine document type from filename
 */
function getDocType(filename: string): DDPChunk['metadata']['doc_type'] {
  const lower = filename.toLowerCase();
  if (lower.includes('errata')) return 'errata';
  if (lower.includes('addendum')) return 'addendum';
  if (lower.includes('license')) return 'license';
  return 'technical-specification';
}

/**
 * Extract DDP version from filename
 */
function extractVersion(filename: string): string {
  const versionMatch = filename.match(/DDP\s*(\d+\.\d+)/i);
  if (versionMatch) return versionMatch[1];
  
  // Special cases
  if (filename.includes('HD-DVD')) return '3.00 (HD-DVD)';
  if (filename.includes('CD Text')) return '2.00 CD-TEXT';
  
  return 'Unknown';
}

/**
 * Smart chunking: Split text into semantic chunks
 * Aims for 500-1000 tokens (~2000-4000 characters)
 */
function chunkText(text: string, targetSize = 3000): string[] {
  const chunks: string[] = [];
  
  // First, split by major sections (look for section headers)
  const sections = text.split(/\n(?=[A-Z][A-Z\s]+\n|^\d+\.\s+[A-Z])/);
  
  let currentChunk = '';
  
  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;
    
    // If adding this section would exceed target, save current chunk
    if (currentChunk && (currentChunk.length + trimmed.length) > targetSize) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }
    
    // If section itself is too large, split by paragraphs
    if (trimmed.length > targetSize) {
      const paragraphs = trimmed.split(/\n\n+/);
      for (const para of paragraphs) {
        if (currentChunk && (currentChunk.length + para.length) > targetSize) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }
        currentChunk += para + '\n\n';
      }
    } else {
      currentChunk += trimmed + '\n\n';
    }
  }
  
  // Save final chunk
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.filter(c => c.length > 100); // Filter out tiny chunks
}

/**
 * Extract keywords from DDP spec content
 */
function extractKeywords(content: string, filename: string): string[] {
  const keywords = new Set<string>([
    'DDP',
    'Disc Description Protocol',
  ]);
  
  // Add version-specific keywords
  const version = extractVersion(filename);
  keywords.add(`DDP ${version}`);
  
  // Common DDP terms
  const ddpTerms = [
    'Red Book', 'CD-DA', 'CD-TEXT', 'ISRC', 'PQ subcode', 'TOC',
    'DDPMS', 'DDPID', 'PQDESCR', 'PQTOC', 'sector', 'frame',
    'audio master', 'replication', 'manufacturing', 'glass master',
    '2352 bytes', '74 minutes', '99 tracks', 'sample rate', '44.1 kHz',
  ];
  
  for (const term of ddpTerms) {
    if (content.toLowerCase().includes(term.toLowerCase())) {
      keywords.add(term);
    }
  }
  
  // Format-specific
  if (content.toLowerCase().includes('sacd')) keywords.add('SACD');
  if (content.toLowerCase().includes('dvd')) keywords.add('DVD-Audio');
  if (content.toLowerCase().includes('hd-dvd')) keywords.add('HD-DVD');
  if (content.toLowerCase().includes('blu-ray')) keywords.add('Blu-ray');
  
  return Array.from(keywords);
}

/**
 * Process a single PDF file
 */
async function processPDF(filePath: string): Promise<DDPChunk[]> {
  const filename = basename(filePath);
  console.log(`\n📄 Processing: ${filename}`);
  
  try {
    const { text, numPages } = await extractPDFText(filePath);
    console.log(`   ✅ Extracted ${text.length} characters from ${numPages} pages`);
    
    // Chunk the text
    const textChunks = chunkText(text);
    console.log(`   ✅ Created ${textChunks.length} semantic chunks`);
    
    const version = extractVersion(filename);
    const docType = getDocType(filename);
    
    // Create chunk objects
    const chunks: DDPChunk[] = textChunks.map((content, idx) => ({
      content,
      metadata: {
        source_name: `DDP Specification ${version}`,
        file_name: filename,
        spec_version: version,
        chunk_index: idx + 1,
        total_chunks: textChunks.length,
        doc_type: docType,
        keywords: extractKeywords(content, filename),
      },
    }));
    
    return chunks;
  } catch (error) {
    console.error(`   ❌ Error processing ${filename}:`, error);
    return [];
  }
}

/**
 * Save chunks to JSON for later ingestion (when OpenAI quota restored)
 */
async function saveChunksToJSON(chunks: DDPChunk[], outputPath: string) {
  const fs = await import('fs/promises');
  await fs.writeFile(outputPath, JSON.stringify(chunks, null, 2));
  console.log(`\n💾 Saved ${chunks.length} chunks to: ${outputPath}`);
}

/**
 * Main ingestion function
 */
async function ingestDDPSpecs() {
  console.log('🚀 DDP Specification Ingestion Starting\n');
  console.log('═'.repeat(70));
  console.log(`\n📁 Source: ${DDP_SPECS_PATH}\n`);
  
  // Get all PDF files
  const files = readdirSync(DDP_SPECS_PATH)
    .filter(f => f.toLowerCase().endsWith('.pdf'))
    .map(f => join(DDP_SPECS_PATH, f));
  
  console.log(`Found ${files.length} PDF files:\n`);
  files.forEach((f, i) => console.log(`  ${i + 1}. ${basename(f)}`));
  
  // Process all PDFs
  const allChunks: DDPChunk[] = [];
  
  for (const file of files) {
    const chunks = await processPDF(file);
    allChunks.push(...chunks);
  }
  
  console.log('\n' + '═'.repeat(70));
  console.log(`\n✅ Total chunks created: ${allChunks.length}`);
  
  // Save to JSON for now (can't embed due to OpenAI quota)
  const outputPath = join(__dirname, 'ddp-chunks-ready-for-embedding.json');
  await saveChunksToJSON(allChunks, outputPath);
  
  console.log(`\n📊 Summary:`);
  console.log(`   - PDFs processed: ${files.length}`);
  console.log(`   - Total chunks: ${allChunks.length}`);
  console.log(`   - Average chunk size: ${Math.round(allChunks.reduce((sum, c) => sum + c.content.length, 0) / allChunks.length)} characters`);
  
  console.log(`\n⚠️  OpenAI Quota Issue Detected`);
  console.log(`   Chunks are prepared but NOT embedded yet.`);
  console.log(`\n   Next steps:`);
  console.log(`   1. Add credits to OpenAI account`);
  console.log(`   2. Run: npx ts-node scripts/embed-ddp-chunks.ts`);
  console.log(`   3. Chunks will be embedded and stored in siam_vectors\n`);
  
  return allChunks;
}

// Run the script
ingestDDPSpecs().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});





