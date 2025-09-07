#!/bin/bash

# Rock-Solid Pre-Deployment Validation Script
# This script MUST pass before ANY deployment attempt
# If this fails, DO NOT DEPLOY

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}     🚀 PRE-DEPLOYMENT VALIDATION STARTING 🚀${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Track validation results
ERRORS=0
WARNINGS=0

# Function to check and report
check() {
    local description=$1
    local command=$2
    
    echo -n "Checking $description... "
    
    if eval $command > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        return 0
    else
        echo -e "${RED}✗${NC}"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

# Function for warnings
warn_check() {
    local description=$1
    local command=$2
    
    echo -n "Checking $description... "
    
    if eval $command > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠${NC} (warning)"
        WARNINGS=$((WARNINGS + 1))
        return 1
    fi
}

echo -e "${BLUE}1. DEPENDENCY CHECKS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check package.json exists
check "package.json exists" "test -f package.json"

# Check package-lock.json exists
check "package-lock.json exists" "test -f package-lock.json"

# Check node_modules exists
check "node_modules exists" "test -d node_modules"

# Verify npm packages are installed
echo -n "Verifying all dependencies installed... "
MISSING_DEPS=$(npm ls --depth=0 2>&1 | grep "UNMET DEPENDENCY" | wc -l)
if [ "$MISSING_DEPS" -eq 0 ]; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ ($MISSING_DEPS missing dependencies)${NC}"
    ERRORS=$((ERRORS + 1))
    echo "  Run: npm install --legacy-peer-deps"
fi

echo ""
echo -e "${BLUE}2. BUILD CONFIGURATION${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check Next.js config
check "next.config.js exists" "test -f next.config.js"

# Check TypeScript config
check "tsconfig.json exists" "test -f tsconfig.json"

# Verify @ alias is configured
echo -n "Checking TypeScript @ alias configuration... "
if grep -q '"@/\*"' tsconfig.json 2>/dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo -e "${BLUE}3. IMPORT VALIDATION${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check for problematic @ imports in critical files
echo -n "Checking for @ alias imports... "
ALIAS_IMPORTS=$(find src/components -name "*.tsx" -o -name "*.ts" | xargs grep -l "@/components/ai-elements" 2>/dev/null | wc -l)
if [ "$ALIAS_IMPORTS" -eq 0 ]; then
    echo -e "${GREEN}✓ (using relative imports)${NC}"
else
    echo -e "${YELLOW}⚠ ($ALIAS_IMPORTS files using @ imports)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""
echo -e "${BLUE}4. LOCAL BUILD TEST${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test if build works locally
echo "Running local build test (this may take a minute)..."
if npx next build > /tmp/build-test.log 2>&1; then
    echo -e "${GREEN}✓ Build successful!${NC}"
    
    # Check build output size
    if [ -d ".next" ]; then
        BUILD_SIZE=$(du -sh .next | cut -f1)
        echo -e "  Build size: ${GREEN}$BUILD_SIZE${NC}"
    fi
else
    echo -e "${RED}✗ Build failed!${NC}"
    ERRORS=$((ERRORS + 1))
    
    # Show specific errors
    echo -e "${RED}Build errors:${NC}"
    grep -E "Module not found|Error:|Failed" /tmp/build-test.log | head -10
    echo ""
    echo "Full log saved to: /tmp/build-test.log"
fi

echo ""
echo -e "${BLUE}5. ENVIRONMENT VARIABLES${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check for required env vars
warn_check ".env.production exists" "test -f .env.production"
warn_check ".env.local exists" "test -f .env.local"

echo ""
echo -e "${BLUE}6. GIT STATUS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check git status
echo -n "Checking for uncommitted changes... "
if [ -z "$(git status --porcelain)" ]; then
    echo -e "${GREEN}✓ (clean)${NC}"
else
    echo -e "${YELLOW}⚠ (uncommitted changes)${NC}"
    WARNINGS=$((WARNINGS + 1))
    git status --short | head -5
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo -n "Current branch: "
if [ "$CURRENT_BRANCH" = "main" ]; then
    echo -e "${GREEN}main ✓${NC}"
else
    echo -e "${YELLOW}$CURRENT_BRANCH (not main)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""
echo -e "${BLUE}7. DOCKERFILE & SCRIPTS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check "Dockerfile exists" "test -f Dockerfile"
check "Build script exists" "test -f scripts/build-production.sh"
check "Build script is executable" "test -x scripts/build-production.sh"

echo ""
echo -e "${BLUE}8. CRITICAL DEPENDENCIES CHECK${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check for known problematic packages
CRITICAL_PACKAGES=(
    "react"
    "react-dom"
    "next"
    "typescript"
    "lucide-react"
    "remark-gfm"
    "use-stick-to-bottom"
)

for package in "${CRITICAL_PACKAGES[@]}"; do
    echo -n "Checking $package... "
    if grep -q "\"$package\"" package.json; then
        VERSION=$(grep "\"$package\"" package.json | head -1 | cut -d'"' -f4)
        echo -e "${GREEN}✓ ($VERSION)${NC}"
    else
        echo -e "${RED}✗ (missing)${NC}"
        ERRORS=$((ERRORS + 1))
    fi
done

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                    VALIDATION SUMMARY${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL CHECKS PASSED! Safe to deploy.${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. git push origin main"
    echo "  2. Monitor deployment: npm run deploy:monitor"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNINGS warning(s) found but no critical errors.${NC}"
    echo ""
    echo "You can proceed with deployment, but review warnings first."
    echo ""
    echo "Deploy with: git push origin main"
    exit 0
else
    echo -e "${RED}❌ VALIDATION FAILED!${NC}"
    echo ""
    echo -e "  Errors: ${RED}$ERRORS${NC}"
    echo -e "  Warnings: ${YELLOW}$WARNINGS${NC}"
    echo ""
    echo -e "${RED}DO NOT DEPLOY until all errors are fixed!${NC}"
    echo ""
    echo "Common fixes:"
    echo "  1. npm install --legacy-peer-deps"
    echo "  2. npm run build (test locally)"
    echo "  3. Check import paths (@ vs relative)"
    echo "  4. Ensure package-lock.json is committed"
    exit 1
fi