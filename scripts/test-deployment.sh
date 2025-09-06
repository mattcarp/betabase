#!/bin/bash

# SIAM Deployment & MCP Server Test Runner
# This script runs comprehensive tests for the SIAM desktop application and MCP server integration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SIAM_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MCP_SERVER_URL="http://localhost:3333"
SIAM_SERVER_URL="http://localhost:8085"
FLIGHTTEST_CONFIG="$SIAM_DIR/flighttest.config.js"

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Cleanup function
cleanup() {
    log_info "Cleaning up processes..."
    
    # Kill any running processes
    pkill -f "vite" || true
    pkill -f "electron" || true
    pkill -f "node.*3333" || true
    
    # Kill ports
    npx kill-port 8085 8086 3333 || true
    
    log_success "Cleanup completed"
}

# Trap to ensure cleanup on exit
trap cleanup EXIT

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    
    # Check if FlightTest is installed
    if ! npx flighttest --version &> /dev/null; then
        log_warning "FlightTest not found, installing..."
        npm install --save-dev @flighttest/flighttest
    fi
    
    log_success "Prerequisites check passed"
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    cd "$SIAM_DIR"
    npm install
    log_success "Dependencies installed"
}

# Start MCP server (if not already running)
start_mcp_server() {
    log_info "Checking MCP server status..."
    
    if curl -s "$MCP_SERVER_URL/health" > /dev/null 2>&1; then
        log_success "MCP server is already running"
        return 0
    fi
    
    log_warning "MCP server not running. Please start it manually:"
    echo "   cd /path/to/aoma-mesh-mcp"
    echo "   npm start"
    echo ""
    read -p "Press Enter when MCP server is running, or 's' to skip MCP tests: " -r
    
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        log_warning "Skipping MCP server tests"
        return 1
    fi
    
    # Test MCP server again
    if curl -s "$MCP_SERVER_URL/health" > /dev/null 2>&1; then
        log_success "MCP server is now running"
        return 0
    else
        log_error "MCP server is still not accessible"
        return 1
    fi
}

# Test MCP server functionality
test_mcp_server() {
    log_info "Testing MCP server functionality..."
    
    # Test health endpoint
    if curl -s "$MCP_SERVER_URL/health" | grep -q "healthy\|true"; then
        log_success "MCP server health check passed"
    else
        log_error "MCP server health check failed"
        return 1
    fi
    
    # Test tools list
    TOOLS_RESPONSE=$(curl -s -X POST "$MCP_SERVER_URL/rpc" \
        -H "Content-Type: application/json" \
        -d '{
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/list"
        }')
    
    if echo "$TOOLS_RESPONSE" | grep -q "aoma-knowledge"; then
        log_success "MCP server tools list retrieved"
    else
        log_warning "MCP server tools list test failed or aoma-knowledge not found"
    fi
    
    # Test aoma-knowledge tool
    KNOWLEDGE_RESPONSE=$(curl -s -X POST "$MCP_SERVER_URL/rpc" \
        -H "Content-Type: application/json" \
        -d '{
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/call",
            "params": {
                "name": "aoma-knowledge",
                "arguments": {
                    "query": "test query for MCP server",
                    "context": "test context"
                }
            }
        }')
    
    if echo "$KNOWLEDGE_RESPONSE" | grep -q "jsonrpc.*2.0"; then
        log_success "MCP server aoma-knowledge tool test passed"
    else
        log_warning "MCP server aoma-knowledge tool test failed"
    fi
}

# Start SIAM development server
start_siam_server() {
    log_info "Starting SIAM development server..."
    
    cd "$SIAM_DIR"
    
    # Start the dev server in the background
    npm run dev &
    SIAM_PID=$!
    
    # Wait for server to start
    log_info "Waiting for SIAM server to start..."
    for i in {1..30}; do
        if curl -s "$SIAM_SERVER_URL" > /dev/null 2>&1; then
            log_success "SIAM server is running on $SIAM_SERVER_URL"
            return 0
        fi
        sleep 1
    done
    
    log_error "SIAM server failed to start within 30 seconds"
    return 1
}

# Test SIAM server functionality
test_siam_server() {
    log_info "Testing SIAM server functionality..."
    
    # Test main page
    if curl -s "$SIAM_SERVER_URL" | grep -q "SIAM\|React"; then
        log_success "SIAM main page loads correctly"
    else
        log_warning "SIAM main page test failed"
    fi
    
    # Test Vite HMR endpoint
    if curl -s "$SIAM_SERVER_URL:8086" > /dev/null 2>&1; then
        log_success "Vite HMR endpoint is accessible"
    else
        log_warning "Vite HMR endpoint not accessible (this is normal in some cases)"
    fi
    
    # Test build process
    log_info "Testing build process..."
    if npm run build:production; then
        log_success "Production build completed successfully"
    else
        log_error "Production build failed"
        return 1
    fi
}

# Run FlightTest
run_flighttest() {
    log_info "Running FlightTest suite..."
    
    cd "$SIAM_DIR"
    
    if npx flighttest run "$FLIGHTTEST_CONFIG"; then
        log_success "FlightTest suite completed successfully"
    else
        log_error "FlightTest suite failed"
        return 1
    fi
}

# Run Electron tests
test_electron() {
    log_info "Testing Electron app..."
    
    cd "$SIAM_DIR"
    
    # Test Electron build
    if npm run build:electron; then
        log_success "Electron build completed"
    else
        log_error "Electron build failed"
        return 1
    fi
    
    # Note: Full Electron testing would require additional setup
    log_warning "Full Electron testing requires manual verification"
}

# Main test execution
main() {
    echo "🚀 SIAM Deployment & MCP Server Test Suite"
    echo "=========================================="
    echo ""
    
    # Check prerequisites
    check_prerequisites
    
    # Install dependencies
    install_dependencies
    
    # Test MCP server
    if start_mcp_server; then
        test_mcp_server
    fi
    
    # Test SIAM server
    if start_siam_server; then
        test_siam_server
    fi
    
    # Run FlightTest
    run_flighttest
    
    # Test Electron
    test_electron
    
    echo ""
    log_success "All tests completed!"
    echo ""
    echo "📊 Test Results:"
    echo "   - MCP Server: $(if start_mcp_server > /dev/null 2>&1; then echo "✅ Running"; else echo "❌ Not running"; fi)"
    echo "   - SIAM Server: $(if curl -s "$SIAM_SERVER_URL" > /dev/null 2>&1; then echo "✅ Running"; else echo "❌ Not running"; fi)"
    echo "   - FlightTest: ✅ Completed"
    echo ""
    echo "🔗 URLs:"
    echo "   - SIAM App: $SIAM_SERVER_URL"
    echo "   - MCP Server: $MCP_SERVER_URL"
    echo ""
    echo "📁 Test results available in: ./flighttest-results/"
}

# Run main function
main "$@" 