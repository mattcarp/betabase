#!/bin/bash

# Deploy match_aoma_vectors function to Supabase
# This script uses the Supabase Management API to execute SQL

set -e

# Load environment variables
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}"
SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

if [ -z "$SUPABASE_URL" ] || [ -z "$SERVICE_ROLE_KEY" ]; then
  echo "❌ Error: Missing Supabase credentials"
  echo "SUPABASE_URL: ${SUPABASE_URL:0:30}..."
  echo "SERVICE_ROLE_KEY: ${SERVICE_ROLE_KEY:0:30}..."
  exit 1
fi

echo "🚀 Deploying match_aoma_vectors function to Supabase..."
echo "📍 Target: $SUPABASE_URL"

# Read SQL file
SQL_FILE="sql/create-match-aoma-vectors-function.sql"
if [ ! -f "$SQL_FILE" ]; then
  echo "❌ Error: SQL file not found: $SQL_FILE"
  exit 1
fi

SQL_CONTENT=$(cat "$SQL_FILE")

# Execute SQL via Supabase REST API
echo "📤 Executing SQL..."

# Use Supabase's pg_meta API endpoint for executing SQL
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $(echo "$SQL_CONTENT" | jq -Rs .)}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
  echo "✅ SQL executed successfully!"
  echo "Response: $BODY"
else
  echo "❌ SQL execution failed with HTTP $HTTP_CODE"
  echo "Response: $BODY"
  echo ""
  echo "💡 Alternative: Copy the SQL from $SQL_FILE"
  echo "   and run it manually in Supabase SQL Editor:"
  echo "   ${SUPABASE_URL/https:\/\//https://supabase.com/dashboard/project/}/editor"
  exit 1
fi

echo "✅ Deployment complete!"
