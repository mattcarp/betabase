#!/bin/bash

# AOMA Validation Test Runner
# Runs all AOMA chat validation tests to prevent hallucinations

set -e

echo "🤖 AOMA Chat Validation Test Suite"
echo "===================================="
echo ""
echo "Purpose: Prevent AI hallucinations in AOMA chat responses"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running against production or local
BASE_URL=${BASE_URL:-"https://thebetabase.com"}
echo "🌍 Testing against: $BASE_URL"
echo ""

# Function to run a test and track results
run_test() {
  local test_name=$1
  local test_file=$2

  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}🧪 Running: $test_name${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  if npx playwright test "$test_file" --reporter=list; then
    echo ""
    echo -e "${GREEN}✅ PASS: $test_name${NC}"
    return 0
  else
    echo ""
    echo -e "${RED}❌ FAIL: $test_name${NC}"
    return 1
  fi
}

# Track test results
FAILED_TESTS=()
PASSED_TESTS=()

# Run knowledge validation tests
if run_test "Knowledge Validation" "tests/production/aoma-knowledge-validation.spec.ts"; then
  PASSED_TESTS+=("Knowledge Validation")
else
  FAILED_TESTS+=("Knowledge Validation")
fi

echo ""
echo ""

# Run anti-hallucination tests
if run_test "Anti-Hallucination" "tests/production/aoma-anti-hallucination.spec.ts"; then
  PASSED_TESTS+=("Anti-Hallucination")
else
  FAILED_TESTS+=("Anti-Hallucination")
fi

echo ""
echo ""

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 TEST SUMMARY${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

TOTAL_TESTS=$((${#PASSED_TESTS[@]} + ${#FAILED_TESTS[@]}))
PASS_RATE=$(( ${#PASSED_TESTS[@]} * 100 / TOTAL_TESTS ))

echo "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: ${#PASSED_TESTS[@]}${NC}"
echo -e "${RED}Failed: ${#FAILED_TESTS[@]}${NC}"
echo -e "Pass Rate: ${PASS_RATE}%"
echo ""

if [ ${#PASSED_TESTS[@]} -gt 0 ]; then
  echo -e "${GREEN}✅ Passed Tests:${NC}"
  for test in "${PASSED_TESTS[@]}"; do
    echo -e "   ${GREEN}✓${NC} $test"
  done
  echo ""
fi

if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
  echo -e "${RED}❌ Failed Tests:${NC}"
  for test in "${FAILED_TESTS[@]}"; do
    echo -e "   ${RED}✗${NC} $test"
  done
  echo ""
  echo -e "${RED}🚨 CRITICAL: Hallucination tests failed!${NC}"
  echo -e "${YELLOW}⚠️  DO NOT deploy until these are fixed${NC}"
  echo ""
  echo "📸 Check screenshots in test-results/ for evidence"
  echo "📞 Contact: matt@mattcarpenter.com if issues persist"
  echo ""
  exit 1
fi

echo -e "${GREEN}🎉 All AOMA validation tests passed!${NC}"
echo -e "${GREEN}✅ Safe to deploy - no hallucinations detected${NC}"
echo ""
echo "Next steps:"
echo "  1. Run full test suite: npm run test:e2e"
echo "  2. Deploy: npm run deploy"
echo ""

exit 0
