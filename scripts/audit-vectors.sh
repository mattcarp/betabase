#!/bin/bash
# Audit Supabase vector tables

SUPABASE_URL="https://kfxetwuuzljhybfgmpuc.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmeGV0d3V1emxqaHliZmdtcHVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjI5NjMzMywiZXhwIjoyMDUxODcyMzMzfQ.LX04PQaQFJ7Tz_USQcbMPiuROMEEVaDFywoOLTjE4xk"

echo "=== SIAM Vector Table Audit ==="
echo ""

echo "1. Checking siam_vectors table (sample rows):"
curl -s "${SUPABASE_URL}/rest/v1/siam_vectors?select=id,organization,division,app_under_test,source_type,source_id,created_at&limit=5" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" | jq '.'

echo ""
echo "2. Row count for siam_vectors:"
curl -s "${SUPABASE_URL}/rest/v1/siam_vectors?select=id" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Prefer: count=exact" \
  -I 2>/dev/null | grep -i "content-range"

echo ""
echo "3. Checking siam_unified_vectors table:"
curl -s "${SUPABASE_URL}/rest/v1/siam_unified_vectors?select=id,organization,division,app_under_test,source_type,source_id,created_at&limit=5" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" | jq '.'

echo ""
echo "4. Row count for siam_unified_vectors:"
curl -s "${SUPABASE_URL}/rest/v1/siam_unified_vectors?select=id" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Prefer: count=exact" \
  -I 2>/dev/null | grep -i "content-range"

echo ""
echo "5. Check source_type distribution in siam_vectors:"
curl -s "${SUPABASE_URL}/rest/v1/siam_vectors?select=source_type" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" | jq 'group_by(.source_type) | map({source_type: .[0].source_type, count: length})'

echo ""
echo "6. Check organization distribution:"
curl -s "${SUPABASE_URL}/rest/v1/siam_vectors?select=organization" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" | jq 'group_by(.organization) | map({organization: .[0].organization, count: length})'
