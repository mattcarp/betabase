# 📋 Manual JIRA Ticket Upsert Guide

**Updated**: October 11, 2025
**Database**: 6,040 existing tickets (from July 3, 2025)
**Goal**: Update tickets with latest data, avoid duplicates

---

## 🎯 Quick Start (5 Steps)

### Step 1: Export JIRA Tickets

Since you're doing this manually (not using Sony Music JIRA API), choose one method:

#### Option A: JIRA Web UI Export (Recommended)

1. Go to your JIRA instance
2. Run a JQL query to get the tickets you want:
   ```jql
   updated >= -90d ORDER BY updated DESC
   ```
3. Click **Export** → **Export Excel CSV (Current fields)**
4. Save as `jira-export-oct-2025.csv`

#### Option B: JIRA Advanced Export

1. Use JIRA's **Export** feature with these columns:
   - Issue key
   - Summary
   - Description
   - Status
   - Priority
   - Project
   - Updated

2. Save as CSV

### Step 2: Prepare Your Export File

**Required columns**:

- `ticket_key` or `key` or `Key` (e.g., "ITSM-12345")
- `summary` or `Summary` (ticket title)

**Optional but recommended**:

- `description` or `Description`
- `status` or `Status`
- `priority` or `Priority`
- `project` or `Project`

**Example CSV format**:

```csv
Key,Summary,Description,Status,Priority,Project
ITSM-12345,Login issue on production,Users cannot login to the portal,Open,High,ITSM
ITSM-12346,Update user permissions,Need to grant admin access,In Progress,Medium,ITSM
AOMA-5001,File upload timeout,Large files fail to upload,Closed,High,AOMA
```

**Example JSON format**:

```json
[
  {
    "key": "ITSM-12345",
    "summary": "Login issue on production",
    "description": "Users cannot login to the portal",
    "status": "Open",
    "priority": "High",
    "fields": {
      "project": { "key": "ITSM" },
      "updated": "2025-10-11T10:30:00.000Z"
    }
  }
]
```

### Step 3: Dry Run (Check Before Executing)

```bash
# Test with dry-run to see what will happen
node scripts/data-collection/manual-jira-upsert.js \
  --file ~/Downloads/jira-export-oct-2025.csv \
  --dry-run
```

**Output will show**:

- ✅ How many tickets loaded
- ✅ How many are new vs. existing
- ✅ Which tickets have invalid format
- ✅ Estimated operations

### Step 4: Run the Upsert

```bash
# Actually execute the upsert
node scripts/data-collection/manual-jira-upsert.js \
  --file ~/Downloads/jira-export-oct-2025.csv
```

**What happens**:

1. ✅ Loads tickets from CSV/JSON
2. ✅ Checks against existing 6,040 tickets
3. ✅ Generates embeddings for new/changed tickets
4. ✅ **UPSERTS** (inserts new, updates existing)
5. ✅ Saves checkpoint (can resume if interrupted)

### Step 5: Verify Results

```bash
# Check database counts
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const { count } = await supabase
    .from('jira_ticket_embeddings')
    .select('*', { count: 'exact', head: true });

  console.log('Total JIRA tickets:', count);

  const { data } = await supabase
    .from('jira_ticket_embeddings')
    .select('created_at, updated_at')
    .order('updated_at', { ascending: false })
    .limit(5);

  console.log('\\nMost recently updated:');
  data.forEach((t, i) => {
    console.log(\`  \${i+1}. Updated: \${t.updated_at}\`);
  });
})();
"
```

---

## 🔥 Advanced Usage

### Resume from Checkpoint

If the script is interrupted, resume where you left off:

```bash
node scripts/data-collection/manual-jira-upsert.js --resume
```

### Custom Batch Size

For rate limit management:

```bash
# Smaller batches (slower but safer)
node scripts/data-collection/manual-jira-upsert.js \
  --file jira-export.csv \
  --batch-size 50

# Larger batches (faster but may hit rate limits)
node scripts/data-collection/manual-jira-upsert.js \
  --file jira-export.csv \
  --batch-size 200
```

### Multiple Exports

Update different projects separately:

```bash
# Update ITSM tickets
node scripts/data-collection/manual-jira-upsert.js --file itsm-tickets.csv

# Update AOMA tickets
node scripts/data-collection/manual-jira-upsert.js --file aoma-tickets.csv

# Update ALL recent tickets
node scripts/data-collection/manual-jira-upsert.js --file all-recent-tickets.csv
```

---

## 🎯 Improvements from July 2025

### 1. **Automatic Deduplication**

```
OLD (July): Manual checking of ticket_key, potential duplicates
NEW (October): Built-in UPSERT using ticket_key as unique constraint
```

**How it works**:

- Script checks existing tickets by `ticket_key`
- New tickets: INSERT
- Existing tickets: UPDATE (refreshes embedding & metadata)
- **Zero duplicates guaranteed**

### 2. **Resume Capability**

```
OLD (July): If script crashes, start from scratch
NEW (October): Checkpoint every batch, resume from last successful batch
```

**Checkpoint file**: `tmp/jira-upsert-checkpoint.json`

### 3. **Better Progress Tracking**

```
OLD (July): "Processing... 100%"
NEW (October): Detailed batch-by-batch progress with ETA
```

**Example output**:

```
📦 Batch 1/10 (100 tickets)
   Generating embeddings...
   Progress: 10/100
   Progress: 20/100
   ...
   Upserting 100 tickets...
   ✅ Batch complete: 100 tickets upserted

📦 Batch 2/10 (100 tickets)
   ...
```

### 4. **Error Resilience**

```
OLD (July): One bad ticket crashes entire import
NEW (October): Skip invalid tickets, log warnings, continue
```

### 5. **Dry Run Mode**

```
OLD (July): Hope it works, pray for the best
NEW (October): Test first with --dry-run
```

---

## 📊 Expected Results

### For 1,000 New Tickets

- **Time**: ~30-40 minutes (with rate limiting)
- **Cost**: ~$0.01 in OpenAI API calls
- **Database size**: +5MB

### For Updating Existing 6,040 Tickets

- **Time**: ~4-5 hours (full refresh)
- **Cost**: ~$0.60 in OpenAI API calls
- **Database size**: No change (just updated embeddings)

---

## 🚨 Important Notes

### Deduplication Strategy

The script uses `ticket_key` as the unique identifier:

```sql
-- Database constraint (prevents duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS jira_ticket_embeddings_ticket_key_unique
  ON jira_ticket_embeddings (ticket_key);
```

**What this means**:

- ✅ **Safe to run multiple times** - won't create duplicates
- ✅ **Updates overwrite** - latest data wins
- ✅ **Idempotent** - same result every time

### Rate Limits

**OpenAI Embeddings**:

- Tier 1: 500 requests/min
- Tier 2: 3,000 requests/min
- Script includes 70ms delay per request (~857 req/min)

### Database Schema

Current schema stores embeddings as **TEXT** (not vector):

```sql
embedding TEXT  -- "[0.123,0.456,...]" format
```

**Note**: After migration to `vector(1536)` format, embeddings will be searchable.

---

## 🔧 Troubleshooting

### "No tickets loaded"

**Check**:

- File path is correct
- CSV has headers
- Columns are named correctly (see template above)

### "Failed to generate embedding"

**Possible causes**:

- OpenAI API key not set
- Rate limit exceeded (script will auto-retry)
- Network timeout

### "Upsert failed: duplicate key"

This shouldn't happen with the new script, but if it does:

```bash
# Check for duplicate ticket_keys in your CSV
awk -F',' 'NR>1 {print $1}' jira-export.csv | sort | uniq -d
```

---

## 📖 Next Steps After Upsert

1. **Verify data quality**:

   ```bash
   # Check recent tickets
   node -e "require('./scripts/check-jira-data.js')"
   ```

2. **Test vector search**:

   ```bash
   # Once migration is deployed
   node scripts/test-hybrid-integration.js
   ```

3. **Enable in production**:
   - Uncomment Supabase integration in `/app/api/chat/route.ts`
   - Deploy migration `001_aoma_vector_store_optimized.sql`

---

## 📝 Quick Reference

```bash
# Dry run
node scripts/data-collection/manual-jira-upsert.js --file FILE.csv --dry-run

# Execute
node scripts/data-collection/manual-jira-upsert.js --file FILE.csv

# Resume
node scripts/data-collection/manual-jira-upsert.js --resume

# Custom batch size
node scripts/data-collection/manual-jira-upsert.js --file FILE.csv --batch-size 50
```

---

**Last Updated**: October 11, 2025
**Script**: `/scripts/data-collection/manual-jira-upsert.js`
**Database**: 6,040 tickets (as of July 3, 2025)
