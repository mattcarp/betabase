#!/usr/bin/env node

/**
 * Process existing AOMA HTML files into vector store
 * This script converts the HTML files you already have into markdown
 * and stores them in Supabase with embeddings
 */

const fs = require('fs').promises;
const path = require('path');
const TurndownService = require('turndown');
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

// Initialize services
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced'
});

// Configure turndown for better markdown
turndown.remove(['script', 'style', 'nav', 'footer', 'header']);

async function processHtmlFiles() {
  console.log('🚀 Processing existing AOMA HTML files...\n');
  
  const tmpDir = path.join(process.cwd(), 'tmp');
  const files = await fs.readdir(tmpDir);
  const htmlFiles = files.filter(f => f.endsWith('.html') && f.includes('aoma'));
  
  console.log(`Found ${htmlFiles.length} AOMA HTML files to process\n`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const file of htmlFiles) {
    try {
      console.log(`\n📄 Processing: ${file}`);
      
      // Read HTML
      const htmlPath = path.join(tmpDir, file);
      const html = await fs.readFile(htmlPath, 'utf8');
      
      // Extract title from filename
      const title = file
        .replace('.html', '')
        .replace(/_/g, ' ')
        .replace(/aoma https aoma stage smcdp de net/i, 'AOMA')
        .replace(/servlet.*$/i, '')
        .trim();
      
      // Convert to markdown
      const markdown = turndown.turndown(html);
      
      // Clean markdown
      const cleanedMarkdown = markdown
        .replace(/\n{3,}/g, '\n\n')
        .replace(/\[]\(\)/g, '')
        .replace(/[ \t]+/g, ' ')
        .replace(/[ \t]+$/gm, '')
        .trim();
      
      // Skip if content is too short
      if (cleanedMarkdown.length < 100) {
        console.log('   ⚠️ Skipping - content too short');
        continue;
      }
      
      // Generate embedding
      const embedding = await generateEmbedding(cleanedMarkdown);
      
      // Construct URL from filename
      const url = file
        .replace('.html', '')
        .replace(/aoma_https_aoma_stage_smcdp_de_net/i, 'https://aoma-stage.smcdp-de.net')
        .replace(/_/g, '/')
        .replace(/\//g, '/', 1); // Only replace first underscore with slash
      
      // Store in Supabase
      const { error } = await supabase
        .from('aoma_unified_vectors')
        .upsert({
          content: cleanedMarkdown,
          embedding: embedding,
          source_type: 'knowledge',
          source_id: url,
          metadata: {
            title: title,
            originalFile: file,
            contentLength: cleanedMarkdown.length,
            processedAt: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'source_type,source_id'
        });
      
      if (error) {
        console.error(`   ❌ Database error: ${error.message}`);
        errorCount++;
      } else {
        console.log(`   ✅ Stored: ${title} (${cleanedMarkdown.length} chars)`);
        successCount++;
        
        // Save markdown locally
        const mdDir = path.join(tmpDir, 'processed-markdown');
        await fs.mkdir(mdDir, { recursive: true });
        await fs.writeFile(
          path.join(mdDir, file.replace('.html', '.md')),
          `# ${title}\n\n${cleanedMarkdown}`
        );
      }
      
    } catch (error) {
      console.error(`   ❌ Error processing ${file}:`, error.message);
      errorCount++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Successfully processed: ${successCount} files`);
  console.log(`❌ Failed: ${errorCount} files`);
  console.log('='.repeat(50) + '\n');
  
  // Test search
  if (successCount > 0) {
    await testSearch();
  }
}

async function generateEmbedding(text) {
  try {
    const truncatedText = text.substring(0, 8000);
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: truncatedText
    });
    return response.data[0].embedding;
  } catch (error) {
    console.warn('   ⚠️ Failed to generate embedding, using zero vector');
    return new Array(1536).fill(0);
  }
}

async function testSearch() {
  console.log('🔍 Testing vector search...\n');
  
  const testQueries = [
    'upload files',
    'metadata',
    'registration',
    'QC notes',
    'video'
  ];
  
  for (const query of testQueries) {
    console.log(`\nQuery: "${query}"`);
    
    try {
      // Generate query embedding
      const queryEmbedding = await generateEmbedding(query);
      
      // Search using the function from your migration
      const { data, error } = await supabase.rpc('match_aoma_vectors', {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: 3
      });
      
      if (error) {
        console.error(`Search error: ${error.message}`);
        continue;
      }
      
      if (data && data.length > 0) {
        data.forEach((result, i) => {
          console.log(`  ${i + 1}. ${result.metadata?.title || 'Untitled'} (${(result.similarity * 100).toFixed(1)}%)`);
        });
      } else {
        console.log('  No results found');
      }
    } catch (error) {
      console.error(`Search failed: ${error.message}`);
    }
  }
}

// Run the processor
processHtmlFiles().catch(console.error);