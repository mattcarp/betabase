#!/bin/bash
# Re-upload all AOMA documents with proper chunking
# Based on 2025 RAG research: ~1800 char chunks with 11% overlap

API_URL="http://localhost:3000/api/knowledge/upload"
CORPUS_DIR="/Users/matt/Downloads/AOMA Ttransfers - Code and Data/aoma-corpus"
SUPPORT_DIR="/Users/matt/Downloads/AOMA Ttransfers - Code and Data/aoma-support-docs/aoma-linked-support-docs"
DOCS_DIR="/Users/matt/Documents/projects/Documents AOMA"

SUCCESS=0
FAILED=0
TOTAL_CHUNKS=0

upload_file() {
    local file="$1"
    local filename=$(basename "$file")
    
    echo "📤 Uploading: $filename"
    
    response=$(curl -s --max-time 300 -X POST "$API_URL" \
        -F "file=@$file" \
        -F "sourceType=knowledge" 2>&1)
    
    if echo "$response" | jq -e '.success == true' > /dev/null 2>&1; then
        chunks=$(echo "$response" | jq -r '.chunkCount // 1')
        TOTAL_CHUNKS=$((TOTAL_CHUNKS + chunks))
        SUCCESS=$((SUCCESS + 1))
        echo "   ✅ Success: $chunks chunks"
    else
        FAILED=$((FAILED + 1))
        error=$(echo "$response" | jq -r '.details // .error // "Unknown error"' 2>/dev/null || echo "$response")
        echo "   ❌ Failed: $error"
    fi
}

echo "=========================================="
echo "🔄 RE-UPLOAD WITH OPTIMAL CHUNKING"
echo "=========================================="
echo "Chunk size: 1800 chars (~450 tokens)"
echo "Overlap: 200 chars (~11%)"
echo ""

# Upload from AOMA corpus
echo "📁 Processing: aoma-corpus/"
if [ -d "$CORPUS_DIR" ]; then
    for pdf in "$CORPUS_DIR"/*.pdf; do
        [ -f "$pdf" ] && upload_file "$pdf"
    done
else
    echo "   ⚠️  Directory not found"
fi

echo ""
echo "📁 Processing: aoma-support-docs/"
if [ -d "$SUPPORT_DIR" ]; then
    for pdf in "$SUPPORT_DIR"/*.pdf; do
        [ -f "$pdf" ] && upload_file "$pdf"
    done
else
    echo "   ⚠️  Directory not found"
fi

echo ""
echo "📁 Processing: Documents AOMA/"
if [ -d "$DOCS_DIR" ]; then
    for pdf in "$DOCS_DIR"/*.pdf; do
        [ -f "$pdf" ] && upload_file "$pdf"
    done
else
    echo "   ⚠️  Directory not found"
fi

echo ""
echo "=========================================="
echo "📊 UPLOAD COMPLETE"
echo "=========================================="
echo "✅ Success: $SUCCESS files"
echo "❌ Failed: $FAILED files"
echo "📦 Total chunks: $TOTAL_CHUNKS"
echo "=========================================="


