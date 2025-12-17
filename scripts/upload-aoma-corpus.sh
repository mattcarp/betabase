#!/bin/bash
# Upload AOMA Corpus PDFs to Knowledge Base
# This script uploads all PDFs from the aoma-corpus folder

CORPUS_DIR="/Users/matt/Downloads/AOMA Ttransfers - Code and Data/aoma-corpus"
API_URL="http://localhost:3000/api/knowledge/upload"

echo "🚀 AOMA Corpus Upload Script"
echo "=============================="
echo "Source: $CORPUS_DIR"
echo "Target: $API_URL"
echo ""

# Count PDFs
PDF_COUNT=$(find "$CORPUS_DIR" -name "*.pdf" -type f | wc -l | tr -d ' ')
echo "📚 Found $PDF_COUNT PDF files to upload"
echo ""

# Track results
SUCCESS=0
FAILED=0
SKIPPED=0
declare -a FAILED_FILES

# Upload each PDF
for pdf in "$CORPUS_DIR"/*.pdf; do
    if [ -f "$pdf" ]; then
        FILENAME=$(basename "$pdf")
        echo -n "📄 $FILENAME ... "
        
        # Upload via curl with timeout
        RESULT=$(curl -s --max-time 120 -X POST "$API_URL" \
            -F "file=@$pdf" \
            -F "sourceType=knowledge" 2>&1)
        
        # Check result
        if echo "$RESULT" | grep -q '"success":true'; then
            VECTOR_ID=$(echo "$RESULT" | grep -o '"vectorId":"[^"]*"' | cut -d'"' -f4)
            CONTENT_LEN=$(echo "$RESULT" | grep -o '"contentLength":[0-9]*' | cut -d':' -f2)
            echo "✅ ($CONTENT_LEN chars)"
            SUCCESS=$((SUCCESS + 1))
        else
            ERROR=$(echo "$RESULT" | grep -o '"details":"[^"]*"' | cut -d'"' -f4)
            if [ -z "$ERROR" ]; then
                ERROR=$(echo "$RESULT" | head -c 200)
            fi
            echo "❌ $ERROR"
            FAILED=$((FAILED + 1))
            FAILED_FILES+=("$FILENAME: $ERROR")
        fi
        
        # Small delay to avoid overwhelming the server
        sleep 0.5
    fi
done

# Also upload the .docx file if present
for docx in "$CORPUS_DIR"/*.docx; do
    if [ -f "$docx" ]; then
        FILENAME=$(basename "$docx")
        echo -n "📝 $FILENAME ... "
        echo "⏭️ DOCX not yet supported"
        SKIPPED=$((SKIPPED + 1))
    fi
done

echo ""
echo "=============================="
echo "📊 Upload Summary:"
echo "   ✅ Success: $SUCCESS"
echo "   ❌ Failed: $FAILED"
echo "   ⏭️  Skipped: $SKIPPED"
echo "   📚 Total: $PDF_COUNT"
echo ""

if [ ${#FAILED_FILES[@]} -gt 0 ]; then
    echo "❌ Failed files:"
    for fail in "${FAILED_FILES[@]}"; do
        echo "   - $fail"
    done
fi
