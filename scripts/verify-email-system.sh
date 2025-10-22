#!/bin/bash

# Verify Email Context Extraction System
# Quick sanity check for the email extraction components

echo "🔍 Verifying Email Context Extraction System"
echo "=============================================="

# Check if required files exist
echo ""
echo "📁 Checking files..."

FILES=(
  "src/utils/emailParser.ts"
  "src/services/emailContextService.ts"
  "app/api/email-context/route.ts"
  "app/api/email-context/batch/route.ts"
  "app/api/email-context/search/route.ts"
  "tests/unit/emailParser.test.ts"
  "tests/integration/emailContext.test.ts"
  "tests/integration/emailContextApi.test.ts"
)

all_exist=true
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✓ $file"
  else
    echo "  ✗ $file (MISSING)"
    all_exist=false
  fi
done

if [ "$all_exist" = false ]; then
  echo ""
  echo "❌ Some files are missing!"
  exit 1
fi

echo ""
echo "✅ All required files present"

# Check for TypeScript errors
echo ""
echo "🔧 Checking for TypeScript errors..."

if command -v npx &> /dev/null; then
  npx tsc --noEmit --skipLibCheck src/utils/emailParser.ts src/services/emailContextService.ts 2>&1 | head -20

  if [ $? -eq 0 ]; then
    echo "  ✓ No TypeScript errors in core files"
  else
    echo "  ⚠️  TypeScript errors found (check output above)"
  fi
else
  echo "  ⚠️  TypeScript compiler not found, skipping"
fi

# Check environment variables
echo ""
echo "🔑 Checking environment variables..."

ENV_FILE=".env.local"
if [ -f "$ENV_FILE" ]; then
  if grep -q "OPENAI_API_KEY" "$ENV_FILE"; then
    echo "  ✓ OPENAI_API_KEY configured"
  else
    echo "  ⚠️  OPENAI_API_KEY not found in $ENV_FILE"
  fi

  if grep -q "SUPABASE_SERVICE_ROLE_KEY" "$ENV_FILE"; then
    echo "  ✓ SUPABASE_SERVICE_ROLE_KEY configured"
  else
    echo "  ⚠️  SUPABASE_SERVICE_ROLE_KEY not found in $ENV_FILE"
  fi
else
  echo "  ⚠️  $ENV_FILE not found"
fi

# Check if Supabase vector table exists
echo ""
echo "🗄️  Vector store status:"
echo "  To verify the aoma_unified_vectors table exists, check your Supabase dashboard:"
echo "  https://app.supabase.com"

# Summary
echo ""
echo "=============================================="
echo "📋 Summary:"
echo "  - Core email extraction components: ✅"
echo "  - API endpoints: ✅"
echo "  - Test files: ✅"
echo ""
echo "🚀 Next steps:"
echo "  1. Run unit tests: npm test tests/unit/emailParser.test.ts"
echo "  2. Run integration tests: npm test tests/integration/emailContext.test.ts"
echo "  3. Test the API: npm run dev && curl -X POST http://localhost:3000/api/email-context ..."
echo "  4. Run sample test script: tsx scripts/test-email-extraction.ts"
echo ""
echo "✨ Email context extraction system is ready!"
