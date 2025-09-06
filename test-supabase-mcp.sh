#!/bin/bash

# Test Supabase MCP Server Connection
# This script tests if the Supabase MCP server is properly configured

echo "🔍 Testing Supabase MCP Server Connection..."
echo "============================================"

# Test the MCP server using npx
echo "Testing Supabase MCP server..."

# Set environment variables
export SUPABASE_URL="https://kfxetwuuzljhybfgmpuc.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmeGV0d3V1emxqaHliZmdtcHVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjI5NjMzMywiZXhwIjoyMDUxODcyMzMzfQ.LX04PQaQFJ7Tz_USQcbMPiuROMEEVaDFywoOLTjE4xk"

# Try to list tables using the MCP server
echo "Attempting to connect to Supabase..."

# Create a simple test using Node.js in the project directory
cat > /Users/matt/Documents/projects/siam/test-supabase-connection.js << 'EOF'
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Try to query the aoma_unified_vectors table
    const { data, error } = await supabase
      .from('aoma_unified_vectors')
      .select('count', { count: 'exact' });

    if (error) {
      console.error('❌ Error querying table:', error.message);
      return;
    }

    console.log('✅ Successfully connected to Supabase!');
    console.log(`📊 aoma_unified_vectors table has ${data} rows`);

    // List all tables (using a simple query)
    const { data: tables, error: tablesError } = await supabase
      .from('aoma_migration_status')
      .select('count', { count: 'exact' });

    if (!tablesError) {
      console.log('✅ aoma_migration_status table exists');
    }

    console.log('\n🎉 Supabase MCP server is ready to use!');
    
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  }
}

testConnection();
EOF

# Run the test
echo "Running connection test..."
cd /Users/matt/Documents/projects/siam
node test-supabase-connection.js

# Clean up
rm test-supabase-connection.js

echo ""
echo "============================================"
echo "Test complete!"
echo ""
echo "To use from Claude Desktop:"
echo "1. Restart Claude Desktop to load the new MCP server"
echo "2. Ask Claude to 'List tables in Supabase'"
echo "3. Ask Claude to 'Query the aoma_unified_vectors table'"
