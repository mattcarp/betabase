#!/bin/bash
# SIAM - Render MCP Server Setup Script

echo "🚀 Setting up Render MCP Server Integration"
echo "=========================================="

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found! Creating from .env.example..."
    cp .env.example .env.local
fi

# Check if RENDER_API_KEY is set
if grep -q "RENDER_API_KEY=" .env.local; then
    echo "✅ RENDER_API_KEY found in .env.local"
    
    # Check if it's still the placeholder
    if grep -q "RENDER_API_KEY=your_render_api_key_here" .env.local; then
        echo "⚠️  RENDER_API_KEY is still set to placeholder"
        echo ""
        echo "📋 Setup Steps:"
        echo "1. Go to: https://dashboard.render.com/settings#api-keys"
        echo "2. Create a new API key (name: 'Claude Code MCP')"
        echo "3. Copy the API key"
        echo "4. Replace 'your_render_api_key_here' in .env.local with your actual API key"
        echo "5. Restart Claude Code"
        echo ""
        echo "💡 Once set up, you can use commands like:"
        echo "   - 'List my Render services'"
        echo "   - 'Check deployment status for siam-app'"
        echo "   - 'Show recent error logs'"
        echo "   - 'Query database for user statistics'"
    else
        echo "✅ RENDER_API_KEY appears to be configured"
        echo "🎉 You should be able to use Render MCP commands!"
        echo ""
        echo "💡 Try these commands:"
        echo "   - 'List my Render services'"
        echo "   - 'Show deployment status for siam-app'"
        echo "   - 'Check recent logs for errors'"
    fi
else
    echo "➕ Adding RENDER_API_KEY to .env.local..."
    echo "" >> .env.local
    echo "# Render MCP Server Configuration" >> .env.local
    echo "RENDER_API_KEY=your_render_api_key_here" >> .env.local
    echo "✅ Added RENDER_API_KEY placeholder to .env.local"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Go to: https://dashboard.render.com/settings#api-keys"
    echo "2. Create a new API key (name: 'Claude Code MCP')"
    echo "3. Replace 'your_render_api_key_here' in .env.local with your actual API key"
    echo "4. Restart Claude Code"
fi

echo ""
echo "📖 For more information, see the 'Render MCP Server Integration' section in CLAUDE.md"
echo "🔗 Documentation: https://render.com/docs/mcp-server"