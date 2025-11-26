#!/bin/bash

# Quick script to apply RLHF schema to Supabase

echo "🔧 Applying RLHF schema to Supabase..."

# Always load from .env.local to ensure we have the latest values
echo "📂 Loading from .env.local..."
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

echo "📊 Applying migration: 007_rlhf_feedback_schema.sql"

# Apply the migration
psql "$DB_URL" -f supabase/migrations/007_rlhf_feedback_schema.sql

if [ $? -eq 0 ]; then
  echo "✅ Schema applied successfully!"
  echo ""
  echo "🌱 Now run: npx tsx scripts/seed-enhanced-rlhf-demo.ts"
else
  echo "❌ Failed to apply schema"
  echo ""
  echo "💡 Alternative: Copy the SQL from supabase/migrations/007_rlhf_feedback_schema.sql"
  echo "   and paste it into the Supabase SQL Editor at:"
  echo "   https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new"
fi
