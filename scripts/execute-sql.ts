#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const sqlFile = process.argv[2];
if (!sqlFile) {
  console.error('Usage: execute-sql.ts <sql-file>');
  process.exit(1);
}

const sql = readFileSync(sqlFile, 'utf-8');

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSql() {
  console.log(`Executing SQL from ${sqlFile}...`);

  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    // If the RPC doesn't exist, try direct query
    console.log('RPC not found, trying direct query...');
    const { data: directData, error: directError } = await supabase
      .from('_sql')
      .select('*')
      .limit(0); // This won't work, we need a different approach

    console.error('Error executing SQL:', error);
    process.exit(1);
  }

  console.log('Success!');
  console.log(JSON.stringify(data, null, 2));
}

executeSql();
