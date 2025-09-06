#!/bin/bash

# SIAM Comprehensive Test Runner
# This script runs all comprehensive tests with proper configuration

echo "🧪 SIAM Comprehensive Test Suite"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running locally or in CI
if [ -z "$CI" ]; then
    echo "📍 Running tests locally..."
    CONFIG="playwright.config.local.ts"
    BASE_URL="http://localhost:3000"
else
    echo "🚀 Running tests in CI..."
    CONFIG="playwright.config.ts"
    BASE_URL="https://siam-app-production.up.railway.app"
fi

# Function to run a test suite
run_test_suite() {
    local suite_name=$1
    local test_file=$2
    
    echo ""
    echo "📋 Running: $suite_name"
    echo "----------------------------"
    
    if npx playwright test "$test_file" --config="$CONFIG" --reporter=list; then
        echo -e "${GREEN}✅ $suite_name passed${NC}"
        return 0
    else
        echo -e "${RED}❌ $suite_name failed${NC}"
        return 1
    fi
}

# Create screenshots directory if it doesn't exist
mkdir -p tests/screenshots

# Install Playwright browsers if needed
echo "🔧 Checking Playwright browsers..."
npx playwright install chromium

# Start local server if running locally
if [ -z "$CI" ]; then
    echo ""
    echo "🚀 Starting local development server..."
    
    # Kill any existing process on port 3000
    npx kill-port 3000 2>/dev/null || true
    
    # Start dev server in background with auth bypass
    NEXT_PUBLIC_BYPASS_AUTH=true npm run dev &
    SERVER_PID=$!
    
    echo "⏳ Waiting for server to be ready..."
    sleep 10
    
    # Wait for server to be ready
    max_attempts=30
    attempt=0
    while ! curl -s http://localhost:3000 > /dev/null; do
        if [ $attempt -ge $max_attempts ]; then
            echo -e "${RED}❌ Server failed to start after 30 seconds${NC}"
            kill $SERVER_PID 2>/dev/null || true
            exit 1
        fi
        
        echo "   Waiting... (attempt $((attempt + 1))/$max_attempts)"
        sleep 1
        attempt=$((attempt + 1))
    done
    
    echo -e "${GREEN}✅ Server is ready!${NC}"
fi

# Track test results
total_tests=0
passed_tests=0
failed_tests=0

# Run all comprehensive test suites
echo ""
echo "🧪 Running Comprehensive Test Suites"
echo "===================================="

# Authentication Tests
if run_test_suite "Authentication Flow" "tests/comprehensive/auth-flow.spec.ts"; then
    ((passed_tests++))
else
    ((failed_tests++))
fi
((total_tests++))

# File Upload & Curation Tests
if run_test_suite "File Upload & Curation" "tests/comprehensive/file-upload-curate.spec.ts"; then
    ((passed_tests++))
else
    ((failed_tests++))
fi
((total_tests++))

# Chat Functionality Tests
if run_test_suite "Chat Functionality" "tests/comprehensive/chat-functionality.spec.ts"; then
    ((passed_tests++))
else
    ((failed_tests++))
fi
((total_tests++))

# Assistant Functionality Tests
if run_test_suite "Assistant Functionality" "tests/comprehensive/assistant-functionality.spec.ts"; then
    ((passed_tests++))
else
    ((failed_tests++))
fi
((total_tests++))

# Vercel AI SDK Tests
if run_test_suite "Vercel AI SDK Implementation" "tests/vercel-ai-sdk-comprehensive.spec.ts"; then
    ((passed_tests++))
else
    ((failed_tests++))
fi
((total_tests++))

# Clean up
if [ -z "$CI" ]; then
    echo ""
    echo "🧹 Cleaning up..."
    kill $SERVER_PID 2>/dev/null || true
fi

# Test Summary
echo ""
echo "📊 Test Summary"
echo "==============="
echo "Total Test Suites: $total_tests"
echo -e "${GREEN}Passed: $passed_tests${NC}"
echo -e "${RED}Failed: $failed_tests${NC}"

# Generate HTML report
echo ""
echo "📄 Generating HTML report..."
npx playwright show-report

# Exit with appropriate code
if [ $failed_tests -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All tests passed successfully!${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}⚠️ Some tests failed. Please review the results above.${NC}"
    exit 1
fi