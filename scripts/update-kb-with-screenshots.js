#!/usr/bin/env node

/**
 * Update AOMA knowledge base with screenshot references
 * Adds screenshot_path metadata to existing vector entries
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateKnowledgeBaseWithScreenshots() {
  console.log('\n📸 Updating Knowledge Base with Screenshots\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Find the latest screenshot directory
  const tmpDir = 'tmp';
  const screenshotDirs = fs.readdirSync(tmpDir)
    .filter(name => name.startsWith('aoma-screenshots-'))
    .sort()
    .reverse();

  if (screenshotDirs.length === 0) {
    console.log('❌ No screenshot directories found');
    console.log('💡 Run: ./scripts/capture-all-aoma-screenshots.sh first');
    process.exit(1);
  }

  const latestDir = path.join(tmpDir, screenshotDirs[0]);
  const manifestPath = path.join(latestDir, 'manifest.json');

  if (!fs.existsSync(manifestPath)) {
    console.log('❌ No manifest.json found in', latestDir);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  console.log(`📂 Using screenshots from: ${latestDir}`);
  console.log(`📊 Total screenshots: ${manifest.screenshots.length}\n`);

  let updated = 0;
  let notFound = 0;

  for (const screenshot of manifest.screenshots) {
    const url = screenshot.url;
    const screenshotPath = `/${latestDir}/${screenshot.screenshot}`;

    // Find matching knowledge base entry by URL or content
    const urlPattern = url.replace('https://aoma-stage.smcdp-de.net/', '');

    console.log(`🔍 Processing: ${urlPattern}`);

    // Try to find the entry in the knowledge base
    const { data: entries, error: searchError } = await supabase
      .from('aoma_unified_vectors')
      .select('id, content, metadata')
      .eq('source_type', 'knowledge')
      .ilike('content', `%${urlPattern}%`)
      .limit(1);

    if (searchError) {
      console.log(`   ⚠️  Search error: ${searchError.message}`);
      continue;
    }

    if (!entries || entries.length === 0) {
      console.log(`   ⚠️  No matching entry found`);
      notFound++;
      continue;
    }

    const entry = entries[0];

    // Update metadata with screenshot path
    const updatedMetadata = {
      ...(entry.metadata || {}),
      screenshot_path: screenshotPath,
      screenshot_captured_at: manifest.captured_at
    };

    const { error: updateError } = await supabase
      .from('aoma_unified_vectors')
      .update({
        metadata: updatedMetadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', entry.id);

    if (updateError) {
      console.log(`   ❌ Update failed: ${updateError.message}`);
      continue;
    }

    console.log(`   ✅ Updated with screenshot: ${screenshot.screenshot}`);
    updated++;
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`✅ Updated: ${updated} entries`);
  console.log(`⚠️  Not found: ${notFound} entries`);
  console.log('\n📊 Knowledge base now includes visual references!\n');
  console.log('💡 Next steps:');
  console.log('1. Test chat with: "Show me the QC Providers interface"');
  console.log('2. Enhance chat to display screenshots in responses');
  console.log('3. Consider CLIP embeddings for visual search\n');
}

updateKnowledgeBaseWithScreenshots().catch(console.error);
