# Betabase → Supabase Restore Guide

## Overview
Restore the cleaned betabase backup (8 tables, ~44,853 rows) to Supabase project `iopohiajcgkppajrkcfu`.

## Prerequisites ✅
- [x] Local Supabase Docker running with `betabase_backup` database
- [x] Clean dump created: `betabase_clean_dump.sql` (140MB)
- [x] Supabase credentials stored in Infisical
- [x] Service role key obtained

## Step 1: Create Tables in Supabase

1. Go to: https://supabase.com/dashboard/project/iopohiajcgkppajrkcfu/sql/new
2. Copy the contents of `betabase-supabase-schema.sql`
3. Paste into the SQL Editor
4. Click **"Run"**
5. Verify: You should see "Success. No rows returned" message

This creates:
- 8 tables (application, user, round, variation, cases, deployment, scenario, test)
- Indexes for performance
- RLS policies (permissive for now)

## Step 2: Import Data

Run the import script:

```bash
node scripts/import-betabase-data.js
```

This will:
- Connect to local `betabase_backup` database
- Read all data from each table
- Insert into Supabase in batches of 50 rows
- Show progress for each table
- Display summary table at the end

Expected output:
```
📦 Copying application... (expected: 10 rows)
   Found 10 rows
   ✅ Inserted 10/10 rows
   ✅ Completed application: 10/10 rows (0 errors)

📦 Copying user... (expected: 30 rows)
   ...

📈 Summary:
┌─────────────┬──────────┬───────┬────────┐
│ Table       │ Inserted │ Total │ Errors │
├─────────────┼──────────┼───────┼────────┤
│ application │       10 │    10 │      0 │
│ user        │       30 │    30 │      0 │
│ round       │      154 │   154 │      0 │
│ variation   │       67 │    67 │      0 │
│ cases       │     1359 │  1359 │      0 │
│ deployment  │     1793 │  1793 │      0 │
│ scenario    │     8449 │  8449 │      0 │
│ test        │    34631 │ 34631 │      0 │
├─────────────┼──────────┼───────┼────────┤
│ TOTAL       │    44493 │ 44493 │      0 │
└─────────────┴──────────┴───────┴────────┘
```

## Step 3: Verify Data

Check the data in Supabase:

1. Go to: https://supabase.com/dashboard/project/iopohiajcgkppajrkcfu/editor
2. Click on each table to view data
3. Verify row counts match

Or use SQL:
```sql
SELECT 
  'application' as table_name, COUNT(*) as rows FROM application
UNION ALL
SELECT 'user', COUNT(*) FROM "user"
UNION ALL
SELECT 'round', COUNT(*) FROM round
UNION ALL
SELECT 'variation', COUNT(*) FROM variation
UNION ALL
SELECT 'cases', COUNT(*) FROM cases
UNION ALL
SELECT 'deployment', COUNT(*) FROM deployment
UNION ALL
SELECT 'scenario', COUNT(*) FROM scenario
UNION ALL
SELECT 'test', COUNT(*) FROM test;
```

## Credentials (Stored in Infisical)

All credentials are stored in Infisical under the `dev` environment:

```bash
# View all betabase secrets
infisical secrets --env=dev | grep BETABASE
```

Secrets:
- `BETABASE_SUPABASE_URL`
- `BETABASE_SUPABASE_ANON_KEY`
- `BETABASE_SUPABASE_SERVICE_ROLE_KEY`
- `BETABASE_DB_PASSWORD`

## Troubleshooting

### Import script fails with "Connection refused"
- Ensure local Supabase Docker is running: `docker ps | grep supabase_db`
- Check connection: `PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d betabase_backup -c "\dt"`

### Supabase returns 401 Unauthorized
- Verify service role key is correct
- Check that RLS policies are created (they should allow all access)

### Batch insert fails
- The script will continue with the next batch
- Check error message for details
- May need to adjust batch size or add retry logic

## Files Created

- `betabase-supabase-schema.sql` - SQL to create tables
- `scripts/import-betabase-data.js` - Node.js import script
- `betabase_clean_dump.sql` - Full pg_dump backup (140MB)
- `betabase_tables_only.sql` - Tables only (140MB)

## Next Steps

After successful import:

1. **Adjust RLS Policies** - Currently permissive, lock down as needed
2. **Create Foreign Keys** - Add relationships between tables if needed
3. **Build API** - Create Supabase functions or use PostgREST
4. **Connect Frontend** - Use Supabase client to query data

## Support

If you encounter issues, check:
- Supabase logs: https://supabase.com/dashboard/project/iopohiajcgkppajrkcfu/logs
- Local Docker logs: `docker logs supabase_db_projects`
