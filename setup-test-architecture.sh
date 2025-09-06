#!/bin/bash

# SIAM Testing Architecture Setup Script
# Integrates testing structure with all development environments

echo "🎯 SIAM Testing Architecture Setup"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check current directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from the SIAM project root"
    exit 1
fi

echo -e "${BLUE}📁 Creating test directory structure...${NC}"

# Create main test directories
mkdir -p tests/01-unit/{components,hooks,utils,services}
mkdir -p tests/02-integration/{api,auth,data,features}
mkdir -p tests/03-e2e/{smoke,regression,scenarios,production}
mkdir -p tests/04-visual/{screenshots,diffs,specs}
mkdir -p tests/__pages__
mkdir -p tests/__fixtures__
mkdir -p tests/__utils__

echo -e "${GREEN}✅ Directory structure created${NC}"

# Create directory markers for Git
touch tests/01-unit/.gitkeep
touch tests/02-integration/.gitkeep
touch tests/03-e2e/regression/.gitkeep
touch tests/03-e2e/scenarios/.gitkeep
touch tests/03-e2e/production/.gitkeep
touch tests/04-visual/screenshots/.gitkeep
touch tests/04-visual/diffs/.gitkeep
touch tests/04-visual/specs/.gitkeep

echo -e "${BLUE}📝 Checking IDE configuration files...${NC}"

# Check for IDE-specific files
files_found=0

if [ -f "tests/__TESTING_RULES__.md" ]; then
    echo -e "${GREEN}  ✓ Universal testing rules found${NC}"
    ((files_found++))
else
    echo -e "${YELLOW}  ⚠ Missing: tests/__TESTING_RULES__.md${NC}"
fi

if [ -f "tests/__CLAUDE_CODE__.md" ]; then
    echo -e "${GREEN}  ✓ Claude Code integration found${NC}"
    ((files_found++))
else
    echo -e "${YELLOW}  ⚠ Missing: tests/__CLAUDE_CODE__.md${NC}"
fi

if [ -f "tests/__CURSOR__.md" ]; then
    echo -e "${GREEN}  ✓ Cursor integration found${NC}"
    ((files_found++))
else
    echo -e "${YELLOW}  ⚠ Missing: tests/__CURSOR__.md${NC}"
fi

if [ -f "tests/__WINDSURF__.md" ]; then
    echo -e "${GREEN}  ✓ Windsurf integration found${NC}"
    ((files_found++))
else
    echo -e "${YELLOW}  ⚠ Missing: tests/__WINDSURF__.md${NC}"
fi

echo ""
echo -e "${BLUE}🔧 Setting up test scripts in package.json...${NC}"

# Check if required scripts exist
if grep -q "test:smoke" package.json; then
    echo -e "${GREEN}  ✓ Test scripts already configured${NC}"
else
    echo -e "${YELLOW}  ⚠ Test scripts need to be added to package.json${NC}"
    echo ""
    echo "  Add these scripts to your package.json:"
    echo '    "test:unit": "jest --testMatch='"'"'**/01-unit/**/*.test.ts'"'"'",'
    echo '    "test:integration": "playwright test --project=integration",'
    echo '    "test:e2e": "playwright test --project=e2e",'
    echo '    "test:smoke": "playwright test --grep @smoke",'
    echo '    "test:regression": "playwright test --grep @regression",'
    echo '    "test:changed": "jest -o",'
    echo '    "test:failed": "playwright test --last-failed"'
fi

echo ""
echo -e "${BLUE}🏭 Checking Page Objects...${NC}"

if [ -f "tests/__pages__/BasePage.ts" ]; then
    echo -e "${GREEN}  ✓ BasePage found${NC}"
else
    echo -e "${YELLOW}  ⚠ Missing: BasePage.ts${NC}"
fi

if [ -f "tests/__pages__/ChatPage.ts" ]; then
    echo -e "${GREEN}  ✓ ChatPage found${NC}"
else
    echo -e "${YELLOW}  ⚠ Missing: ChatPage.ts${NC}"
fi

if [ -f "tests/__pages__/CuratePage.ts" ]; then
    echo -e "${GREEN}  ✓ CuratePage found${NC}"
else
    echo -e "${YELLOW}  ⚠ Missing: CuratePage.ts${NC}"
fi

echo ""
echo -e "${BLUE}🔄 Migration suggestions...${NC}"

# Count existing test files
old_test_count=$(find tests -name "*.spec.ts" -o -name "*.test.ts" 2>/dev/null | grep -v -E "(01-unit|02-integration|03-e2e|04-visual)" | wc -l)

if [ "$old_test_count" -gt 0 ]; then
    echo -e "${YELLOW}Found $old_test_count test files that need migration:${NC}"
    echo ""
    echo "  Suggested migrations:"
    echo "  • tests/auth/* → tests/02-integration/auth/"
    echo "  • tests/comprehensive/* → tests/03-e2e/regression/"
    echo "  • tests/e2e/* → tests/03-e2e/scenarios/"
    echo "  • tests/visual/* → tests/04-visual/specs/"
    echo ""
    echo "  Run these commands to migrate:"
    echo "    mv tests/auth/* tests/02-integration/auth/ 2>/dev/null"
    echo "    mv tests/comprehensive/* tests/03-e2e/regression/ 2>/dev/null"
else
    echo -e "${GREEN}  ✓ No migration needed${NC}"
fi

echo ""
echo -e "${BLUE}📊 Setup Summary${NC}"
echo "=================="

if [ "$files_found" -eq 4 ]; then
    echo -e "${GREEN}✅ All IDE integration files are present${NC}"
else
    echo -e "${YELLOW}⚠ Some IDE integration files are missing${NC}"
fi

echo ""
echo "Next steps:"
echo "1. Update package.json with new test scripts"
echo "2. Migrate existing tests to new structure"
echo "3. Update playwright.config.ts to use projects"
echo "4. Run 'npm run test:smoke' to verify setup"
echo ""
echo -e "${GREEN}Happy testing! 🚀${NC}"
