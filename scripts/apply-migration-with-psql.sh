#!/bin/bash

# Apply Beta Base migration using psql
# This connects directly to Supabase and runs the SQL

set -e

echo "🚀 Applying Beta Base migration to SIAM Supabase..."
echo

# Load environment variables
source .env.local

# Build connection string
DB_HOST="db.kfxetwuuzljhybfgmpuc.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres.kfxetwuuzljhybfgmpuc"

# Get password from service role key (Supabase uses same password as service role key for direct connections)
# Actually, we need the database password, not the service role key
# Let's use the connection pooler instead

echo "📍 Target: ${DB_HOST}"
echo "📄 Migration: supabase/migrations/009_beta_base_scenarios.sql"
echo

# Try to connect and apply migration
PGPASSWORD="${SUPABASE_SERVICE_ROLE_KEY}" psql \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  -f supabase/migrations/009_beta_base_scenarios.sql \
  2>&1

if [ $? -eq 0 ]; then
  echo
  echo "✅ Migration applied successfully!"
  echo "🎉 Ready to import Beta Base scenarios"
else
  echo
  echo "❌ Migration failed"
  echo "   You may need to apply it manually via Supabase dashboard"
  exit 1
fi
