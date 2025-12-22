#!/usr/bin/env npx tsx
/**
 * Knowledge Base Indexer
 *
 * Indexes markdown knowledge base documents into the vector store.
 * These are core definitions and documentation that the RAG needs to answer questions.
 *
 * Usage:
 *   npx tsx scripts/index-knowledge-base.ts
 *   npx tsx scripts/index-knowledge-base.ts --dry-run
 */

import { config } from 'dotenv';
import path from 'path';
import fs from 'fs/promises';
import { glob } from 'glob';

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env.local') });
config({ path: path.resolve(process.cwd(), '.env') });

import { getSupabaseVectorService } from '../src/services/supabaseVectorService';
import { DEFAULT_APP_CONTEXT } from '../src/lib/supabase';

const KNOWLEDGE_BASE_DIR = path.join(process.cwd(), 'docs/knowledge-base');

interface KnowledgeChunk {
  title: string;
  content: string;
  sourceId: string;
  section?: string;
}

/**
 * Split a markdown document into meaningful chunks
 */
function chunkMarkdown(content: string, filename: string): KnowledgeChunk[] {
  const chunks: KnowledgeChunk[] = [];
  const lines = content.split('\n');

  let currentSection = '';
  let currentContent: string[] = [];
  let title = filename.replace('.md', '').replace(/-/g, ' ');

  // Extract title from first H1
  const h1Match = content.match(/^# (.+)$/m);
  if (h1Match) {
    title = h1Match[1];
  }

  for (const line of lines) {
    // Check for H2 headers - these define sections
    const h2Match = line.match(/^## (.+)$/);
    if (h2Match) {
      // Save previous section if it has content
      if (currentContent.length > 0 && currentContent.join('\n').trim().length > 50) {
        chunks.push({
          title,
          content: currentContent.join('\n').trim(),
          sourceId: `${filename}#${currentSection || 'intro'}`.toLowerCase().replace(/\s+/g, '-'),
          section: currentSection || 'Introduction',
        });
      }
      currentSection = h2Match[1];
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  // Don't forget the last section
  if (currentContent.length > 0 && currentContent.join('\n').trim().length > 50) {
    chunks.push({
      title,
      content: currentContent.join('\n').trim(),
      sourceId: `${filename}#${currentSection || 'outro'}`.toLowerCase().replace(/\s+/g, '-'),
      section: currentSection || 'Conclusion',
    });
  }

  // If no good chunks, use the whole document
  if (chunks.length === 0 && content.trim().length > 50) {
    chunks.push({
      title,
      content: content.trim(),
      sourceId: filename.toLowerCase().replace(/\s+/g, '-'),
    });
  }

  return chunks;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  console.log('\n📚 Knowledge Base Indexer');
  console.log('='.repeat(50));
  console.log(`📂 Directory: ${KNOWLEDGE_BASE_DIR}`);
  console.log(`🏢 Context: ${DEFAULT_APP_CONTEXT.organization}/${DEFAULT_APP_CONTEXT.division}/${DEFAULT_APP_CONTEXT.app_under_test}`);
  console.log(`🧪 Dry Run: ${dryRun ? 'YES' : 'NO'}`);
  console.log('');

  // Ensure directory exists
  try {
    await fs.access(KNOWLEDGE_BASE_DIR);
  } catch {
    console.log(`📁 Creating knowledge base directory...`);
    await fs.mkdir(KNOWLEDGE_BASE_DIR, { recursive: true });
  }

  // Find all markdown files
  const files = await glob('**/*.md', { cwd: KNOWLEDGE_BASE_DIR });

  if (files.length === 0) {
    console.log('⚠️  No markdown files found in knowledge base directory');
    console.log(`   Add files to: ${KNOWLEDGE_BASE_DIR}`);
    return;
  }

  console.log(`📄 Found ${files.length} knowledge base file(s):`);
  for (const file of files) {
    console.log(`   - ${file}`);
  }
  console.log('');

  const vectorService = getSupabaseVectorService();
  let totalChunks = 0;
  let indexedChunks = 0;

  for (const file of files) {
    const filePath = path.join(KNOWLEDGE_BASE_DIR, file);
    const content = await fs.readFile(filePath, 'utf-8');

    const chunks = chunkMarkdown(content, file);
    console.log(`\n📝 ${file}: ${chunks.length} chunk(s)`);

    for (const chunk of chunks) {
      totalChunks++;

      // Prepare content for embedding
      const embeddingContent = `# ${chunk.title}\n${chunk.section ? `## ${chunk.section}\n` : ''}${chunk.content}`;

      console.log(`   [${chunk.sourceId}] ${embeddingContent.substring(0, 80)}...`);

      if (!dryRun) {
        try {
          await vectorService.upsertVector(
            DEFAULT_APP_CONTEXT.organization,
            DEFAULT_APP_CONTEXT.division,
            DEFAULT_APP_CONTEXT.app_under_test,
            embeddingContent,
            'knowledge',
            chunk.sourceId,
            {
              title: chunk.title,
              section: chunk.section,
              file_path: file,
              indexed_at: new Date().toISOString(),
            }
          );
          indexedChunks++;
          console.log(`   ✅ Indexed`);
        } catch (error) {
          console.error(`   ❌ Failed:`, error);
        }
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Summary:`);
  console.log(`   Total chunks: ${totalChunks}`);
  if (!dryRun) {
    console.log(`   Indexed: ${indexedChunks}`);
    console.log(`   Failed: ${totalChunks - indexedChunks}`);
  } else {
    console.log(`   (Dry run - no changes made)`);
  }
  console.log('');
}

main().catch(console.error);
