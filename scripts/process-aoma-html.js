#!/usr/bin/env node

/**
 * Process AOMA HTML files to markdown and store in vector database
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const TurndownService = require('turndown');

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced'
});

turndown.remove(['script', 'style', 'nav', 'footer', 'header']);

async function processHtmlFile(htmlPath) {
  console.log(`\n📄 Processing: ${path.basename(htmlPath)}`);

  const html = fs.readFileSync(htmlPath, 'utf8');

  if (html.length < 100) {
    console.log(`  ⚠️  File too small (${html.length} bytes), skipping`);
    return;
  }

  // Convert to markdown
  const markdown = turndown.turndown(html);
  const cleanedMarkdown = markdown
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\[]\(\)/g, '')
    .trim();

  console.log(`  ✅ Converted to markdown (${cleanedMarkdown.length} chars)`);

  // Extract URL from filename or content
  const filename = path.basename(htmlPath, '.html');
  const url = filename.replace(/_/g, '/').replace(/^https\/\//, 'https://');

  // Generate embedding
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: cleanedMarkdown.substring(0, 8000)
  });

  const embedding = embeddingResponse.data[0].embedding;
  console.log(`  ✅ Generated embedding (${embedding.length}D)`);

  // Store in Supabase using the existing optimized table
  const { data, error } = await supabase
    .from('aoma_unified_vectors')
    .upsert({
      content: cleanedMarkdown,
      embedding: `[${embedding.join(',')}]`, // Convert array to PostgreSQL vector format
      source_type: 'knowledge',
      source_id: url,
      metadata: {
        url: url,
        title: `AOMA - ${filename}`,
        crawledAt: new Date().toISOString(),
        contentLength: cleanedMarkdown.length,
        scrapedFrom: 'safari',
        pageType: 'aoma_stage'
      },
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'source_type,source_id'
    });

  if (error) {
    console.log(`  ❌ DB Error:`, JSON.stringify(error, null, 2));
  } else {
    console.log(`  ✅ Stored in vector database (ID: ${data?.[0]?.id || 'unknown'})`);
  }

  // Save markdown locally
  const mdPath = htmlPath.replace('.html', '.md');
  fs.writeFileSync(mdPath, cleanedMarkdown);
  console.log(`  ✅ Saved markdown: ${path.basename(mdPath)}`);
}

async function processAll() {
  const htmlDir = path.join(__dirname, '../tmp/aoma-html');
  const files = fs.readdirSync(htmlDir).filter(f => f.endsWith('.html'));

  console.log(`🕷️ Processing ${files.length} HTML files...\n`);

  for (const file of files) {
    await processHtmlFile(path.join(htmlDir, file));
  }

  console.log(`\n✅ Processing complete!`);
}

// Run if called directly
if (require.main === module) {
  processAll().catch(console.error);
}

module.exports = { processHtmlFile };
