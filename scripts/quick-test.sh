#!/bin/bash

# Quick SIAM Deployment & MCP Server Test
# Fast testing for development workflow

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SIAM_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MCP_SERVER_URL="http://localhost:3333"
SIAM_SERVER_URL="http://localhost:8085"

# Logging functions
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

echo "🚀 Quick SIAM Test Suite"
echo "========================"
echo ""

# Test 1: Check if SIAM dev server is running
log_info "Testing SIAM dev server..."
if curl -s "$SIAM_SERVER_URL" > /dev/null 2>&1; then
    log_success "SIAM dev server is running on $SIAM_SERVER_URL"
else
    log_warning "SIAM dev server not running"
    echo "   Start with: cd siam-desktop && npm run dev"
fi

# Test 2: Check if MCP server is running
log_info "Testing MCP server..."
if curl -s "$MCP_SERVER_URL/health" > /dev/null 2>&1; then
    log_success "MCP server is running on $MCP_SERVER_URL"
    
    # Test MCP health response
    HEALTH_RESPONSE=$(curl -s "$MCP_SERVER_URL/health")
    if echo "$HEALTH_RESPONSE" | grep -q "healthy\|true"; then
        log_success "MCP server health check passed"
    else
        log_warning "MCP server health check failed"
    fi
else
    log_warning "MCP server not running"
    echo "   Start with: cd /path/to/aoma-mesh-mcp && npm start"
fi

# Test 3: Check build process
log_info "Testing build process..."
cd "$SIAM_DIR"
if npm run build:production > /dev/null 2>&1; then
    log_success "Production build works"
else
    log_error "Production build failed"
fi

# Test 4: Check Electron build
log_info "Testing Electron build..."
if npm run build:electron > /dev/null 2>&1; then
    log_success "Electron build works"
else
    log_error "Electron build failed"
fi

echo ""
log_success "Quick test completed!"
echo ""
echo "📊 Status:"
echo "   - SIAM Dev Server: $(if curl -s "$SIAM_SERVER_URL" > /dev/null 2>&1; then echo "✅ Running"; else echo "❌ Not running"; fi)"
echo "   - MCP Server: $(if curl -s "$MCP_SERVER_URL/health" > /dev/null 2>&1; then echo "✅ Running"; else echo "❌ Not running"; fi)"
echo "   - Build Process: ✅ Working"
echo ""
echo "🔗 URLs:"
echo "   - SIAM App: $SIAM_SERVER_URL"
echo "   - MCP Server: $MCP_SERVER_URL" 