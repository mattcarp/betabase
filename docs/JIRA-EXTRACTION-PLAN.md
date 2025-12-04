# Jira/Atlassian Bulk Data Extraction Plan

**Scheduled**: 2025-12-05 15:30 Malta/Rome time (CET)
**Duration**: Expect 2-4 hours depending on data volume
**Blocker Resolved**: Matt has VPN access again after 2 weeks

## Pre-Session Checklist (Do Before 15:30)

- [ ] VPN client (GlobalConnect) installed and working
- [ ] Jira credentials ready
- [ ] Alexandria/Confluence credentials ready
- [ ] `./scripts/init.sh` runs successfully
- [ ] Playwright Jira scraper script ready (F004)

## Session Workflow

### 1. VPN Connection (Matt handles)
```
Matt: Connect to Sony VPN via GlobalConnect
Agent: Waiting for confirmation of successful connection
```

### 2. Authentication Capture
```bash
# Start Playwright in headed mode to capture auth
npx playwright test scripts/jira-extractor.spec.ts --headed --debug
```

**What happens:**
1. Browser opens, navigates to Jira
2. Matt logs in manually (SSO/Okta)
3. Script saves auth state to `playwright/.auth/jira-state.json`
4. Subsequent runs use saved auth (no manual login)

### 3. Bulk Extraction

**Jira Tickets:**
```bash
npx playwright test scripts/jira-extractor.spec.ts --project=extract
```

**Expected output:**
- `data/jira/tickets.json` - All tickets with metadata
- `data/jira/comments.json` - All comments
- `data/jira/attachments/` - Downloaded files

**Alexandria/Confluence:**
```bash
npx playwright test scripts/alexandria-extractor.spec.ts --project=extract
```

**Expected output:**
- `data/alexandria/pages.json` - All pages with hierarchy
- `data/alexandria/content/` - Markdown files per page

### 4. Data Validation
```bash
# Verify extraction quality
node scripts/validate-extraction.js
```

### 5. Import to Supabase (Post-session)
```bash
# Import to vector store
npm run import:jira
npm run import:alexandria
```

## Data Schema

### Jira Ticket
```json
{
  "key": "AOMA-1234",
  "summary": "Ticket title",
  "description": "Full description",
  "status": "In Progress",
  "assignee": "matt.carpenter",
  "reporter": "someone",
  "created": "2025-01-15T10:30:00Z",
  "updated": "2025-12-01T14:22:00Z",
  "priority": "High",
  "labels": ["backend", "urgent"],
  "components": ["API"],
  "comments": [...],
  "attachments": [...]
}
```

### Alexandria Page
```json
{
  "id": "12345",
  "title": "Page Title",
  "space": "AOMA",
  "parent": "67890",
  "content": "Markdown content...",
  "created": "2024-06-01T09:00:00Z",
  "updated": "2025-11-15T16:45:00Z",
  "author": "matt.carpenter"
}
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| VPN drops | Re-connect, auth state should persist |
| SSO timeout | Re-run with `--headed` to re-authenticate |
| Rate limiting | Script has built-in delays, increase if needed |
| Large attachments | Skip files > 50MB, download separately |

## Post-Extraction

1. Validate data completeness
2. Import to Supabase vector store
3. Update features.json (mark F003 as passes: true)
4. Update claude-progress.txt
5. Git commit extracted data (or .gitignore if sensitive)

## Notes

- This is a one-time bulk extraction
- After initial import, we'll set up incremental sync (B002 in backlog)
- Data will power SIAM's knowledge base for AOMA queries
