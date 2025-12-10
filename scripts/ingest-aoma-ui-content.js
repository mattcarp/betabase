#!/usr/bin/env node
/**
 * Ingest AOMA UI Content into Supabase
 * 
 * Takes the extracted UI content and stores it in Supabase
 * for use in user help, walkthroughs, and RAG retrieval.
 */

const fs = require('fs');
require('dotenv').config({ path: '/Users/matt/Documents/projects/mc-thebetabase/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const INPUT_FILE = '/Users/matt/Documents/projects/mc-thebetabase/data/aoma-ui-content.json';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('AOMA UI Content -> Supabase Ingestion');
  console.log('=====================================\n');
  
  // Load extracted content
  const data = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
  console.log(`Loaded ${data.total_items} items from ${data.source}`);
  console.log(`Extracted at: ${data.extracted_at}\n`);
  
  // Prepare documents for insertion
  const documents = data.content.map((item, idx) => ({
    organization: 'sony-music',
    division: 'digital-operations',
    app_under_test: 'aoma',
    source_type: 'ui-content',
    source_url: item.source_file,
    content: `[${item.type.toUpperCase()}] ${item.text}`,
    metadata: {
      content_type: item.type,
      component: item.component,
      module: item.module,
      extracted_at: data.extracted_at
    }
  }));
  
  console.log(`Prepared ${documents.length} documents for insertion`);
  
  // Check if we have a table for this
  // First, let's try inserting into siam_vectors or create a new content table
  
  // Try to insert in batches of 100
  const batchSize = 100;
  let inserted = 0;
  let errors = 0;
  
  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize);
    
    const { data: result, error } = await supabase
      .from('aoma_ui_content')
      .insert(batch);
    
    if (error) {
      // Table might not exist, let's create it
      if (error.code === '42P01') {
        console.log('Table aoma_ui_content does not exist. Creating...');
        
        // Create the table via RPC or direct SQL
        const createTableResult = await supabase.rpc('exec_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS aoma_ui_content (
              id SERIAL PRIMARY KEY,
              organization TEXT,
              division TEXT,
              app_under_test TEXT,
              source_type TEXT,
              source_url TEXT,
              content TEXT,
              metadata JSONB,
              created_at TIMESTAMPTZ DEFAULT NOW()
            );
          `
        });
        
        if (createTableResult.error) {
          console.error('Could not create table:', createTableResult.error.message);
          // Fall back to logging to a file for manual import
          console.log('\nWriting SQL insert statements to file instead...');
          writeSqlFile(documents);
          return;
        }
        
        // Retry insert
        const retryResult = await supabase.from('aoma_ui_content').insert(batch);
        if (retryResult.error) {
          console.error(`Batch ${i / batchSize + 1} error:`, retryResult.error.message);
          errors += batch.length;
        } else {
          inserted += batch.length;
        }
      } else {
        console.error(`Batch ${i / batchSize + 1} error:`, error.message);
        errors += batch.length;
      }
    } else {
      inserted += batch.length;
    }
    
    process.stdout.write(`\rProgress: ${Math.min(i + batchSize, documents.length)}/${documents.length}`);
  }
  
  console.log(`\n\nComplete!`);
  console.log(`Inserted: ${inserted}`);
  console.log(`Errors: ${errors}`);
}

function writeSqlFile(documents) {
  const sqlStatements = [
    `-- AOMA UI Content
-- Generated: ${new Date().toISOString()}
-- Total records: ${documents.length}

CREATE TABLE IF NOT EXISTS aoma_ui_content (
  id SERIAL PRIMARY KEY,
  organization TEXT,
  division TEXT,
  app_under_test TEXT,
  source_type TEXT,
  source_url TEXT,
  content TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

`
  ];
  
  for (const doc of documents) {
    const metadata = JSON.stringify(doc.metadata).replace(/'/g, "''");
    const content = doc.content.replace(/'/g, "''");
    const sourceUrl = (doc.source_url || '').replace(/'/g, "''");
    
    sqlStatements.push(`INSERT INTO aoma_ui_content (organization, division, app_under_test, source_type, source_url, content, metadata) VALUES ('${doc.organization}', '${doc.division}', '${doc.app_under_test}', '${doc.source_type}', '${sourceUrl}', '${content}', '${metadata}');`);
  }
  
  const outputFile = '/Users/matt/Documents/projects/mc-thebetabase/data/aoma-ui-content.sql';
  fs.writeFileSync(outputFile, sqlStatements.join('\n'));
  console.log(`SQL written to: ${outputFile}`);
  console.log(`Run this in Supabase SQL Editor to import the data.`);
}

main().catch(console.error);
