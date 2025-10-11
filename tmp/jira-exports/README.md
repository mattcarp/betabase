# JIRA CSV Export Instructions

## Export Location
Store all CSV exports in this directory: `/Users/mcarpent/Documents/projects/siam/tmp/jira-exports/`

## JQL Queries (Copy/Paste into JIRA)

### 1. AOMA Project (Main AOMA application)
**File name:** `aoma-tickets.csv`

```jql
project = AOMA AND updated >= -110d ORDER BY updated DESC
```

### 2. ITSM Project (IT Service Management)
**File name:** `itsm-tickets.csv`

```jql
project = ITSM AND updated >= -110d ORDER BY updated DESC
```

### 3. DPSA Project (Digital Product & Services Architecture)
**File name:** `dpsa-tickets.csv`

```jql
project = DPSA AND updated >= -110d ORDER BY updated DESC
```

### 4. SMDA Project (Sony Music Digital Apps)
**File name:** `smda-tickets.csv`

```jql
project = SMDA AND updated >= -110d ORDER BY updated DESC
```

### 5. ALL Projects Combined (Fallback/Comprehensive)
**File name:** `all-projects-tickets.csv`

```jql
project in (AOMA, ITSM, DPSA, SMDA) AND updated >= -110d ORDER BY updated DESC
```

## Export Steps (For Each Project)

1. **Go to JIRA**: https://jira.smedigitalapps.com/jira
2. **Click**: Filters → Advanced issue search
3. **Paste JQL query** from above
4. **Click**: Export → Export Excel CSV (all fields)
5. **Save file** with the exact name shown above
6. **Move to**: `/Users/mcarpent/Documents/projects/siam/tmp/jira-exports/`

## Import Script (Run After All Exports)

Once you've exported all CSV files, run:

```bash
# Import each project separately
node scripts/data-collection/import-jira-csv.js tmp/jira-exports/aoma-tickets.csv
node scripts/data-collection/import-jira-csv.js tmp/jira-exports/itsm-tickets.csv
node scripts/data-collection/import-jira-csv.js tmp/jira-exports/dpsa-tickets.csv
node scripts/data-collection/import-jira-csv.js tmp/jira-exports/smda-tickets.csv

# Or import the combined export (if using option 5)
node scripts/data-collection/import-jira-csv.js tmp/jira-exports/all-projects-tickets.csv
```

## Deduplication Strategy

**CRITICAL**: The import script uses `external_id` (ticket key like "AOMA-12345") for deduplication.

- **UPSERT logic**: INSERT new tickets, UPDATE existing ones
- **No duplicates**: Same ticket key = update existing record
- **Safe to run multiple times**: Re-running import will just update existing tickets

## Expected Results

- **Time range**: Last 110 days (since ~July 3, 2025)
- **Estimated tickets**: ~6,000+ tickets across all projects
- **Processing time**: ~10-15 minutes per 1,000 tickets (includes embedding generation)

## Verification Queries (After Import)

```sql
-- Check total tickets imported
SELECT COUNT(*) FROM jira_tickets;

-- Check tickets by project
SELECT
  metadata->>'project' as project,
  COUNT(*) as ticket_count
FROM jira_tickets
GROUP BY metadata->>'project'
ORDER BY ticket_count DESC;

-- Check most recent ticket update
SELECT
  external_id,
  title,
  metadata->>'updated' as last_updated
FROM jira_tickets
ORDER BY (metadata->>'updated')::timestamp DESC
LIMIT 10;
```

## Notes

- Export "all fields" to ensure we capture all metadata
- The script handles missing/optional fields gracefully
- Embeddings are generated for ticket key, title, description, status, priority, type, and project
- Rate limiting: 100 tickets/batch with 1-second delay between batches
