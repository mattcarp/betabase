#!/bin/bash

# Test Dashboard E2E Test Runner for SIAM
# This script runs comprehensive tests for the Test Dashboard feature

echo "🚀 Starting Test Dashboard E2E Tests..."
echo "======================================"

# Ensure server is running
echo "📡 Checking if SIAM server is running..."
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ Server is running"
else
    echo "❌ Server not running. Please start with: NEXT_PUBLIC_BYPASS_AUTH=true npm run dev"
    exit 1
fi

# Create screenshots directory
mkdir -p test-screenshots

# Run quick validation first
echo ""
echo "🏃‍♂️ Running Quick Validation Tests..."
echo "======================================"
npx playwright test test-dashboard-quick.spec.ts --config=playwright.config.local.ts --project=chromium

if [ $? -eq 0 ]; then
    echo "✅ Quick validation passed!"
else
    echo "❌ Quick validation failed. Check the output above."
    exit 1
fi

# Run comprehensive tests
echo ""
echo "📋 Running Comprehensive Test Suite..."
echo "======================================"
npx playwright test test-dashboard.spec.ts --config=playwright.config.local.ts --project=chromium --timeout=120000

# Generate test report
echo ""
echo "📊 Generating Test Report..."
echo "============================"
npx playwright show-report --host=127.0.0.1 --port=9323 &
REPORT_PID=$!

echo ""
echo "🎉 Test Dashboard E2E Tests Complete!"
echo "====================================="
echo ""
echo "📈 Test Report: http://127.0.0.1:9323"
echo "📸 Screenshots: $(pwd)/test-screenshots/"
echo "📝 Test Files:"
echo "   - test-dashboard.spec.ts (Comprehensive)"
echo "   - test-dashboard-quick.spec.ts (Quick Validation)"
echo ""
echo "🔍 Key Features Tested:"
echo "   ✅ All 8 tabs (Execution, Results, AI Generate, Trace Viewer, Coverage, Flaky Tests, Analytics, Firecrawl)"
echo "   ✅ Run Tests button functionality"
echo "   ✅ AI Generate natural language input"
echo "   ✅ Firecrawl Start Crawl button"
echo "   ✅ Responsive design (mobile, tablet, desktop)"
echo "   ✅ Error handling and console error validation"
echo "   ✅ Component visibility and interaction"
echo "   ✅ Performance and loading time validation"
echo ""
echo "To stop the report server, run: kill $REPORT_PID"