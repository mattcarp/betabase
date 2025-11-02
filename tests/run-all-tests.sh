#!/bin/bash
# Run All SIAM Tests
# Includes architecture validation, UI tests, unit tests, and E2E tests

set -e

echo "🧪 Running SIAM Complete Test Suite"
echo "===================================="

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test categories
declare -a test_categories=(
  "Architecture"
  "Unit Tests"
  "UI Tests"
  "E2E Tests"
)

echo ""
echo -e "${BLUE}📋 Test Categories:${NC}"
for category in "${test_categories[@]}"; do
  echo "  ✓ $category"
done
echo ""

# Counter for results
total_tests=0
passed_tests=0
failed_tests=0

# 1. Architecture Tests (CRITICAL - validates no Railway usage)
echo -e "${YELLOW}🏗️  Running Architecture Validation Tests...${NC}"
if pnpm playwright test tests/architecture/no-railway-in-chat.spec.ts; then
  echo -e "${GREEN}✅ Architecture tests passed${NC}"
  ((passed_tests++))
else
  echo -e "${RED}❌ Architecture tests FAILED${NC}"
  echo "   🚨 CRITICAL: Chat may be calling Railway!"
  ((failed_tests++))
fi
((total_tests++))
echo ""

# 2. Unit Tests
echo -e "${YELLOW}🔬 Running Unit Tests...${NC}"
if pnpm vitest run tests/unit/; then
  echo -e "${GREEN}✅ Unit tests passed${NC}"
  ((passed_tests++))
else
  echo -e "${RED}❌ Unit tests FAILED${NC}"
  ((failed_tests++))
fi
((total_tests++))
echo ""

# 3. UI Tests (Critical chat functionality)
echo -e "${YELLOW}🖥️  Running UI Tests...${NC}"
if pnpm playwright test tests/critical/; then
  echo -e "${GREEN}✅ UI tests passed${NC}"
  ((passed_tests++))
else
  echo -e "${RED}❌ UI tests FAILED${NC}"
  ((failed_tests++))
fi
((total_tests++))
echo ""

# 4. Chat Functionality
echo -e "${YELLOW}💬 Running Chat Tests...${NC}"
if pnpm playwright test tests/ai-chat.spec.ts; then
  echo -e "${GREEN}✅ Chat tests passed${NC}"
  ((passed_tests++))
else
  echo -e "${RED}❌ Chat tests FAILED${NC}"
  ((failed_tests++))
fi
((total_tests++))
echo ""

# 5. Voice Features
echo -e "${YELLOW}🎤 Running Voice Feature Tests...${NC}"
if pnpm playwright test tests/voice-features.spec.ts; then
  echo -e "${GREEN}✅ Voice tests passed${NC}"
  ((passed_tests++))
else
  echo -e "${RED}❌ Voice tests FAILED${NC}"
  ((failed_tests++))
fi
((total_tests++))
echo ""

# Summary
echo ""
echo "===================================="
echo -e "${BLUE}📊 Test Results Summary${NC}"
echo "===================================="
echo -e "Total Test Suites: ${total_tests}"
echo -e "${GREEN}Passed: ${passed_tests}${NC}"
if [ $failed_tests -gt 0 ]; then
  echo -e "${RED}Failed: ${failed_tests}${NC}"
else
  echo -e "Failed: 0"
fi
echo ""

if [ $failed_tests -eq 0 ]; then
  echo -e "${GREEN}✅ All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ Some tests failed. Please review the output above.${NC}"
  exit 1
fi

