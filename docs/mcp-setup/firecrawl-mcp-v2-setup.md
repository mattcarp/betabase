## Firecrawl MCP v2 Server Setup

### Prerequisites

- Firecrawl API key from `https://firecrawl.dev`
- Node.js 18+ installed
- MCP client (Claude Desktop, Cursor, etc.)

### Installation Steps

1. Get API Key: Sign up at Firecrawl and copy your API key from the dashboard
2. Configure Environment: Add `FIRECRAWL_API_KEY=fc-your-key-here` to your `.env.local`
3. MCP Configuration: The server is configured in `.mcp.json` under `mcpServers.firecrawl-mcp`
4. Test Connection: Use the provided script `scripts/test-firecrawl-mcp-v2.sh` to validate

### Environment Variables

- `FIRECRAWL_API_KEY` (required): Firecrawl API key (usually starts with `fc-`). Used by the MCP server and any Firecrawl integrations.

### Authentication Setup for Demo

#### AOMA Application Crawling

- Staging environment URL: set `AOMA_STAGING_URL` in your environment if you want scripted tests
- If authentication is required, prepare test credentials; for 2FA, provision an app password or a bypass for non-interactive service accounts

#### Confluence Documentation Crawling

- Confluence base URL: set `CONFLUENCE_BASE_URL`
- Authentication: prefer Atlassian API token with basic auth over user-password + 2FA
- 2FA: if enforced, use API tokens or app passwords; avoid interactive 2FA for automation

### Usage Examples

- Start MCP client (e.g., Cursor). The `firecrawl-mcp` server is launched via `npx -y firecrawl-mcp` as configured in `.mcp.json`.
- From your MCP client, invoke crawl tools (e.g., `crawl_website(url: string)`), then store results into Supabase as needed.

### Troubleshooting

- Connection issues: ensure `FIRECRAWL_API_KEY` is set and not a placeholder; keys typically start with `fc-`
- Node version: ensure `node -v` reports 18+
- Rate limiting: space crawl requests, handle `429` with backoff
- MCP startup: if `npx -y firecrawl-mcp --help` fails, try clearing npm cache or pinning a specific version

### Test Script

Run:

```bash
bash scripts/test-firecrawl-mcp-v2.sh
```

Optional flags:

```bash
bash scripts/test-firecrawl-mcp-v2.sh --run-api-test
```

Adds an API validation crawl to `https://example.com` (may consume credits).
