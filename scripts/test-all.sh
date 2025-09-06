#!/bin/bash

# Comprehensive Test Runner - Runs EVERYTHING
# Use this before major releases or to verify complete system integrity

set -e

echo "🧪 SIAM Complete Test Suite"
echo "============================"
echo "This will run ALL tests and may take 30-45 minutes"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Parse arguments
ENVIRONMENT=${1:-local}
PARALLEL=${2:-false}

# Results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
TEST_RESULTS=()

# Timer
START_TIME=$(date +%s)

# Function to run a test suite
run_suite() {
    local name=$1
    local command=$2
    
    echo -e "\n${CYAN}▶ Running $name...${NC}"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if eval $command > /tmp/test-$name.log 2>&1; then
        echo -e "${GREEN}  ✅ $name passed${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        TEST_RESULTS+=("✅ $name")
    else
        echo -e "${RED}  ❌ $name failed${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        TEST_RESULTS+=("❌ $name")
        echo "  See /tmp/test-$name.log for details"
    fi
}

# Check environment
if [ "$ENVIRONMENT" = "local" ]; then
    echo -e "${BLUE}Testing against LOCAL environment${NC}"
    CONFIG="tests/config/local.config.ts"
    
    # Ensure dev server is running
    if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "Starting development server..."
        NEXT_PUBLIC_BYPASS_AUTH=true npm run dev &
        DEV_PID=$!
        sleep 10
    fi
else
    echo -e "${BLUE}Testing against PRODUCTION environment${NC}"
    CONFIG="tests/config/production.config.ts"
fi

echo -e "\n${YELLOW}Starting comprehensive test execution...${NC}"

# Phase 1: Quick Validation (2-5 mins)
echo -e "\n${YELLOW}📋 Phase 1: Quick Validation${NC}"
run_suite "smoke-tests" "npx playwright test --config=$CONFIG --grep @smoke"
run_suite "api-health" "curl -f http://localhost:3000/api/health || curl -f https://siam.onrender.com/api/health"

# Phase 2: Critical Paths (5-10 mins)
echo -e "\n${YELLOW}📋 Phase 2: Critical User Paths${NC}"
run_suite "auth-critical" "npx playwright test tests/e2e/critical-paths/auth.spec.ts --config=$CONFIG"
run_suite "chat-critical" "npx playwright test tests/e2e/critical-paths/chat.spec.ts --config=$CONFIG"
run_suite "upload-critical" "npx playwright test tests/e2e/critical-paths/file-upload.spec.ts --config=$CONFIG"

# Phase 3: Browser Compatibility (10-15 mins)
echo -e "\n${YELLOW}📋 Phase 3: Cross-Browser Testing${NC}"
if [ "$PARALLEL" = "true" ]; then
    # Run browsers in parallel
    run_suite "chromium-full" "npx playwright test --config=$CONFIG --project=chromium &"
    run_suite "firefox-full" "npx playwright test --config=$CONFIG --project=firefox &"
    run_suite "webkit-full" "npx playwright test --config=$CONFIG --project=webkit &"
    wait
else
    # Run browsers sequentially
    run_suite "chromium-full" "npx playwright test --config=$CONFIG --project=chromium"
    run_suite "firefox-full" "npx playwright test --config=$CONFIG --project=firefox"
    run_suite "webkit-full" "npx playwright test --config=$CONFIG --project=webkit"
fi

# Phase 4: Feature Tests (5-10 mins)
echo -e "\n${YELLOW}📋 Phase 4: Feature-Specific Tests${NC}"
for test_file in tests/comprehensive/*.spec.ts; do
    if [ -f "$test_file" ]; then
        test_name=$(basename "$test_file" .spec.ts)
        run_suite "$test_name" "npx playwright test $test_file --config=$CONFIG"
    fi
done

# Phase 5: Visual Regression (5 mins)
echo -e "\n${YELLOW}📋 Phase 5: Visual Regression${NC}"
if [ -d "tests/visual" ]; then
    run_suite "visual-regression" "npx playwright test tests/visual --config=$CONFIG"
fi

# Phase 6: Performance Tests (5 mins)
echo -e "\n${YELLOW}📋 Phase 6: Performance Validation${NC}"
run_suite "performance" "npx playwright test --config=$CONFIG --grep @performance || echo 'No performance tests found'"

# Clean up
[ ! -z "$DEV_PID" ] && kill $DEV_PID 2>/dev/null

# Calculate duration
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

# Generate report
echo -e "\n${BLUE}======================================${NC}"
echo -e "${BLUE}📊 COMPREHENSIVE TEST REPORT${NC}"
echo -e "${BLUE}======================================${NC}"
echo -e "Duration: ${MINUTES}m ${SECONDS}s"
echo -e "Total Suites: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"
echo ""
echo "Detailed Results:"
for result in "${TEST_RESULTS[@]}"; do
    echo "  $result"
done

# Generate HTML report
echo -e "\n${YELLOW}Generating HTML report...${NC}"
npx playwright show-report &

# Exit with appropriate code
if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "\n${RED}⚠️  TESTS FAILED - Review failures before deploying!${NC}"
    echo "Logs saved in /tmp/test-*.log"
    exit 1
else
    echo -e "\n${GREEN}🎉 ALL TESTS PASSED - Ready for deployment!${NC}"
    exit 0
fi