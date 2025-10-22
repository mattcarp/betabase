# Trae AI MCP Setup Guide

This guide helps you configure MCP (Model Context Protocol) servers for Trae AI based on your existing Claude Code and Cursor configurations.

## 🎉 MCP Configuration Copied!

I've successfully copied your MCP server configurations from your existing setup to `.trae/mcp.json`. Here's what's now available:

### Available MCP Servers

1. **Browserbase** - Web automation and browser control
   - Automated web testing and interaction
   - Screenshot capture capabilities

2. **Playwright MCP** - Advanced web automation
   - Cross-browser testing
   - UI automation and testing

3. **TestSprite** - AI-powered testing platform
   - Automated test generation
   - Test case management

4. **AOMA Mesh** - Your custom AI orchestration system
   - Knowledge base integration
   - Conversation analytics
   - Sony Music workflow automation

5. **Ref Tools** - Reference and documentation tools
   - API documentation
   - Code reference utilities

6. **Task Master AI** - Multi-model AI task management
   - Supports multiple AI providers (OpenAI, Anthropic, Perplexity, etc.)
   - Task automation and workflow management

7. **Motiff** - Design system integration
   - Design token management
   - UI component generation

8. **Semgrep** - Code security and quality analysis
   - Static code analysis
   - Security vulnerability detection

9. **Supabase** - Database and backend services
   - Database operations
   - Authentication management

10. **Render** - Cloud deployment and hosting
    - Deployment automation
    - Infrastructure management

## 🔧 Environment Variables Setup

To use these MCP servers with Trae AI, you'll need to set up environment variables. Based on your project structure, you should create a `.env` file in your project root with the following variables:

```bash
# AI Provider API Keys (for Task Master AI)
ANTHROPIC_API_KEY=your_anthropic_key_here
PERPLEXITY_API_KEY=your_perplexity_key_here
OPENAI_API_KEY=your_openai_key_here
GOOGLE_API_KEY=your_google_key_here
XAI_API_KEY=your_xai_key_here
OPENROUTER_API_KEY=your_openrouter_key_here
MISTRAL_API_KEY=your_mistral_key_here
AZURE_OPENAI_API_KEY=your_azure_key_here
OLLAMA_API_KEY=your_ollama_key_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key

# Render API Key
RENDER_API_KEY=your_render_api_key
```

## 🚀 Getting Started

1. **Copy your existing environment variables** from your other IDE configurations
2. **Create a `.env` file** in your project root with the required API keys
3. **Restart Trae AI** to load the new MCP configuration
4. **Test the servers** by trying to use their capabilities in your conversations

## 📋 Server Status

### ✅ Ready to Use (No additional setup required)

- Browserbase (API key already configured)
- Playwright MCP
- TestSprite (API key already configured)
- AOMA Mesh (using your existing proxy)
- Ref Tools (API key already configured)
- Motiff (API key already configured)
- Semgrep

### ⚙️ Requires Environment Variables

- Task Master AI (needs AI provider API keys)
- Supabase (needs Supabase credentials)
- Render (needs Render API key)

## 🔍 How to Find Your API Keys

Based on your existing configurations, you can find API keys in:

1. **Cursor configuration**: `.cursor/mcp.json` (some keys are already there)
2. **Your project's environment files**: Look for `.env*` files
3. **Your existing Claude Code setup**: Check global MCP configurations

## 🛠️ Troubleshooting

If a server isn't working:

1. **Check environment variables**: Ensure all required keys are set
2. **Verify server installation**: Some servers require npm packages to be installed
3. **Check logs**: Trae AI will show MCP server connection status
4. **Test individually**: Try using one server at a time to isolate issues

## 🎯 Next Steps

1. Set up your environment variables
2. Test the MCP servers with simple commands
3. Explore the capabilities of each server
4. Integrate them into your development workflow

Your MCP setup is now ready! You have access to the same powerful tools you use in Claude Code and Cursor, all configured for Trae AI.
