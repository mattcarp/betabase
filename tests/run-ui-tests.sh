#!/bin/bash
# Run All SIAM UI Tests
# Includes architecture validation and visual/interaction tests

set -e

echo "🖥️  Running SIAM UI Test Suite"
echo "=============================="

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

total_tests=0
passed_tests=0
failed_tests=0

# 1. Architecture Tests (CRITICAL for UI tests - validates performance)
echo -e "${YELLOW}🏗️  Architecture Validation...${NC}"
if pnpm playwright test tests/architecture/no-railway-in-chat.spec.ts --reporter=list; then
  echo -e "${GREEN}✅ Architecture validated${NC}"
  ((passed_tests++))
else
  echo -e "${RED}❌ Architecture validation FAILED${NC}"
  ((failed_tests++))
fi
((total_tests++))
echo ""

# 2. Critical UI Elements
echo -e "${YELLOW}🎯 Critical UI Tests...${NC}"
if pnpm playwright test tests/critical/ --reporter=list; then
  echo -e "${GREEN}✅ Critical UI passed${NC}"
  ((passed_tests++))
else
  echo -e "${RED}❌ Critical UI FAILED${NC}"
  ((failed_tests++))
fi
((total_tests++))
echo ""

# 3. Chat Interface
echo -e "${YELLOW}💬 Chat Interface Tests...${NC}"
if pnpm playwright test tests/ai-chat.spec.ts --reporter=list; then
  echo -e "${GREEN}✅ Chat interface passed${NC}"
  ((passed_tests++))
else
  echo -e "${RED}❌ Chat interface FAILED${NC}"
  ((failed_tests++))
fi
((total_tests++))
echo ""

# 4. Voice Features UI
echo -e "${YELLOW}🎤 Voice UI Tests...${NC}"
if pnpm playwright test tests/voice-features.spec.ts --reporter=list; then
  echo -e "${GREEN}✅ Voice UI passed${NC}"
  ((passed_tests++))
else
  echo -e "${RED}❌ Voice UI FAILED${NC}"
  ((failed_tests++))
fi
((total_tests++))
echo ""

# 5. Visual Regression (if exists)
if [ -d "tests/visual" ]; then
  echo -e "${YELLOW}📸 Visual Regression Tests...${NC}"
  if pnpm playwright test tests/visual/ --reporter=list; then
    echo -e "${GREEN}✅ Visual tests passed${NC}"
    ((passed_tests++))
  else
    echo -e "${RED}❌ Visual tests FAILED${NC}"
    ((failed_tests++))
  fi
  ((total_tests++))
  echo ""
fi

# Summary
echo ""
echo "=============================="
echo -e "${BLUE}📊 UI Test Results${NC}"
echo "=============================="
echo -e "Total: ${total_tests}"
echo -e "${GREEN}Passed: ${passed_tests}${NC}"
if [ $failed_tests -gt 0 ]; then
  echo -e "${RED}Failed: ${failed_tests}${NC}"
  exit 1
else
  echo -e "Failed: 0"
  echo ""
  echo -e "${GREEN}✅ All UI tests passed!${NC}"
  exit 0
fi

