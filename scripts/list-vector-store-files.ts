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
    // Use the vectorStores API directly (not beta.vectorStores)
    const files = await openai.vectorStores.files.list(VECTOR_STORE_ID);
    
    console.log(`Found ${files.data.length} files:\n`);
    
    for (let i = 0; i < files.data.length; i++) {
      const file = files.data[i];
      
      try {
        // Get file details
        const fileDetails = await openai.files.retrieve(file.id);
        
        console.log(`${i + 1}. ${fileDetails.filename}`);
        console.log(`   ID: ${file.id}`);
        console.log(`   Size: ${(fileDetails.bytes / 1024).toFixed(2)} KB`);
        console.log(`   Created: ${new Date(fileDetails.created_at * 1000).toLocaleString()}`);
        console.log('');
      } catch (error) {
        console.log(`${i + 1}. [Error fetching details for ${file.id}]`);
        console.log('');
      }
    }
    
    console.log(`Total: ${files.data.length} files`);
    
  } catch (error) {
    console.error('❌ Error listing files:', error);
    console.error('\nError details:', JSON.stringify(error, null, 2));
  }
}

listFiles();

