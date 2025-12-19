#!/bin/bash
# Upload CDTEXT knowledge to Betabase vector store
# Usage: ./scripts/upload-cdtext-knowledge.sh

set -e

echo "🎵 Uploading CDTEXT knowledge to The Betabase..."

# Configuration
API_URL="http://localhost:3000/api/knowledge/upload"
ORG="sony_music"
DIV="digital_ops"
APP="aoma"

# Upload GNU libcdio official spec
echo ""
echo "📜 Uploading: GNU libcdio Official Specification..."
curl -X POST "$API_URL" \
  -F "file=@docs/cdtext-gnu-libcdio-spec.md" \
  -F "organization=$ORG" \
  -F "division=$DIV" \
  -F "app_under_test=$APP" \
  -F "sourceType=knowledge" \
  -F "metadata={\"category\":\"audio_mastering\",\"skill\":\"cdtext_parsing\",\"source\":\"gnu_libcdio\",\"authoritative\":true,\"uploadedBy\":\"manual\"}" \
  | jq '.'

# Upload parsing guide
echo ""
echo "📚 Uploading: CDTEXT Parsing Guide..."
curl -X POST "$API_URL" \
  -F "file=@docs/cdtext-parsing-guide.md" \
  -F "organization=$ORG" \
  -F "division=$DIV" \
  -F "app_under_test=$APP" \
  -F "sourceType=knowledge" \
  -F "metadata={\"category\":\"audio_mastering\",\"skill\":\"cdtext_parsing\",\"uploadedBy\":\"manual\"}" \
  | jq '.'

# Upload examples
echo ""
echo "📝 Uploading: CDTEXT Examples..."
curl -X POST "$API_URL" \
  -F "file=@docs/cdtext-examples.md" \
  -F "organization=$ORG" \
  -F "division=$DIV" \
  -F "app_under_test=$APP" \
  -F "sourceType=knowledge" \
  -F "metadata={\"category\":\"audio_mastering\",\"skill\":\"cdtext_parsing\",\"uploadedBy\":\"manual\"}" \
  | jq '.'

echo ""
echo "✅ CDTEXT knowledge uploaded successfully!"
echo ""
echo "🧪 Test it:"
echo "   1. Start dev server: pnpm dev"
echo "   2. Open http://localhost:3000"
echo "   3. Ask: 'Can you parse this CDTEXT?' then paste hex from docs/cdtext-examples.md"
echo ""
echo "📊 View stats:"
echo "   curl 'http://localhost:3000/api/knowledge/upload?organization=$ORG&division=$DIV&app_under_test=$APP' | jq '.stats'"

