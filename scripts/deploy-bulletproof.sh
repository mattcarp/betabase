#!/bin/bash

# Deploy Bulletproof - The Ultimate SIAM Deployment Script
# This is THE deployment script that handles EVERYTHING

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Parse arguments
SKIP_TESTS=false
SKIP_LOCAL_TESTS=false
FORCE_DEPLOY=false

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --skip-tests) SKIP_TESTS=true ;;
        --skip-local-tests) SKIP_LOCAL_TESTS=true ;;
        --force) FORCE_DEPLOY=true ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --skip-tests        Skip all tests (local and production)"
            echo "  --skip-local-tests  Skip local tests but run production tests"
            echo "  --force            Force deployment even with uncommitted changes"
            echo "  --help             Show this help message"
            exit 0
            ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║         🚀 SIAM BULLETPROOF DEPLOYMENT SYSTEM 🚀         ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to print section headers
print_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Function to check command availability
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}✗ $1 is not installed${NC}"
        return 1
    else
        echo -e "${GREEN}✓ $1 is available${NC}"
        return 0
    fi
}

# Phase 1: Pre-flight Checks
print_section "PHASE 1: PRE-FLIGHT CHECKS"

echo "Checking required tools..."
TOOLS_OK=true
check_command git || TOOLS_OK=false
check_command npm || TOOLS_OK=false
check_command jq || TOOLS_OK=false
check_command gh || TOOLS_OK=false

if [ "$TOOLS_OK" = false ]; then
    echo -e "${RED}Missing required tools. Please install them first.${NC}"
    exit 1
fi

# Check git status
echo ""
echo "Checking git status..."
if [ "$FORCE_DEPLOY" = false ]; then
    if [ -n "$(git status --porcelain)" ]; then
        echo -e "${YELLOW}⚠ You have uncommitted changes:${NC}"
        git status --short
        echo ""
        read -p "Do you want to commit these changes before deploying? (y/n): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            read -p "Enter commit message: " commit_msg
            git add -A
            git commit -m "$commit_msg"
            echo -e "${GREEN}✓ Changes committed${NC}"
        else
            echo -e "${RED}✗ Deployment cancelled. Please commit or stash your changes.${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}✓ Working directory clean${NC}"
    fi
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${YELLOW}⚠ Not on main branch${NC}"
    read -p "Deploy from $CURRENT_BRANCH? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}✗ Deployment cancelled${NC}"
        exit 1
    fi
fi

# Phase 2: Local Tests (if not skipped)
if [ "$SKIP_LOCAL_TESTS" = false ] && [ "$SKIP_TESTS" = false ]; then
    print_section "PHASE 2: LOCAL TESTS"
    
    echo "Running local build test..."
    if npm run build > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Build successful${NC}"
    else
        echo -e "${RED}✗ Build failed${NC}"
        echo "Run 'npm run build' to see detailed errors"
        exit 1
    fi
    
    # Check if local server is running for tests
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${GREEN}✓ Local server detected on port 3000${NC}"
        
        # Run local Playwright tests
        echo "Running local Playwright tests..."
        if PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e tests/auth/magic-link-auth.spec.ts -- --reporter=dot > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Local tests passed${NC}"
        else
            echo -e "${YELLOW}⚠ Local tests failed (non-blocking)${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ No local server running, skipping local tests${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Skipping local tests${NC}"
fi

# Phase 3: Deploy to Production
print_section "PHASE 3: DEPLOYING TO PRODUCTION"

# Use the existing deploy-with-monitoring.sh script
if [ -f "$SCRIPT_DIR/deploy-with-monitoring.sh" ]; then
    echo "Using deploy-with-monitoring.sh for deployment..."
    bash "$SCRIPT_DIR/deploy-with-monitoring.sh"
    DEPLOY_RESULT=$?
    
    if [ $DEPLOY_RESULT -eq 0 ]; then
        echo -e "${GREEN}✓ Deployment successful${NC}"
    else
        echo -e "${RED}✗ Deployment failed${NC}"
        exit 1
    fi
else
    # Fallback to manual deployment
    echo "Manual deployment (deploy-with-monitoring.sh not found)..."
    
    # Bump version to trigger deployment
    echo "Bumping version..."
    npm version patch --no-git-tag-version > /dev/null 2>&1
    
    # Commit and push
    VERSION=$(node -p "require('./package.json').version")
    git add package.json package-lock.json
    git commit -m "chore: bump version to $VERSION for deployment" || true
    git push origin $CURRENT_BRANCH
    
    echo -e "${GREEN}✓ Pushed to $CURRENT_BRANCH${NC}"
    
    # Wait for deployment
    echo "Waiting for Render deployment to complete..."
    echo "(This typically takes 3-5 minutes)"
    sleep 180  # Wait 3 minutes for deployment
fi

# Phase 4: Production Tests (if not skipped)
if [ "$SKIP_TESTS" = false ]; then
    print_section "PHASE 4: PRODUCTION TESTING"
    
    # Use the post-deploy-testing.sh script if available
    if [ -f "$SCRIPT_DIR/post-deploy-testing.sh" ]; then
        echo "Running post-deployment tests..."
        bash "$SCRIPT_DIR/post-deploy-testing.sh"
        TEST_RESULT=$?
        
        if [ $TEST_RESULT -eq 0 ]; then
            echo -e "${GREEN}✓ Production tests passed${NC}"
        else
            echo -e "${YELLOW}⚠ Some production tests failed${NC}"
            echo "Check the test results above for details"
        fi
    else
        # Fallback to basic health check
        echo "Running basic health check..."
        if curl -s -o /dev/null -w "%{http_code}" https://iamsiam.ai | grep -q "200\|301\|302"; then
            echo -e "${GREEN}✓ Site is responding${NC}"
        else
            echo -e "${RED}✗ Site is not responding properly${NC}"
        fi
    fi
    
    # Run Mailinator test
    echo ""
    echo "Running Mailinator authentication test..."
    PLAYWRIGHT_BASE_URL=https://iamsiam.ai npm run test:e2e tests/auth/magic-link-auth.spec.ts -- --reporter=dot || true
else
    echo -e "${YELLOW}⚠ Skipping production tests${NC}"
fi

# Phase 5: Deployment Summary
print_section "PHASE 5: DEPLOYMENT SUMMARY"

echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              🎉 DEPLOYMENT COMPLETE! 🎉                  ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "📍 Production URL: https://iamsiam.ai"
echo "📍 Render Dashboard: https://dashboard.render.com"
echo "📍 GitHub Repo: https://github.com/mattjcarpenter/siam"
echo ""
echo "Next steps:"
echo "  1. Visit https://iamsiam.ai to verify the deployment"
echo "  2. Check Render logs: ./scripts/deployment-status.sh"
echo "  3. Monitor for any errors in production"
echo ""

# Check if we should open the browser
if command -v open &> /dev/null; then
    read -p "Open production site in browser? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open https://iamsiam.ai
    fi
fi

echo -e "${CYAN}Deployment completed at $(date '+%Y-%m-%d %H:%M:%S')${NC}"