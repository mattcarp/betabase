#!/bin/bash

# Quick AOMA Quality Enhancement
# Run after authentication is complete

set -e

echo "🚀 AOMA Quality Enhancement Pipeline"
echo "════════════════════════════════════════════════════════════════════"
echo ""

# Step 1: Verify authentication
echo "1️⃣ Verifying AOMA authentication..."
if [ ! -f "tmp/aoma-stage-storage.json" ]; then
  echo "❌ No auth file found. Please run: node scripts/aoma-interactive-login.js"
  exit 1
fi

SESSION_AGE=$(( ($(date +%s) - $(stat -f %m tmp/aoma-stage-storage.json)) / 60 ))
echo "   ✅ Session file found (${SESSION_AGE} minutes old)"

if [ $SESSION_AGE -gt 60 ]; then
  echo "   ⚠️  Session is older than 1 hour, might be expired"
  echo "   💡 If crawl fails, re-run: node scripts/aoma-interactive-login.js"
fi

# Step 2: Run enhanced re-crawl
echo ""
echo "2️⃣ Starting enhanced re-crawl with LLM summaries..."
echo "   📋 Pages: 42 critical AOMA pages"
echo "   💰 Cost: ~\$0.004"
echo "   ⏱️  Time: ~3-5 minutes"
echo ""

node scripts/recrawl-aoma-enhanced.js

# Step 3: Test quality improvement
echo ""
echo "3️⃣ Testing quality improvement..."
echo ""

node scripts/get-actual-aoma-response.js

echo ""
echo "════════════════════════════════════════════════════════════════════"
echo "✨ Quality enhancement complete!"
echo ""
echo "📊 Next steps:"
echo "   1. Review responses above"
echo "   2. Test via UI: http://localhost:3000"
echo "   3. Compare to baseline (see docs/FINAL-AOMA-ANALYSIS-SUMMARY.md)"
echo ""

