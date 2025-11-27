import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getAllTableNames(): Promise<string[]> {
  const typesPath = path.resolve(__dirname, '../supabase-types.ts');
  const content = fs.readFileSync(typesPath, 'utf-8');
  const lines = content.split('\n');
  
  const tableNames: string[] = [];
  let insidePublicTables = false;
  
  for (const line of lines) {
    if (line.includes('public: {')) {
      // We are entering public schema
    }
    if (line.includes('Tables: {') && !insidePublicTables) {
      // We found the start of tables (assuming it's the first one after public, or we track nesting)
      // Actually, looking at the file, "public: {" is at line 40, "Tables: {" is at line 41.
      // But there is also "graphql_public" before.
      // Let's be more specific.
    }
  }

  // Simpler approach: Look for lines that look like table definitions
  // The structure is consistently:
  //       tableName: {
  //         Row: {
  
  // Let's iterate and find the "public" block first
  let inPublic = false;
  let inTables = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.trim() === 'public: {') {
      inPublic = true;
      continue;
    }
    
    if (inPublic && line.trim() === 'Tables: {') {
      inTables = true;
      continue;
    }
    
    if (inTables && line === '    }') {
      // End of Tables block (4 spaces indentation)
      inTables = false;
      inPublic = false; // Stop looking
      break;
    }
    
    if (inTables && line === '    },') {
       // Also handle comma case if it exists
       inTables = false;
       inPublic = false;
       break;
    }
    
    if (inTables) {
      // Match lines like "      tableName: {" (6 spaces)
      // We must be careful not to match "        Row: {" (8 spaces)
      const match = line.match(/^      ([a-zA-Z0-9_]+): \{$/);
      if (match) {
        tableNames.push(match[1]);
      }
    }
  }
  
  return tableNames;
}

async function countRecords() {
  console.log(`\n📊 Counting records for ALL tables in Supabase: ${supabaseUrl}\n`);
  
  const tables = await getAllTableNames();
  console.log(`Found ${tables.length} tables in types definition.\n`);
  
  console.log('-'.repeat(60));
  console.log(`${'TABLE NAME'.padEnd(40)} | ${'COUNT'.padStart(10)}`);
  console.log('-'.repeat(60));

  let totalRecords = 0;

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`${table.padEnd(40)} | ${'ERROR'.padStart(10)} (${error.message})`);
    } else {
      console.log(`${table.padEnd(40)} | ${count?.toLocaleString().padStart(10)}`);
      totalRecords += (count || 0);
    }
  }
  
  console.log('-'.repeat(60));
  console.log(`${'TOTAL RECORDS'.padEnd(40)} | ${totalRecords.toLocaleString().padStart(10)}`);
  console.log('-'.repeat(60));
}

countRecords().catch(console.error);
