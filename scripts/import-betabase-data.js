#!/usr/bin/env node

/**
 * Import betabase data to Supabase
 * 
 * Prerequisites:
 * 1. Run betabase-supabase-schema.sql in Supabase SQL Editor first
 * 2. Ensure local Supabase Docker is running with betabase_backup database
 * 3. Credentials stored in Infisical (BETABASE_SUPABASE_URL, BETABASE_SUPABASE_SERVICE_ROLE_KEY)
 * 
 * Usage: infisical run --env=dev -- node scripts/import-betabase-data.js
 */

const { Pool } = require('pg');
const https = require('https');

// Source: Local Supabase Docker instance
const sourcePool = new Pool({
  host: 'localhost',
  port: 54322,
  user: 'postgres',
  password: 'postgres', // Local Docker password
  database: 'betabase_backup',
});

// Target: Hosted Supabase (credentials from Infisical)
const SUPABASE_URL = process.env.BETABASE_SUPABASE_URL || 'https://iopohiajcgkppajrkcfu.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.BETABASE_SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_XfhS3kZ0lr2mtA7k9izWPA_r3khrZfq';

const TABLES = [
  { name: 'betabase_application', localName: 'application', rows: 10 },
  { name: 'betabase_user', localName: 'user', rows: 30, quoted: true },
  { name: 'betabase_round', localName: 'round', rows: 154 },
  { name: 'betabase_variation', localName: 'variation', rows: 67 },
  { name: 'betabase_cases', localName: 'cases', rows: 1359 },
  { name: 'betabase_deployment', localName: 'deployment', rows: 1793 },
  { name: 'betabase_scenario', localName: 'scenario', rows: 8449 },
  { name: 'betabase_test', localName: 'test', rows: 34631 }
];

async function supabaseInsert(tableName, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'iopohiajcgkppajrkcfu.supabase.co',
      port: 443,
      path: `/rest/v1/${tableName}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'return=minimal'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function copyTableData(table) {
  const localTableName = table.quoted ? '"user"' : table.localName;
  const apiTableName = table.name;
  
  console.log(`\n📦 Copying ${table.name}... (expected: ${table.rows} rows)`);
  
  try {
    // Get data from source
    const result = await sourcePool.query(`SELECT * FROM ${localTableName}`);
    const rows = result.rows;
    
    console.log(`   Found ${rows.length} rows`);
    
    if (rows.length === 0) {
      console.log(`   ⏭️  Skipping empty table`);
      return { table: table.name, inserted: 0, total: 0 };
    }
    
    // Insert in batches of 50 (Supabase limit)
    const BATCH_SIZE = 50;
    let inserted = 0;
    let errors = 0;
    
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      
      try {
        await supabaseInsert(apiTableName, batch);
        inserted += batch.length;
        process.stdout.write(`\r   ✅ Inserted ${inserted}/${rows.length} rows`);
      } catch (error) {
        errors++;
        console.error(`\n   ❌ Error inserting batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`);
        // Continue with next batch
      }
      
      // Rate limiting: wait 100ms between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n   ✅ Completed ${table.name}: ${inserted}/${rows.length} rows (${errors} errors)`);
    
    return { table: table.name, inserted, total: rows.length, errors };
    
  } catch (err) {
    console.error(`   ❌ Failed to copy ${table.name}:`, err.message);
    return { table: table.name, inserted: 0, total: 0, errors: 1 };
  }
}

async function main() {
  console.log('🚀 Starting Betabase → Supabase Data Import\n');
  console.log(`Source: localhost:54322/betabase_backup`);
  console.log(`Target: ${SUPABASE_URL}\n`);
  console.log('⚠️  Make sure you ran betabase-supabase-schema.sql in Supabase SQL Editor first!\n');
  
  const results = [];
  
  try {
    for (const table of TABLES) {
      const result = await copyTableData(table);
      results.push(result);
    }
    
    console.log('\n\n✅ Import complete!\n');
    
    // Summary
    console.log('📈 Summary:');
    console.log('┌─────────────┬──────────┬───────┬────────┐');
    console.log('│ Table       │ Inserted │ Total │ Errors │');
    console.log('├─────────────┼──────────┼───────┼────────┤');
    
    let totalInserted = 0;
    let totalRows = 0;
    let totalErrors = 0;
    
    for (const result of results) {
      console.log(`│ ${result.table.padEnd(11)} │ ${String(result.inserted).padStart(8)} │ ${String(result.total).padStart(5)} │ ${String(result.errors || 0).padStart(6)} │`);
      totalInserted += result.inserted;
      totalRows += result.total;
      totalErrors += result.errors || 0;
    }
    
    console.log('├─────────────┼──────────┼───────┼────────┤');
    console.log(`│ TOTAL       │ ${String(totalInserted).padStart(8)} │ ${String(totalRows).padStart(5)} │ ${String(totalErrors).padStart(6)} │`);
    console.log('└─────────────┴──────────┴───────┴────────┘');
    
    if (totalErrors > 0) {
      console.log('\n⚠️  Some errors occurred during import. Check the logs above.');
      process.exit(1);
    }
    
  } catch (err) {
    console.error('\n❌ Import failed:', err);
    process.exit(1);
  } finally {
    await sourcePool.end();
  }
}

main();
