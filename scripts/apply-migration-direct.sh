#!/bin/bash

# Apply JIRA migration directly using psql
# Supabase connection details from .env.local

source .env.local

# Extract project ID from Supabase URL
PROJECT_ID=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed -E 's|https://([^.]+)\.supabase\.co|\1|')

# Supabase DB connection string format:
# postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres

echo "🚀 Applying JIRA database migration..."
echo "   Project: $PROJECT_ID"
echo ""

# Apply migration using psql
psql "postgresql://postgres.${PROJECT_ID}:${SUPABASE_SERVICE_ROLE_KEY}@aws-0-us-east-2.pooler.supabase.com:6543/postgres" \
  -f supabase/migrations/20251013_create_jira_tables.sql

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Migration applied successfully!"
else
  echo ""
  echo "❌ Migration failed. Check the error above."
  exit 1
fi
