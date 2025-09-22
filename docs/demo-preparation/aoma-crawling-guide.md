### AOMA Staging Crawling Guide

This guide documents the complete process for crawling the AOMA staging environment using Firecrawl MCP v2, handling authentication flows, and preparing for colleague demonstrations.

#### Prerequisites
- Environment Variables: `AAD_USERNAME`, `AAD_PASSWORD`, `AOMA_STAGE_URL`, `FIRECRAWL_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- VPN access to Sony Music network
- Valid AAD credentials with MFA
- Firecrawl MCP v2 server configured and reachable

#### Authentication Flow
1. Username/Password via AAD
2. MFA approval (up to 2 minutes)
3. Session persisted to `tmp/aoma-stage-storage.json`
4. Cookies exported for API usage

Run:
```bash
node scripts/aoma-stage-login.js
```

#### Crawling Process
1. Validate environment and network
2. Execute authentication script and confirm `tmp/aoma-stage-storage.json`
3. Crawl key pages via API using `scripts/crawl-aoma-staging.sh`
4. Store UI analysis in Supabase `firecrawl_analysis`

Run:
```bash
bash scripts/crawl-aoma-staging.sh
```

Key Pages:
- `${AOMA_STAGE_URL}/`
- `${AOMA_STAGE_URL}/dashboard`
- `${AOMA_STAGE_URL}/assets`
- `${AOMA_STAGE_URL}/reports`
- `${AOMA_STAGE_URL}/users`
- `${AOMA_STAGE_URL}/search`

#### Knowledge Base Population
- Embeddings generated for semantic search
- AOMA-specific metadata added
- Related elements cross-referenced

#### Validation
Verify results and demo readiness:
```bash
bash scripts/validate-aoma-crawl-results.sh
```

Checks:
- Records present in `firecrawl_analysis`
- Expected pages covered
- Recent entries and timestamps

#### Troubleshooting
- MFA timeout: re-run login script and approve promptly
- Session expiry: re-authenticate
- Rate limits: introduce delays (1.5s default)
- Storage issues: verify Supabase env vars and table

#### Best Practices
- Keep credentials in `.env` and rotate periodically
- Respect server limits with rate limiting and caching
- Prepare demo flows and backup scenarios


