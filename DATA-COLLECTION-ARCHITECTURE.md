# SIAM/BetaBase - Data Collection Architecture

## Purpose: DATA INGESTION LAYER (ETL)

This project handles **all data collection, scraping, and ingestion** for the AOMA ecosystem.

### What This Project DOES

✅ **Web scraping & automation**
- Playwright-based JIRA scraping with JQL queries
- Confluence/Alexandria documentation crawling
- AOMA application UI scraping
- Microsoft SSO authentication handling
- VPN detection and 2FA workflows

✅ **Data processing**
- Embedding generation (OpenAI)
- De-duplication logic
- Data transformation & validation
- Batch processing

✅ **Data ingestion**
- Write to Supabase tables
- Update vector embeddings
- Maintain data freshness

✅ **Scheduled execution**
- Can run on schedule (cron, launchd, GitHub Actions)
- Manual trigger scripts
- Batch jobs and long-running processes

### What This Project DOES NOT DO

❌ **Production data serving**
- NO MCP server (use aoma-mesh-mcp for that)
- NO user-facing APIs
- NO 24/7 uptime requirement

❌ **Real-time queries**
- This is batch ETL, not query serving
- Heavy operations that can take minutes/hours

## Data Flow

```
┌────────────────────────────────────────────────┐
│  External Data Sources                         │
│  • JIRA (jia.smedigitalapp.com)               │
│  • Confluence/Alexandria                       │
│  • AOMA App (thebetabase.com)                 │
│  • Git repositories                            │
└────────────────────────────────────────────────┘
                    │
                    │ Playwright Login
                    │ JQL Queries
                    │ Web Crawling
                    ▼
┌────────────────────────────────────────────────┐
│  siam/betabase (YOU ARE HERE)                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  • scripts/scrape-jira.ts                      │
│  • scripts/scrape-confluence.ts                │
│  • scripts/scrape-aoma.ts                      │
│  • utils/auth/microsoft-login.ts               │
│  • utils/auth/vpn-detection.ts                 │
│  • utils/embeddings/generate.ts                │
│  • utils/dedup/check-duplicates.ts             │
└────────────────────────────────────────────────┘
                    │
                    │ Clean, deduplicated,
                    │ embedded data
                    ▼
┌────────────────────────────────────────────────┐
│  Supabase PostgreSQL                           │
│  (Single Source of Truth)                      │
│  • jira_tickets (6,554 rows)                   │
│  • jira_ticket_embeddings (6,040 rows)         │
│  • git_commits                                 │
│  • code_files                                  │
│  • wiki_documents                              │
└────────────────────────────────────────────────┘
                    │
                    │ Queried by
                    ▼
┌────────────────────────────────────────────────┐
│  aoma-mesh-mcp (MCP Server)                    │
│  Railway Production Deployment                 │
└────────────────────────────────────────────────┘
```

## Key Principles

1. **Batch-oriented**: Long-running jobs are OK
2. **Fault-tolerant**: Can retry, resume, handle failures
3. **Resource-intensive**: Heavy processing is expected
4. **Scheduled**: Runs on schedule or manual trigger
5. **VPN-required**: Must be on corporate VPN with 2FA

## Project Structure (Planned)

```
siam/
├── scripts/
│   ├── scrape-jira.ts           # JIRA ticket collection
│   ├── scrape-confluence.ts     # Confluence docs
│   ├── scrape-aoma.ts           # AOMA app crawling
│   ├── generate-embeddings.ts   # Embedding generation
│   └── update-all-data.sh       # Master orchestration
├── utils/
│   ├── auth/
│   │   ├── microsoft-login.ts   # Shared Microsoft SSO
│   │   ├── vpn-detection.ts     # VPN check logic
│   │   └── jira-auth.ts         # JIRA authentication
│   ├── playwright/
│   │   └── helpers.ts           # Common Playwright utils
│   ├── embeddings/
│   │   └── openai.ts            # OpenAI embedding generation
│   └── supabase/
│       ├── client.ts            # Supabase client
│       └── dedup.ts             # De-duplication logic
├── logs/                        # Execution logs
└── package.json
```

## Scheduling Options

### Option A: Manual Script (Start Here)
```bash
npm run update-all-data
```

### Option B: Cron (Simple)
```bash
# Run weekdays at 9am
0 9 * * 1-5  cd ~/Documents/projects/siam && npm run scrape:jira
```

### Option C: GitHub Actions Self-Hosted Runner (Recommended)
- Runs on your laptop (VPN + 2FA available)
- GitHub UI for logs and manual triggers
- Scheduled runs when laptop is on
- Easy to pause/disable

See `.github/workflows/scrape-data.yml` (to be created)

## Environment Variables Required

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://kfxetwuuzljhybfgmpuc.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# OpenAI (for embeddings)
OPENAI_API_KEY=sk-your-key

# JIRA
JIRA_BASE_URL=https://jia.smedigitalapp.com
JIRA_USERNAME=your-email
JIRA_PASSWORD=your-password

# Microsoft SSO (if needed)
MICROSOFT_EMAIL=your-email
```

## Running Scrapers

### JIRA Tickets
```bash
npm run scrape:jira
# - Logs into JIRA via Playwright
# - Runs JQL queries
# - Fetches tickets
# - Generates embeddings
# - De-duplicates
# - Uploads to Supabase
```

### Confluence Docs
```bash
npm run scrape:confluence
# - Crawls Confluence/Alexandria
# - Extracts documentation
# - Generates embeddings
# - Uploads to Supabase
```

### AOMA App
```bash
npm run scrape:aoma
# - Logs into thebetabase.com
# - Crawls UI elements
# - Extracts metadata
# - Uploads to Supabase
```

## For Production Queries

See: [aoma-mesh-mcp](../aoma-mesh-mcp/ARCHITECTURE.md) - All production queries happen there.

---

**Remember**: This is a **data collector**, not a **query server**. Heavy operations are OK here!

## Next Steps

1. ✅ Move all Playwright scraping scripts here from aoma-mesh-mcp
2. ✅ Create shared auth utilities (microsoft-login.ts, vpn-detection.ts)
3. ⏳ Set up manual trigger script (`update-all-data.sh`)
4. ⏳ Test JIRA scraping with VPN
5. ⏳ Set up GitHub Actions self-hosted runner (optional)
