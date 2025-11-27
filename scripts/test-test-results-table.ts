import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testing test_results table access...\n');
console.log('URL:', supabaseUrl);
console.log('Anon Key exists:', !!supabaseAnonKey);
console.log('Service Key exists:', !!supabaseServiceKey);
console.log('');

if (!supabaseUrl) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL');
  process.exit(1);
}

async function testWithAnonKey() {
  if (!supabaseAnonKey) {
    console.log('⚠️  No anon key, skipping anon test');
    return;
  }

  console.log('📋 Testing with ANON key (what the dashboard uses)...');
  const supabase = createClient(supabaseUrl!, supabaseAnonKey);

  try {
    // First, check if table exists
    const { data: tables, error: tablesError } = await supabase
      .from('test_results')
      .select('id')
      .limit(0);

    if (tablesError) {
      console.error('❌ Error accessing test_results table:', {
        message: tablesError.message,
        details: tablesError.details,
        hint: tablesError.hint,
        code: tablesError.code,
      });
      return;
    }

    console.log('✅ Table exists and is accessible');

    // Try to query data
    const { data, error, count } = await supabase
      .from('test_results')
      .select('*', { count: 'exact' })
      .limit(5);

    if (error) {
      console.error('❌ Error querying test_results:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
    } else {
      console.log(`✅ Query successful! Found ${count} total records`);
      console.log(`📊 Sample data (first ${data?.length || 0} records):`, 
        data?.map(r => ({ id: r.id, test_name: r.test_name, status: r.status }))
      );
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
  console.log('');
}

async function testWithServiceKey() {
  if (!supabaseServiceKey) {
    console.log('⚠️  No service key, skipping service role test');
    return;
  }

  console.log('🔑 Testing with SERVICE ROLE key...');
  const supabase = createClient(supabaseUrl!, supabaseServiceKey);

  try {
    const { data, error, count } = await supabase
      .from('test_results')
      .select('*', { count: 'exact' })
      .limit(5);

    if (error) {
      console.error('❌ Error with service role:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
    } else {
      console.log(`✅ Service role query successful! Found ${count} total records`);
      console.log(`📊 Sample data (first ${data?.length || 0} records):`, 
        data?.map(r => ({ id: r.id, test_name: r.test_name, status: r.status }))
      );
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
  console.log('');
}

async function checkRLSPolicies() {
  if (!supabaseServiceKey) {
    console.log('⚠️  No service key, skipping RLS check');
    return;
  }

  console.log('🔒 Checking RLS policies...');
  const supabase = createClient(supabaseUrl!, supabaseServiceKey);

  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          schemaname, 
          tablename, 
          policyname, 
          permissive, 
          roles, 
          cmd, 
          qual, 
          with_check
        FROM pg_policies 
        WHERE tablename = 'test_results';
      `
    });

    if (error) {
      // Try alternative approach
      console.log('ℹ️  RPC not available, policies should be checked in Supabase dashboard');
    } else {
      console.log('✅ RLS Policies:', data);
    }
  } catch (err) {
    console.log('ℹ️  Could not query policies programmatically');
  }
  console.log('');
}

async function main() {
  await testWithAnonKey();
  await testWithServiceKey();
  await checkRLSPolicies();
  
  console.log('✨ Test complete!');
}

main();
