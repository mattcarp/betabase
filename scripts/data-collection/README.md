# SIAM Data Collection System

Complete guide to the SIAM/BetaBase data collection infrastructure for JIRA, Confluence, and AOMA scraping.

## Overview

This system handles all data ingestion for the AOMA ecosystem:
- **JIRA tickets** via Playwright + JQL queries
- **Confluence/Alexandria docs** (planned)
- **AOMA app UI** (planned)

All data flows into Supabase with vector embeddings for semantic search.

---

## Architecture

```
┌─────────────────────────────────────────────┐
│  External Sources                           │
│  • JIRA (jia.smedigitalapp.com)            │
│  • Confluence/Alexandria                    │
│  • AOMA (thebetabase.com)                  │
└─────────────────────────────────────────────┘
              ↓
      Playwright Login
      Microsoft SSO + 2FA
              ↓
┌─────────────────────────────────────────────┐
│  Data Collection Scripts                    │
│  • scrape-jira.js                          │
│  • scrape-confluence.js (planned)          │
│  • scrape-aoma.js (planned)                │
└─────────────────────────────────────────────┘
              ↓
      Extract & Transform
              ↓
┌─────────────────────────────────────────────┐
│  Utilities                                  │
│  • microsoft-sso.js (auth)                 │
│  • openai.js (embeddings)                  │
│  • deduplication.js (de-dupe)              │
└─────────────────────────────────────────────┘
              ↓
      Load to Supabase
              ↓
┌─────────────────────────────────────────────┐
│  Supabase PostgreSQL                        │
│  • jira_tickets                            │
│  • jira_ticket_embeddings                  │
│  • Other tables...                         │
└─────────────────────────────────────────────┘
```

---

## Prerequisites

### 1. VPN Connection
**MUST** be connected to corporate VPN before running any scrapers.

### 2. Environment Variables
Create a `.env.local` file in project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI (for embeddings)
OPENAI_API_KEY=sk-your-api-key

# Microsoft SSO
AAD_USERNAME=your.email@company.com
AAD_PASSWORD=your-password

# JIRA (optional, has defaults)
JIRA_BASE_URL=https://jia.smedigitalapp.com
```

### 3. Dependencies
```bash
npm install playwright @supabase/supabase-js openai
npx playwright install chromium
```

### 4. 2FA Device
Keep your phone handy for Microsoft MFA approval!

---

## Quick Start

### Run JIRA Scraper (Interactive)
```bash
npm run scrape:jira
```

This will:
1. Open browser (non-headless)
2. Navigate to JIRA
3. Handle Microsoft SSO login
4. Wait for your MFA approval
5. Run JQL queries
6. Scrape tickets
7. Generate embeddings
8. Save to Supabase

### Run JIRA Scraper (Headless)
```bash
npm run scrape:jira:headless
```

### Run All Scrapers
```bash
npm run update:all-data
```

---

## File Structure

```
siam/
├── scripts/
│   └── data-collection/
│       ├── scrape-jira.js           # JIRA ticket scraper
│       ├── update-all-data.sh       # Master orchestration script
│       └── README.md                # This file
├── utils/
│   ├── auth/
│   │   └── microsoft-sso.js         # Microsoft SSO authentication
│   ├── embeddings/
│   │   └── openai.js                # OpenAI embedding generation
│   └── supabase/
│       ├── client.js                # Supabase client
│       └── deduplication.js         # De-duplication logic
├── tmp/                             # Auth state files
│   ├── jira-auth.json
│   └── *.json
└── logs/                            # Execution logs
    ├── jira-scrape.log
    └── update-all-data-*.log
```

---

## Utilities Reference

### 1. Microsoft SSO Authentication (`utils/auth/microsoft-sso.js`)

#### `authenticateWithMicrosoft(page, config)`
Handles complete Microsoft SSO flow with 2FA.

**Parameters:**
- `page`: Playwright page object
- `config`: Configuration object
  - `url`: Target URL requiring authentication
  - `username`: Microsoft email (defaults to `AAD_USERNAME` env var)
  - `password`: Microsoft password (defaults to `AAD_PASSWORD` env var)
  - `mfaTimeout`: Max wait time for MFA in seconds (default: 180)
  - `onMFAPrompt`: Optional callback when waiting for MFA

**Returns:** `Promise<boolean>` - True if authentication successful

**Example:**
```javascript
const { authenticateWithMicrosoft } = require('../../utils/auth/microsoft-sso');

const authenticated = await authenticateWithMicrosoft(page, {
  url: 'https://jia.smedigitalapp.com',
  mfaTimeout: 180,
  onMFAPrompt: () => console.log('Check your phone!')
});
```

#### `saveAuthState(context, storagePath)`
Saves authentication state to file for reuse.

#### `loadAuthState(storagePath)`
Loads previously saved authentication state.

---

### 2. Embedding Generation (`utils/embeddings/openai.js`)

#### `generateEmbedding(text, model)`
Generates single embedding vector.

**Parameters:**
- `text`: Text to embed (max 8000 chars)
- `model`: OpenAI model (default: `text-embedding-3-small`)

**Returns:** `Promise<number[]>` - Embedding vector

#### `generateEmbeddingsBatch(texts, options)`
Generates embeddings for multiple texts with rate limiting.

**Parameters:**
- `texts`: Array of texts to embed
- `options`: Configuration object
  - `model`: OpenAI model (default: `text-embedding-3-small`)
  - `batchSize`: Texts per batch (default: 100)
  - `delayMs`: Delay between batches (default: 1000)
  - `onProgress`: Progress callback

**Returns:** `Promise<number[][]>` - Array of embedding vectors

**Example:**
```javascript
const { generateEmbeddingsBatch } = require('../../utils/embeddings/openai');

const embeddings = await generateEmbeddingsBatch(texts, {
  batchSize: 100,
  delayMs: 1000,
  onProgress: (progress) => {
    console.log(`${progress.processed}/${progress.total} completed`);
  }
});
```

#### `createJiraEmbeddingText(ticket)`
Creates optimized text for JIRA ticket embedding.

Combines: ticket key + summary + status + priority + description

---

### 3. De-duplication (`utils/supabase/deduplication.js`)

#### `deduplicateJiraTickets(tickets)`
Checks which tickets are new, updated, or unchanged.

**Returns:** Object with three arrays:
- `new`: Tickets not in database
- `updated`: Tickets with changes
- `unchanged`: Tickets with no changes

**Example:**
```javascript
const { deduplicateJiraTickets } = require('../../utils/supabase/deduplication');

const { new: newTickets, updated, unchanged } = await deduplicateJiraTickets(allTickets);

console.log(`New: ${newTickets.length}, Updated: ${updated.length}`);
```

#### `insertJiraTickets(tickets)`
Inserts new tickets into `jira_tickets` table.

#### `updateJiraTickets(tickets)`
Updates existing tickets in `jira_tickets` table.

#### `upsertJiraEmbeddings(embeddings)`
Upserts embeddings into `jira_ticket_embeddings` table.

---

## JIRA Scraper Details

### JQL Queries
Default queries in `scrape-jira.js`:

1. **Recent updates (last 30 days)**
   ```jql
   updated >= -30d ORDER BY updated DESC
   ```

2. **Open tickets**
   ```jql
   status in ("To Do", "In Progress", "In Review") ORDER BY priority DESC
   ```

3. **Recent bugs**
   ```jql
   type = Bug AND created >= -90d ORDER BY priority DESC
   ```

4. **AOMA project tickets**
   ```jql
   project = AOMA ORDER BY updated DESC
   ```

### Customizing Queries
Edit the `JQL_QUERIES` array in `scrape-jira.js`:

```javascript
const JQL_QUERIES = [
  {
    name: 'Your custom query',
    jql: 'project = MYPROJECT AND status = "In Progress"'
  }
];
```

### Command Line Options

```bash
# Interactive mode (browser visible)
node scripts/data-collection/scrape-jira.js

# Headless mode (background)
node scripts/data-collection/scrape-jira.js --headless

# Limit number of tickets
node scripts/data-collection/scrape-jira.js --limit 100

# Combined
node scripts/data-collection/scrape-jira.js --headless --limit 500
```

---

## Master Update Script

The `update-all-data.sh` script orchestrates all scrapers.

### Usage
```bash
# Interactive mode
./scripts/data-collection/update-all-data.sh

# Or via npm
npm run update:all-data

# Headless mode
npm run update:all-data:headless
```

### Features
- ✅ Environment variable validation
- ✅ Sequential execution of all scrapers
- ✅ Detailed logging to file
- ✅ Error handling and reporting
- ✅ Summary statistics
- ✅ Continues on individual scraper failure

### Logs
Logs are saved to: `logs/update-all-data-YYYYMMDD-HHMMSS.log`

---

## Scheduling Options

### Option 1: Manual Execution (Recommended to Start)
Run scripts manually when connected to VPN:
```bash
npm run update:all-data
```

### Option 2: Local Cron Job
```bash
# Edit crontab
crontab -e

# Add line (runs weekdays at 9am)
0 9 * * 1-5 cd ~/Documents/projects/siam && npm run update:all-data:headless >> logs/cron.log 2>&1
```

### Option 3: macOS Launchd
Create `~/Library/LaunchAgents/com.siam.data-collection.plist`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.siam.data-collection</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/npm</string>
        <string>run</string>
        <string>update:all-data:headless</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/mcarpent/Documents/projects/siam</string>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>9</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>StandardOutPath</key>
    <string>/Users/mcarpent/Documents/projects/siam/logs/launchd.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/mcarpent/Documents/projects/siam/logs/launchd-error.log</string>
</dict>
</plist>
```

Load it:
```bash
launchctl load ~/Library/LaunchAgents/com.siam.data-collection.plist
```

### Option 4: GitHub Actions Self-Hosted Runner (Best Long-term)

#### Setup Runner
```bash
cd ~/actions-runner
./config.sh --url https://github.com/yourusername/siam
./run.sh &  # Or set up as service
```

#### Create Workflow
`.github/workflows/data-collection.yml`:
```yaml
name: Data Collection

on:
  schedule:
    - cron: '0 9 * * 1-5'  # 9am weekdays
  workflow_dispatch:  # Manual trigger

jobs:
  scrape:
    runs-on: self-hosted
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run data collection
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_KEY }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_KEY }}
          AAD_USERNAME: ${{ secrets.AAD_USERNAME }}
          AAD_PASSWORD: ${{ secrets.AAD_PASSWORD }}
        run: npm run update:all-data:headless

      - name: Upload logs
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: collection-logs
          path: logs/
```

**Benefits:**
- GitHub UI for logs and monitoring
- Manual trigger button
- Runs on your VPN-connected laptop
- Easy to pause/disable
- Notifications on failure

---

## Troubleshooting

### Authentication Issues

**Problem:** "AAD_USERNAME or AAD_PASSWORD not set"
```bash
# Solution: Check environment variables
echo $AAD_USERNAME
echo $AAD_PASSWORD

# Set them if missing
export AAD_USERNAME="your.email@company.com"
export AAD_PASSWORD="your-password"
```

**Problem:** MFA timeout
```bash
# Solution: Increase timeout (default 180s)
# Edit scrape-jira.js and change:
mfaTimeout: 300  # 5 minutes
```

**Problem:** "Authentication failed"
- Check VPN connection
- Verify credentials in environment variables
- Try interactive mode first: `npm run scrape:jira`

### Scraping Issues

**Problem:** No tickets found
- Check JQL queries are valid
- Verify JIRA_BASE_URL is correct
- Test JQL in JIRA web UI first

**Problem:** Playwright errors
```bash
# Reinstall Playwright browsers
npx playwright install chromium --force
```

### Database Issues

**Problem:** "Failed to insert tickets"
- Check Supabase credentials
- Verify service role key (not anon key!)
- Check table exists: `jira_tickets`

**Problem:** Embedding errors
- Check OPENAI_API_KEY is valid
- Verify API quota/billing
- Check for rate limits (increase `delayMs`)

### VPN Issues

**Problem:** Can't reach JIRA
- Confirm VPN is connected
- Test manually: `curl https://jia.smedigitalapp.com`
- Check network settings

---

## Performance Optimization

### Batch Size Tuning
```javascript
// In generateEmbeddingsBatch options
batchSize: 100,  // Increase for faster, decrease if rate limited
delayMs: 1000,   // Increase if hitting rate limits
```

### Ticket Limit
```bash
# Process only first 100 tickets (testing)
node scripts/data-collection/scrape-jira.js --limit 100
```

### Parallel Queries
Edit `scrape-jira.js` to run queries in parallel (advanced):
```javascript
const results = await Promise.all(
  JQL_QUERIES.map(query => runJQLQuery(page, query.jql, query.name))
);
```

---

## Security Best Practices

1. **Never commit credentials**
   - Use `.env.local` (gitignored)
   - Use environment variables

2. **Rotate passwords regularly**
   - Update AAD_PASSWORD when changed

3. **Use service role key carefully**
   - Only for server-side operations
   - Never expose in client code

4. **Store auth state securely**
   - `tmp/*.json` files are gitignored
   - Contain session cookies
   - Delete if compromised

---

## Next Steps

1. ✅ Test JIRA scraper: `npm run scrape:jira`
2. ⏳ Create Confluence scraper
3. ⏳ Create AOMA app scraper
4. ⏳ Set up scheduling (GitHub Actions recommended)
5. ⏳ Monitor logs and performance

---

## Support

- **Architecture docs**: `../DATA-COLLECTION-ARCHITECTURE.md`
- **MCP server**: `../../aoma-mesh-mcp/ARCHITECTURE.md`
- **Logs**: `../../logs/`

---

**Remember:** This is the **data ingestion layer**. For querying data, see the `aoma-mesh-mcp` project!

Fuck yeah, let's collect some data! 🚀
