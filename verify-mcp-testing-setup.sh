#!/bin/bash
# Test script to verify all three testing MCP servers are properly configured
# Created: August 12, 2025

echo "🔍 Testing Unified MCP Configuration for SIAM Project"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_mcp_server() {
    local server_name=$1
    local package_name=$2
    
    echo -n "Testing $server_name... "
    
    if npx -y $package_name --version >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Available${NC}"
        return 0
    else
        echo -e "${RED}❌ Not found${NC}"
        return 1
    fi
}

echo "📋 Checking MCP Server Availability:"
echo "------------------------------------"

# Test each MCP server
test_mcp_server "BrowserBase MCP" "@browserbasehq/mcp"
browserbase_status=$?

test_mcp_server "Playwright MCP" "@executeautomation/playwright-mcp-server"
playwright_status=$?

test_mcp_server "TestSprite MCP" "@testsprite/testsprite-mcp@latest"
testsprite_status=$?

echo ""
echo "📊 Configuration File Status:"
echo "-----------------------------"

# Check global config
if [ -f "/Users/matt/Library/Application Support/Claude/claude_desktop_config.json" ]; then
    echo -e "Global config: ${GREEN}✅ Found${NC}"
    
    # Check if TestSprite was added
    if grep -q "testsprite" "/Users/matt/Library/Application Support/Claude/claude_desktop_config.json"; then
        echo -e "  └─ TestSprite: ${GREEN}✅ Configured${NC}"
    else
        echo -e "  └─ TestSprite: ${RED}❌ Missing${NC}"
    fi
else
    echo -e "Global config: ${RED}❌ Not found${NC}"
fi

# Check project config
if [ -f "/Users/matt/Documents/projects/siam/.mcp.json" ]; then
    echo -e "Project config: ${GREEN}✅ Found${NC}"
    
    # Check for all three servers
    for server in "browserbase" "playwright-mcp" "testsprite"; do
        if grep -q "$server" "/Users/matt/Documents/projects/siam/.mcp.json"; then
            echo -e "  └─ $server: ${GREEN}✅ Configured${NC}"
        else
            echo -e "  └─ $server: ${RED}❌ Missing${NC}"
        fi
    done
else
    echo -e "Project config: ${RED}❌ Not found${NC}"
fi

echo ""
echo "🎯 Agent Configuration:"
echo "----------------------"

# Check for Agent Fiona
if [ -f "/Users/matt/Documents/projects/siam/.claude/agents/fiona.md" ]; then
    echo -e "Agent Fiona: ${GREEN}✅ Found${NC}"
else
    echo -e "Agent Fiona: ${RED}❌ Not found${NC}"
fi

# Check for Test Automation Specialist
if [ -f "/Users/matt/Documents/projects/siam/.claude/agents/test-automation-specialist.md" ]; then
    echo -e "Test Automation Specialist: ${GREEN}✅ Found${NC}"
else
    echo -e "Test Automation Specialist: ${RED}❌ Not found${NC}"
fi

echo ""
echo "=================================================="

# Final status
if [ $browserbase_status -eq 0 ] && [ $playwright_status -eq 0 ] && [ $testsprite_status -eq 0 ]; then
    echo -e "${GREEN}✅ ALL TESTING MCP SERVERS ARE READY!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Restart Claude Desktop to load the new configuration"
    echo "2. In Claude Code, run: claude-code test --agent fiona"
    echo "3. Watch the parallel testing magic happen! 🚀"
else
    echo -e "${YELLOW}⚠️  Some MCP servers need attention${NC}"
    echo ""
    echo "Please install missing servers with:"
    [ $browserbase_status -ne 0 ] && echo "  npm install -g @browserbasehq/mcp"
    [ $playwright_status -ne 0 ] && echo "  npm install -g @executeautomation/playwright-mcp-server"
    [ $testsprite_status -ne 0 ] && echo "  npm install -g @testsprite/testsprite-mcp"
fi

echo ""
echo "For detailed documentation, see: UNIFIED_TESTING_MCP_CONFIG.md"
