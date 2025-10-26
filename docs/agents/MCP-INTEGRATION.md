# MCP Integration

MCP servers, tools, and configuration for SIAM.

## Configured MCP Servers

- **context7** - Library documentation
- **github** - GitHub integration
- **render** - Render.com deployment management
- **playwright-mcp** - Browser automation
- **testsprite** - Test automation
- **firecrawl** - Web scraping and analysis
- **supabase** - Database queries
- **browser-tools** - Additional browser capabilities
- **task-master-ai** - Task management
- Others: See `.mcp.json` for complete list

## Render MCP

**Natural language deployment management:**

```bash
"List my Render services"
"Show deployment status for siam-app"
"Check recent logs for my SIAM service"
"Update environment variables for siam-app"
```

## Playwright MCP

**Browser automation:**

```bash
playwright_navigate url="http://localhost:3000"
playwright_console_logs type="error"
playwright_screenshot name="test-result"
playwright_click selector="button"
playwright_fill selector="input[type='email']" value="test@example.com"
```

## Firecrawl MCP

**Web scraping and testing:**

```bash
# Crawl sites, test, record LLM-friendly markdown
```

## Reference

- **Fiona Usage**: See [FIONA-USAGE.md](FIONA-USAGE.md)
- **Agent Workflows**: See [AGENT-WORKFLOWS.md](AGENT-WORKFLOWS.md)

---

_For quick reference, see [QUICK-START.md](../QUICK-START.md)_
