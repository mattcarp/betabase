#!/bin/bash
# Detailed vector audit - check embedding dimensions and quality

SUPABASE_URL="https://kfxetwuuzljhybfgmpuc.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmeGV0d3V1emxqaHliZmdtcHVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjI5NjMzMywiZXhwIjoyMDUxODcyMzMzfQ.LX04PQaQFJ7Tz_USQcbMPiuROMEEVaDFywoOLTjE4xk"

echo "=== Detailed Vector Audit ==="
echo ""

echo "1. TOTAL ROW COUNTS:"
echo "   siam_vectors: 15,245 rows (from content-range header)"

echo ""
echo "2. Check a single vector's embedding (first 10 values to see dimension):"
curl -s "${SUPABASE_URL}/rest/v1/siam_vectors?select=id,embedding&limit=1" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" | jq '.[0].embedding | length'

echo ""
echo "3. Sample content lengths (to check if content is populated):"
curl -s "${SUPABASE_URL}/rest/v1/siam_vectors?select=id,content&limit=10" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" | jq 'map({id: .id, content_length: (.content | length)})'

echo ""
echo "4. Check for NULL embeddings:"
curl -s "${SUPABASE_URL}/rest/v1/siam_vectors?embedding=is.null&select=id&limit=100" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Prefer: count=exact" \
  -I 2>/dev/null | grep -i "content-range"

echo ""
echo "5. Check for empty content:"
curl -s "${SUPABASE_URL}/rest/v1/siam_vectors?content=eq.&select=id" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Prefer: count=exact" \
  -I 2>/dev/null | grep -i "content-range"

echo ""
echo "6. Sample of actual content (first 200 chars):"
curl -s "${SUPABASE_URL}/rest/v1/siam_vectors?select=source_type,source_id,content&limit=3" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" | jq 'map({source_type, source_id, content_preview: (.content | .[0:200])})'

echo ""
echo "7. Check if there are duplicate source_ids:"
curl -s "${SUPABASE_URL}/rest/v1/siam_vectors?select=source_id" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" > /tmp/source_ids.json

echo "   Total source_ids fetched (first 1000): $(cat /tmp/source_ids.json | jq length)"
echo "   Unique source_ids: $(cat /tmp/source_ids.json | jq '[.[].source_id] | unique | length')"

echo ""
echo "8. Check RPC functions available:"
curl -s "${SUPABASE_URL}/rest/v1/rpc/" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" | head -c 500

echo ""
echo "9. Test match_siam_vectors RPC function exists:"
curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/match_siam_vectors" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{}' | head -c 300
