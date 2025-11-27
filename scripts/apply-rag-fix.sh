#!/bin/bash
# Apply RAG pipeline fix to Supabase

SUPABASE_URL="https://kfxetwuuzljhybfgmpuc.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmeGV0d3V1emxqaHliZmdtcHVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjI5NjMzMywiZXhwIjoyMDUxODcyMzMzfQ.LX04PQaQFJ7Tz_USQcbMPiuROMEEVaDFywoOLTjE4xk"

echo "=== Applying RAG Pipeline Fix to Supabase ==="
echo ""

# The Supabase REST API doesn't support raw SQL execution
# We need to use the Supabase CLI or Dashboard

echo "To apply this migration, you have two options:"
echo ""
echo "OPTION 1: Via Supabase Dashboard"
echo "  1. Go to: https://supabase.com/dashboard/project/kfxetwuuzljhybfgmpuc/sql/new"
echo "  2. Paste the contents of: supabase/migrations/20251125_fix_rag_pipeline.sql"
echo "  3. Click 'Run'"
echo ""
echo "OPTION 2: Via Supabase CLI (if linked)"
echo "  supabase db push --linked"
echo ""

# Try direct psql if available
echo "Attempting direct database connection..."

# Get the database connection string
DB_HOST="db.kfxetwuuzljhybfgmpuc.supabase.co"
DB_NAME="postgres"
DB_USER="postgres"
DB_PORT="5432"

# Try to connect and run the migration
PGPASSWORD="${SUPABASE_DB_PASSWORD:-postgres}" psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -f "/Users/matt/Documents/projects/siam/supabase/migrations/20251125_fix_rag_pipeline.sql" 2>&1

if [ $? -eq 0 ]; then
  echo ""
  echo "Migration applied successfully!"
else
  echo ""
  echo "Direct connection failed. Please apply manually via Supabase Dashboard."
fi
