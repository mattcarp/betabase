#!/bin/bash
# Master Deduplication Script for External Knowledge Base
# Only processes aoma_crawl/, confluence/, jira/

set -e

echo "🔍 Starting External Knowledge Base Deduplication"
echo "   Scope: aoma_crawl/, confluence/, jira/ ONLY"
echo ""

SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INVENTORY_FILE="$SCRIPTS_DIR/document-inventory.json"
PARSED_FILE="$SCRIPTS_DIR/parsed-documents.json"
REPORT_FILE="$SCRIPTS_DIR/deduplication-report.json"
REORG_FILE="$SCRIPTS_DIR/reorganization-plan.json"
INDEX_FILE="$PWD/knowledge-base/INDEX.md"

DRY_RUN=false
SKIP_EMBEDDINGS=false
EXACT_ONLY=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --skip-embeddings)
      SKIP_EMBEDDINGS=true
      shift
      ;;
    --exact-only)
      EXACT_ONLY=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

if [ "$DRY_RUN" = true ]; then
  echo "🔍 DRY RUN MODE - No changes will be made"
  echo ""
fi

# Step 1: Scan documents
echo "📄 Step 1/6: Scanning documents..."
npx ts-node "$SCRIPTS_DIR/scan-documents.ts" "$INVENTORY_FILE"

# Step 2: Parse & generate embeddings (if not skipped)
if [ "$SKIP_EMBEDDINGS" = true ]; then
  echo ""
  echo "⏭️  Step 2/6: Skipping embeddings generation"
else
  echo ""
  echo "🧠 Step 2/6: Parsing documents & generating embeddings..."
  npx ts-node "$SCRIPTS_DIR/parse-with-docling.ts" \
    "$INVENTORY_FILE" \
    "$PARSED_FILE" \
    --embeddings
fi

# Step 3: Detect duplicates
echo ""
echo "🔍 Step 3/6: Detecting duplicates..."
npx ts-node "$SCRIPTS_DIR/detect-duplicates.ts" \
  "$INVENTORY_FILE" \
  "$PARSED_FILE" \
  "$REPORT_FILE"

# Step 4: Archive duplicates
echo ""
echo "📦 Step 4/6: Archiving duplicates..."
ARCHIVE_FLAGS=""
if [ "$DRY_RUN" = true ]; then
  ARCHIVE_FLAGS="$ARCHIVE_FLAGS --dry-run"
fi
if [ "$EXACT_ONLY" = true ]; then
  ARCHIVE_FLAGS="$ARCHIVE_FLAGS --exact-only"
fi

npx ts-node "$SCRIPTS_DIR/archive-duplicates.ts" "$REPORT_FILE" $ARCHIVE_FLAGS

# Step 5: Generate reorganization plan
echo ""
echo "📁 Step 5/6: Generating reorganization plan..."
npx ts-node "$SCRIPTS_DIR/reorganize-by-topic.ts" "$PARSED_FILE" "$REORG_FILE"

# Step 6: Generate master index
echo ""
echo "📚 Step 6/6: Generating master index..."
mkdir -p "$(dirname "$INDEX_FILE")"
npx ts-node "$SCRIPTS_DIR/generate-index.ts" \
  "$PARSED_FILE" \
  "$REORG_FILE" \
  "$INDEX_FILE"

echo ""
echo "✅ Deduplication complete!"
echo ""
echo "📊 Generated Files:"
echo "   - Inventory: $INVENTORY_FILE"
if [ "$SKIP_EMBEDDINGS" = false ]; then
  echo "   - Parsed Docs: $PARSED_FILE"
fi
echo "   - Report: $REPORT_FILE"
echo "   - Reorg Plan: $REORG_FILE"
echo "   - Master Index: $INDEX_FILE"
echo ""

if [ "$DRY_RUN" = false ]; then
  echo "💡 Next Steps:"
  echo "   1. Review the report: cat $REPORT_FILE | jq"
  echo "   2. Commit changes: git add . && git commit -m 'chore: deduplicate external docs'"
  echo "   3. To rollback: npx ts-node $SCRIPTS_DIR/archive-duplicates.ts --rollback"
else
  echo "💡 To apply changes, run without --dry-run"
fi

echo ""
echo "✨ Done!"

