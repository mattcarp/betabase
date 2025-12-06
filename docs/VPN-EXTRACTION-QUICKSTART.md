# VPN Data Extraction - Quick Start

**Say to Claude:** "Run the VPN extraction workflow" or "Use docs/VPN-EXTRACTION-QUICKSTART.md"

---

## On New Machine (After git pull)

### 1. Setup
```bash
git pull origin main
npm install
```

### 2. Connect to VPN
- Open **GlobalConnect**
- Connect to Sony VPN
- Confirm you can reach internal sites

### 3. Run Jira Extraction (Interactive)
```bash
npx playwright test scripts/extractors/jira-extractor.ts --headed
```
- Browser opens
- **You login manually** (SSO/Okta)
- Auth saves to `playwright/.auth/jira-state.json`
- Extraction runs automatically after login

### 4. Run Alexandria/Confluence Extraction
```bash
npx playwright test scripts/extractors/alexandria-extractor.ts --headed
```
- Same process - manual login, then automatic extraction

### 5. After Extraction
```bash
# Validate
node scripts/validate-extraction.js

# Import to Supabase
npm run import:jira
npm run import:alexandria

# Commit and push
git acm "Bulk Jira/Confluence data extraction"
npm version patch
git push origin main
```

---

## Reference Docs

| Doc | Purpose |
|-----|---------|
| `docs/JIRA-EXTRACTION-PLAN.md` | Full extraction plan with data schemas |
| `claude-progress.txt` | Session notes, warnings, blockers |
| `features.json` | Tracks F003, F004, F005 extraction features |
| `scripts/extractors/jira-extractor.ts` | Jira scraper script |
| `scripts/extractors/alexandria-extractor.ts` | Confluence scraper script |

---

## Key Points

- **Headed mode = interactive** - browser opens, you do the login
- **Auth state persists** - subsequent runs skip login
- **Data outputs to** `data/jira/` and `data/alexandria/`
- **5 minute timeout** for manual login before script times out
