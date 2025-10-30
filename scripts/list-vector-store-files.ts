#!/usr/bin/env tsx
/**
 * List all files in the OpenAI Vector Store
 * Quick sanity check before migration
 */

import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const VECTOR_STORE_ID = process.env.VECTOR_STORE_ID || 'vs_3dqHL3Wcmt1WrUof0qS4UQqo';

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

async function listFiles() {
  console.log('🔍 Listing files from vector store:', VECTOR_STORE_ID);
  console.log('');
  
  try {
    // PAGINATION: Collect all files across all pages
    let allFiles: any[] = [];
    let hasMore = true;
    let after: string | undefined = undefined;
    let pageCount = 0;
    
    console.log('📄 Fetching all pages...');
    
    while (hasMore) {
      pageCount++;
      console.log(`   Fetching page ${pageCount}...`);
      
      const response = await openai.vectorStores.files.list(VECTOR_STORE_ID, {
        limit: 100, // Max items per page
        after: after
      });
      
      allFiles.push(...response.data);
      hasMore = response.hasMore || false;
      
      // Get the last ID for pagination cursor
      if (response.data.length > 0) {
        after = response.data[response.data.length - 1].id;
      }
      
      console.log(`   Got ${response.data.length} files (total so far: ${allFiles.length})`);
    }
    
    console.log(`\n✅ Found ${allFiles.length} total files across ${pageCount} pages\n`);
    
    // Now fetch details for each file
    let totalSize = 0;
    const filesByType: { [key: string]: number } = {};
    
    for (let i = 0; i < allFiles.length; i++) {
      const file = allFiles[i];
      
      try {
        // Get file details
        const fileDetails = await openai.files.retrieve(file.id);
        
        console.log(`${i + 1}. ${fileDetails.filename}`);
        console.log(`   ID: ${file.id}`);
        console.log(`   Size: ${(fileDetails.bytes / 1024).toFixed(2)} KB`);
        console.log(`   Created: ${new Date(fileDetails.created_at * 1000).toLocaleString()}`);
        console.log('');
        
        // Track stats
        totalSize += fileDetails.bytes;
        const ext = fileDetails.filename.split('.').pop()?.toLowerCase() || 'unknown';
        filesByType[ext] = (filesByType[ext] || 0) + 1;
        
      } catch (error) {
        console.log(`${i + 1}. [Error fetching details for ${file.id}]`);
        console.log('');
      }
    }
    
    // Summary statistics
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY STATISTICS');
    console.log('='.repeat(60));
    console.log(`Total Files: ${allFiles.length}`);
    console.log(`Total Size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log('\nFiles by Type:');
    Object.entries(filesByType)
      .sort(([, a], [, b]) => b - a)
      .forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error listing files:', error);
    console.error('\nError details:', JSON.stringify(error, null, 2));
  }
}

listFiles();

