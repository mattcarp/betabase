#!/bin/bash

# Apply RLS migration for siam_vectors table
# Supabase connection details from .env.local

echo "🚀 Applying siam_vectors RLS migration..."

# Load from .env.local
set -a
source .env.local
set +a

echo "🔗 Using Supabase URL: $NEXT_PUBLIC_SUPABASE_URL"

# Extract database URL from Supabase URL
if [[ "$NEXT_PUBLIC_SUPABASE_URL" == *"127.0.0.1"* ]] || [[ "$NEXT_PUBLIC_SUPABASE_URL" == *"localhost"* ]]; then
  echo "🏠 Detected local Supabase instance"
  DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
else
  PROJECT_REF=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed -E 's/https:\/\/([^.]+).*/\1/')
  DB_URL="postgresql://postgres.[${PROJECT_REF}]@aws-0-us-east-2.pooler.supabase.com:6543/postgres"
fi

echo "📊 Applying migration: fix_siam_vectors_rls.sql"
echo ""

# Apply migration using psql
psql "$DB_URL" -f supabase/migrations/fix_siam_vectors_rls.sql

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ RLS migration applied successfully!"
  echo "   Supabase (Vectors) should now be accessible via anon key"
else
  echo ""
  echo "❌ Migration failed. Check the error above."
  exit 1
fi
