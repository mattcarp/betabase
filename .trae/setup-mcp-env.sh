#!/bin/bash

# MCP Environment Setup Script
# This script helps you securely set up environment variables for MCP servers
# DO NOT commit this file with actual values!

echo "🔒 MCP Environment Variables Setup"
echo "=================================="
echo ""
echo "Add these to your shell profile (~/.zshrc or ~/.bash_profile):"
echo ""
echo "# MCP API Keys - KEEP THESE SECRET!"
echo ""

# TestSprite
echo "# TestSprite"
echo "export TESTSPRITE_API_KEY='your-testsprite-api-key-here'"
echo ""

# Anthropic & Perplexity
echo "# AI Models"
echo "export ANTHROPIC_API_KEY='your-anthropic-api-key-here'"
echo "export PERPLEXITY_API_KEY='your-perplexity-api-key-here'"
echo "export OPENAI_API_KEY='your-openai-api-key-here'"
echo ""

# TaskMaster Settings
echo "# TaskMaster Configuration"
echo "export TASKMASTER_MODEL='claude-3-5-sonnet-20241022'"
echo "export TASKMASTER_PERPLEXITY_MODEL='sonar-pro'"
echo "export TASKMASTER_MAX_TOKENS='64000'"
echo "export TASKMASTER_TEMPERATURE='0.2'"
echo "export TASKMASTER_DEFAULT_SUBTASKS='5'"
echo "export TASKMASTER_DEFAULT_PRIORITY='medium'"
echo ""

# Supabase
echo "# Supabase Databases"
echo "export SUPABASE_MAIN_CONNECTION_STRING='postgresql://postgres:password@your-supabase-url'"
echo "export SUPABASE_BETABASE_CONNECTION_STRING='postgresql://postgres:password@your-betabase-url'"
echo ""

# Other Services
echo "# Other Services"
echo "export FIRECRAWL_API_KEY='your-firecrawl-api-key-here'"
echo "export BROWSERBASE_API_KEY='your-browserbase-api-key-here'"
echo "export BROWSERBASE_PROJECT_ID='your-browserbase-project-id-here'"
echo "export REF_TOOLS_API_KEY='your-ref-tools-api-key-here'"
echo "export RENDER_API_KEY='your-render-api-key-here'"
echo ""

echo "=================================="
echo "After adding these to your shell profile, run:"
echo "  source ~/.zshrc  (or source ~/.bash_profile)"
echo ""
echo "⚠️  IMPORTANT SECURITY NOTES:"
echo "  1. NEVER commit actual API keys to Git"
echo "  2. Rotate any keys that were previously exposed"
echo "  3. Use environment variables with \${VAR_NAME} syntax in configs"
echo "  4. Keep your shell profile file private (chmod 600 ~/.zshrc)"