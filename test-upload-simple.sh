#!/bin/bash

echo "🧪 Testing File Upload to AOMA Vector Storage"
echo ""

# Create a test file
cat > test-document.txt << 'EOF'
SIAM File Upload Test Document
================================

This is a test document for the AOMA Knowledge Base upload functionality.

Test Details:
- Date: $(date)
- Purpose: Verify file upload to OpenAI vector storage
- Assistant ID: asst_VvOHL1c4S6YapYKun4mY29fM

Content for testing:
The AOMA system provides advanced orchestration and management capabilities
for digital assets in the Sony Music ecosystem. This test verifies that
documents can be successfully uploaded to the vector storage for use with
the AI assistant.

EOF

echo "✅ Created test file: test-document.txt"
echo ""
echo "📤 Testing upload to deployed server..."

# Test upload to Render deployment
response=$(curl -s -w "\n%{http_code}" -X POST \
  -F "file=@test-document.txt" \
  -F "assistantId=asst_VvOHL1c4S6YapYKun4mY29fM" \
  -F "purpose=assistants" \
  https://iamsiam.ai/api/upload)

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
  echo "✅ Upload successful!"
  echo "Response:"
  echo "$body" | jq '.'
else
  echo "❌ Upload failed with status code: $http_code"
  echo "Response:"
  echo "$body"
fi

# Clean up
rm -f test-document.txt
echo ""
echo "🧹 Cleaned up test file"