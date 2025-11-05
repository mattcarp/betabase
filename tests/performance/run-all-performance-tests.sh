#!/bin/bash

# Performance Test Suite Runner
# Runs comprehensive performance tests and generates reports
# Usage: ./tests/performance/run-all-performance-tests.sh

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 SIAM PERFORMANCE TEST SUITE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if dev server is running
echo "🔍 Checking if dev server is running on localhost:3000..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Dev server is running${NC}"
else
    echo -e "${RED}❌ Dev server is not running!${NC}"
    echo ""
    echo "Please start the dev server first:"
    echo "  npm run dev"
    echo ""
    echo "Then run this script again."
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 TEST 1: Web Vitals & Core Performance"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

npx playwright test tests/performance/web-vitals-chat.spec.ts --reporter=list

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⏱️  TEST 2: Chat Response Time Analysis"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

npx playwright test tests/performance/chat-response-time.spec.ts --reporter=list

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📈 TEST 3: Comprehensive Performance Metrics"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

npx playwright test tests/performance/comprehensive-performance.spec.ts --reporter=list

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ALL PERFORMANCE TESTS COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Generate combined report
echo "📊 Generating combined performance report..."

REPORT_DIR="tests/performance/reports"
LATEST_WEB_VITALS=$(ls -t $REPORT_DIR/web-vitals-*.json 2>/dev/null | head -n 1)
LATEST_CHAT_PERF=$(ls -t $REPORT_DIR/chat-performance-*.json 2>/dev/null | head -n 1)

if [ -f "$LATEST_WEB_VITALS" ] && [ -f "$LATEST_CHAT_PERF" ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📋 PERFORMANCE SUMMARY"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # Extract key metrics from reports
    echo "🌐 Web Vitals:"
    echo "   Report: $LATEST_WEB_VITALS"
    
    echo ""
    echo "💬 Chat Performance:"
    echo "   Report: $LATEST_CHAT_PERF"
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo -e "${GREEN}✅ Performance reports saved to: $REPORT_DIR${NC}"
    echo ""
    echo "📊 View detailed reports:"
    echo "   cat $LATEST_WEB_VITALS | jq ."
    echo "   cat $LATEST_CHAT_PERF | jq ."
    echo ""
else
    echo -e "${YELLOW}⚠️  Could not find all report files${NC}"
fi

# Check for performance regressions
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 PERFORMANCE REGRESSION ANALYSIS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -f "$LATEST_CHAT_PERF" ]; then
    AVG_TTFB=$(cat "$LATEST_CHAT_PERF" | jq -r '.summary.avgTTFB // 0')
    
    if [ -n "$AVG_TTFB" ] && [ "$AVG_TTFB" != "null" ]; then
        echo "Average TTFB (AOMA Orchestration): ${AVG_TTFB}ms"
        
        # Check against thresholds
        if [ "$AVG_TTFB" -gt 2000 ]; then
            echo -e "${RED}❌ CRITICAL: AOMA orchestration is very slow (>${AVG_TTFB}ms)${NC}"
            echo "   Target: <1500ms"
            echo "   Recommendations:"
            echo "     1. Check embedding cache is enabled"
            echo "     2. Verify Supabase HNSW index"
            echo "     3. Review server logs for errors"
        elif [ "$AVG_TTFB" -gt 1500 ]; then
            echo -e "${YELLOW}⚠️  WARNING: AOMA orchestration is slow (${AVG_TTFB}ms)${NC}"
            echo "   Target: <1000ms"
            echo "   Recommendations:"
            echo "     1. Enable embedding cache"
            echo "     2. Optimize Supabase index"
        else
            echo -e "${GREEN}✅ AOMA orchestration performance is GOOD (${AVG_TTFB}ms)${NC}"
        fi
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Performance testing complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""






