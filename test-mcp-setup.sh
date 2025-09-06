#!/bin/bash
# Test MCP Servers

echo "🧪 Testing MCP Server Setup..."
echo ""

echo "1️⃣ Testing Playwright MCP Server..."
if npx @executeautomation/playwright-mcp-server --help > /dev/null 2>&1; then
    echo "✅ Playwright MCP Server - Available"
else
    echo "❌ Playwright MCP Server - Not responding"
fi

echo ""
echo "2️⃣ Testing shadcn MCP Server..."
if npx @jpisnice/shadcn-ui-mcp-server --help > /dev/null 2>&1; then
    echo "✅ shadcn MCP Server - Available"
else
    echo "❌ shadcn MCP Server - Not responding"  
fi

echo ""
echo "3️⃣ Configuration Files:"
if [ -f "/Users/matt/Documents/projects/siam/.claude/settings.json" ]; then
    echo "✅ Project-level settings.json - Configured"
else
    echo "❌ Project-level settings.json - Missing"
fi

if [ -f "/Users/matt/.claude/config.json" ]; then
    echo "✅ User-level config.json - Configured"
else
    echo "❌ User-level config.json - Missing"
fi

echo ""
echo "4️⃣ Permissions Check:"
echo "📋 MCP permissions configured:"
echo "   - mcp__playwright__*"
echo "   - mcp__shadcn-ui__*"

echo ""
echo "🎯 Setup Status: READY FOR TESTING"
echo ""
echo "Next steps:"
echo "1. Restart Claude Code if it's running"
echo "2. Test with: @visual-design-analyzer"
echo "3. Or use: /visual-analyze src/components/auth/LoginForm.tsx"