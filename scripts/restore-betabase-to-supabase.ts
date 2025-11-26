#!/usr/bin/env ts-node

/**
 * Restore betabase backup to Supabase
 * 
 * This script reads the local betabase_backup database and copies all data
 * to the new Supabase project (iopohiajcgkppajrkcfu)
 */

import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';

// Source: Local Supabase Docker instance
const sourcePool = new Pool({
  host: 'localhost',
  port: 54322,
  user: 'postgres',
  password: 'postgres',
  database: 'betabase_backup',
});

// Target: Hosted Supabase
const SUPABASE_URL = 'https://iopohiajcgkppajrkcfu.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_XfhS3kZ0lr2mtA7k9izWPA_r3khrZfq';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const TABLES = [
  'application',
  'user',
  'round',
  'variation',
  'cases',
  'deployment',
  'scenario',
  'test'
];

async function createTables() {
  console.log('📋 Creating tables in Supabase...\n');
  
  const schemas = {
    application: `
      CREATE TABLE IF NOT EXISTS application (
        id INTEGER PRIMARY KEY,
        name VARCHAR(255),
        primary_color VARCHAR(255)
      );
    `,
    user: `
      CREATE TABLE IF NOT EXISTS "user" (
        id INTEGER PRIMARY KEY,
        username VARCHAR(180),
        username_canonical VARCHAR(180),
        email VARCHAR(180),
        email_canonical VARCHAR(180),
        enabled SMALLINT NOT NULL,
        salt VARCHAR(255),
        password VARCHAR(255),
        last_login VARCHAR(255),
        locked SMALLINT NOT NULL,
        expired SMALLINT NOT NULL,
        expires_at VARCHAR(255),
        confirmation_token VARCHAR(180),
        password_requested_at VARCHAR(255),
        roles TEXT NOT NULL,
        credentials_expired SMALLINT NOT NULL,
        credentials_expire_at VARCHAR(255),
        created_at VARCHAR(255),
        updated_at VARCHAR(255),
        f_name VARCHAR(255),
        l_name VARCHAR(255),
        jira_username VARCHAR(255),
        is_notified SMALLINT,
        mobile_phone VARCHAR(255),
        org VARCHAR(255)
      );
    `,
    round: `
      CREATE TABLE IF NOT EXISTS round (
        id INTEGER PRIMARY KEY,
        name VARCHAR(255),
        starts_at VARCHAR(255),
        ends_at VARCHAR(255),
        updated_at VARCHAR(255),
        release_num VARCHAR(255),
        app VARCHAR(255),
        notes TEXT,
        created_at VARCHAR(255),
        client_notes TEXT,
        current_flag SMALLINT,
        release_date VARCHAR(255)
      );
    `,
    variation: `
      CREATE TABLE IF NOT EXISTS variation (
        id INTEGER PRIMARY KEY,
        scenario_id TEXT NOT NULL,
        variation_text TEXT,
        created_by VARCHAR(255),
        updated_by VARCHAR(255),
        created_at VARCHAR(255),
        updated_at VARCHAR(255)
      );
    `,
    cases: `
      CREATE TABLE IF NOT EXISTS cases (
        id INTEGER,
        app_under_test VARCHAR(5),
        name VARCHAR(254),
        script VARCHAR(1376),
        expected_result VARCHAR(462),
        tags VARCHAR(92),
        created_by VARCHAR(19),
        created_at VARCHAR(19),
        updated_by VARCHAR(19),
        updated_at VARCHAR(19),
        preconditions VARCHAR(590)
      );
    `,
    deployment: `
      CREATE TABLE IF NOT EXISTS deployment (
        id INTEGER PRIMARY KEY,
        build VARCHAR(255),
        branch VARCHAR(255),
        app_under_test VARCHAR(255),
        deployed_at VARCHAR(255),
        record_inserted_at VARCHAR(255)
      );
    `,
    scenario: `
      CREATE TABLE IF NOT EXISTS scenario (
        id INTEGER PRIMARY KEY,
        name VARCHAR(255),
        script TEXT,
        expected_result TEXT,
        created_by VARCHAR(255),
        updated_by VARCHAR(255),
        preconditions TEXT,
        created_at VARCHAR(255),
        updated_at VARCHAR(255),
        review_flag SMALLINT,
        flag_reason TEXT,
        app_under_test VARCHAR(255),
        tags VARCHAR(255),
        coverage VARCHAR(255),
        client_priority SMALLINT,
        mode VARCHAR(255),
        is_security SMALLINT,
        priority_sort_order INTEGER,
        enhancement_sort_order INTEGER,
        current_regression_sort_order INTEGER,
        reviewed_flag VARCHAR(255)
      );
    `,
    test: `
      CREATE TABLE IF NOT EXISTS test (
        id INTEGER PRIMARY KEY,
        scenario_id INTEGER,
        created_at VARCHAR(255),
        comments TEXT,
        ticket VARCHAR(255),
        created_by VARCHAR(255),
        input TEXT,
        result TEXT,
        pass_fail VARCHAR(255),
        build VARCHAR(255),
        updated_at VARCHAR(255),
        updated_by VARCHAR(255),
        path VARCHAR(255),
        browser_name VARCHAR(255),
        browser_major VARCHAR(255),
        browser_minor VARCHAR(255),
        os_name VARCHAR(255),
        os_major VARCHAR(255),
        os_minor VARCHAR(255),
        deployment_stamp VARCHAR(255),
        in_prod VARCHAR(255)
      );
    `
  };

  for (const table of TABLES) {
    try {
      const { error } = await supabase.rpc('exec_sql', { 
        sql: schemas[table as keyof typeof schemas] 
      });
      
      if (error) {
        console.error(`❌ Error creating ${table}:`, error);
      } else {
        console.log(`✅ Created table: ${table}`);
      }
    } catch (err) {
      console.error(`❌ Failed to create ${table}:`, err);
    }
  }
}

async function copyTableData(tableName: string) {
  console.log(`\n📦 Copying ${tableName}...`);
  
  try {
    // Get data from source
    const result = await sourcePool.query(`SELECT * FROM ${tableName === 'user' ? '"user"' : tableName}`);
    const rows = result.rows;
    
    console.log(`   Found ${rows.length} rows`);
    
    if (rows.length === 0) {
      console.log(`   ⏭️  Skipping empty table`);
      return;
    }
    
    // Insert in batches of 100
    const BATCH_SIZE = 100;
    let inserted = 0;
    
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      
      const { error } = await supabase
        .from(tableName)
        .insert(batch);
      
      if (error) {
        console.error(`   ❌ Error inserting batch ${i / BATCH_SIZE + 1}:`, error.message);
        // Continue with next batch
      } else {
        inserted += batch.length;
        process.stdout.write(`\r   ✅ Inserted ${inserted}/${rows.length} rows`);
      }
    }
    
    console.log(`\n   ✅ Completed ${tableName}: ${inserted}/${rows.length} rows`);
    
  } catch (err) {
    console.error(`   ❌ Failed to copy ${tableName}:`, err);
  }
}

async function main() {
  console.log('🚀 Starting Betabase → Supabase Restore\n');
  console.log(`Source: localhost:54322/betabase_backup`);
  console.log(`Target: ${SUPABASE_URL}\n`);
  
  try {
    // Step 1: Create tables
    await createTables();
    
    // Step 2: Copy data for each table
    console.log('\n📊 Copying data...\n');
    
    for (const table of TABLES) {
      await copyTableData(table);
    }
    
    console.log('\n\n✅ Restore complete!\n');
    
    // Summary
    console.log('📈 Summary:');
    for (const table of TABLES) {
      const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      console.log(`   ${table}: ${count} rows`);
    }
    
  } catch (err) {
    console.error('\n❌ Restore failed:', err);
    process.exit(1);
  } finally {
    await sourcePool.end();
  }
}

main();
