#!/bin/bash
# Test MCP Servers with Screenshots

echo "🎯 TESTING MCP SERVERS FOR SCREENSHOTS"
echo "========================================"
echo ""

echo "1️⃣ Testing Playwright MCP Server..."
if ps aux | grep -q "playwright-mcp-server" && ! ps aux | grep "playwright-mcp-server" | grep -q "grep"; then
    echo "✅ Playwright MCP Server - RUNNING"
else
    echo "❌ Playwright MCP Server - NOT RUNNING"
fi

echo ""
echo "2️⃣ Testing shadcn MCP Server..."
if ps aux | grep -q "shadcn-ui-mcp-server" && ! ps aux | grep "shadcn-ui-mcp-server" | grep -q "grep"; then
    echo "✅ shadcn MCP Server - RUNNING"
else
    echo "❌ shadcn MCP Server - NOT RUNNING"
fi

echo ""
echo "3️⃣ Configuration Check:"
if grep -q "mcp__playwright__" /Users/matt/Documents/projects/siam/.claude/settings.json; then
    echo "✅ Playwright MCP permissions - CONFIGURED"
else
    echo "❌ Playwright MCP permissions - MISSING"
fi

if grep -q "mcp__shadcn-ui__" /Users/matt/Documents/projects/siam/.claude/settings.json; then
    echo "✅ shadcn MCP permissions - CONFIGURED"
else
    echo "❌ shadcn MCP permissions - MISSING"
fi

echo ""
echo "4️⃣ Node.js Version:"
echo "Current: $(node --version)"
echo "Required: 18+"

echo ""
echo "5️⃣ Project Setup:"
if [ -d "/Users/matt/Documents/projects/siam/src/components/auth" ]; then
    echo "✅ LoginForm component - FOUND"
else
    echo "❌ LoginForm component - NOT FOUND"
fi

echo ""
echo "🚀 READY FOR SCREENSHOT TESTING"
echo ""
echo "Test command:"
echo "@visual-design-analyzer capture baseline and after screenshots of the LoginForm component, showing actual visual before/after comparison"
echo ""
echo "Expected output:"
echo "• baseline-screenshot.png"
echo "• after-screenshot.png"  
echo "• comparison-screenshot.png"
echo ""
echo "⚠️  IMPORTANT: Restart Claude Code to load MCP servers!"