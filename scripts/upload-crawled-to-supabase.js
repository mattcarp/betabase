#!/usr/bin/env node

/**
 * Upload crawled AOMA data to Supabase
 */

const fs = require('fs').promises;
const path = require('path');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function uploadToSupabase() {
  console.log('📤 Uploading AOMA data to Supabase...\n');
  
  // Find the latest crawled file
  const files = await fs.readdir('tmp');
  const crawledFiles = files.filter(f => f.startsWith('aoma-crawled-') && f.endsWith('.json'));
  
  if (crawledFiles.length === 0) {
    console.error('❌ No crawled data files found');
    return;
  }
  
  const latestFile = crawledFiles.sort().pop();
  const filePath = path.join('tmp', latestFile);
  
  console.log(`📁 Loading: ${latestFile}\n`);
  
  const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
  
  console.log(`Found ${data.length} pages to upload\n`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const item of data) {
    console.log(`📄 ${item.endpoint}`);
    
    const record = {
      url: item.url,
      title: item.title || 'AOMA Page',
      content: item.content,
      content_hash: crypto.createHash('md5').update(item.content).digest('hex'),
      crawled_at: item.crawled_at,
      metadata: {
        endpoint: item.endpoint,
        tables: item.tables || 0,
        forms: item.forms || 0,
        links: item.links || []
      }
    };
    
    // Try aoma_knowledge table first
    let { error } = await supabase
      .from('aoma_knowledge')
      .upsert(record, { onConflict: 'url' });
    
    if (error && error.message.includes('does not exist')) {
      // Table doesn't exist, try documents table
      console.log('  ⚠️ aoma_knowledge table not found, trying documents...');
      
      const docRecord = {
        title: item.title,
        content: item.content,
        metadata: record.metadata,
        created_at: item.crawled_at
      };
      
      const result = await supabase
        .from('documents')
        .upsert(docRecord);
      
      error = result.error;
    }
    
    if (error) {
      console.log(`  ❌ Error: ${error.message}`);
      errorCount++;
    } else {
      console.log(`  ✅ Uploaded`);
      successCount++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Upload complete!`);
  console.log(`📊 Success: ${successCount}, Errors: ${errorCount}`);
  console.log('='.repeat(60));
  
  if (errorCount > 0) {
    console.log('\n⚠️ Some uploads failed.');
    console.log('Make sure the aoma_knowledge table exists.');
    console.log('Run the SQL in: sql/create-all-knowledge-tables.sql');
  }
}

uploadToSupabase().catch(console.error);