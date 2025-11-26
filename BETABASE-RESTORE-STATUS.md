# Betabase Restore to Supabase - Status Report

**Date:** November 24, 2025  
**Target:** Supabase Project `iopohiajcgkppajrkcfu`  
**Status:** 🟡 Ready for Final Steps

## ✅ Completed Steps

### 1. Local Database Dump Created ✅
- **Source:** Local Supabase Docker instance (`betabase_backup`)
- **File:** `betabase_clean_dump.sql` (140MB)
- **Tables:** 8 core tables (application, user, round, variation, cases, deployment, scenario, test)
- **Total Rows:** ~44,853 rows
- **Key Data:** 
  - 34,631 test execution results
  - 8,449 test scenarios

### 2. Infisical Updated & All Secrets Stored ✅
- **Previous Version:** 0.43.24
- **Current Version:** 0.43.30
- **Secrets Stored in Infisical (dev environment):**
  - `BETABASE_SUPABASE_URL`: https://iopohiajcgkppajrkcfu.supabase.co
  - `BETABASE_SUPABASE_ANON_KEY`: eyJhbGci... ✅
  - `BETABASE_SUPABASE_SERVICE_ROLE_KEY`: sb_secret_Xfh... ✅
  - `BETABASE_DB_PASSWORD`: &xhB5mbS?!P ✅

### 3. Import Scripts Created ✅
- **Schema SQL:** `betabase-supabase-schema.sql` - Creates all 8 tables with indexes and RLS
- **Import Script:** `scripts/import-betabase-data.js` - Node.js script to import all data
- **Restore Guide:** `BETABASE-RESTORE-GUIDE.md` - Step-by-step instructions

### 4. Infisical CLI Upgrade Summary (0.43.24 → 0.43.30)

**Key Changes:**
- **v0.43.30**: Fixed retry race condition in agent
- **v0.43.29**: Added reusable leases and retry mechanism, better error visibility
- **v0.43.28**: Added `--target-relay-name` flag, deprecated `--relay`
- **v0.43.27**: Systemd notify for relay/gateway, fixed `--domain` flag
- **v0.43.26**: SSH PAM support, session recording, public key support

**Impact:** No breaking changes for basic secret management workflows.

## 🎯 Next Steps (Ready to Execute)

### Step 1: Create Tables in Supabase (Manual)

1. Sign in to Supabase: https://supabase.com/dashboard/project/iopohiajcgkppajrkcfu/sql/new
2. Copy contents of `betabase-supabase-schema.sql`
3. Paste into SQL Editor
4. Click **"Run"**
5. Verify success message

### Step 2: Import Data (Automated)

Once tables are created, run:

```bash
node scripts/import-betabase-data.js
```

Expected duration: ~5-10 minutes for 44,853 rows

### Step 3: Verify Import

Check row counts in Supabase:
```sql
SELECT 'application' as table_name, COUNT(*) FROM application
UNION ALL SELECT 'user', COUNT(*) FROM "user"
UNION ALL SELECT 'round', COUNT(*) FROM round
UNION ALL SELECT 'variation', COUNT(*) FROM variation
UNION ALL SELECT 'cases', COUNT(*) FROM cases
UNION ALL SELECT 'deployment', COUNT(*) FROM deployment
UNION ALL SELECT 'scenario', COUNT(*) FROM scenario
UNION ALL SELECT 'test', COUNT(*) FROM test;
```

Expected totals:
- application: 10
- user: 30
- round: 154
- variation: 67
- cases: 1,359
- deployment: 1,793
- scenario: 8,449
- test: 34,631
- **TOTAL: 44,493**

## 📋 Files Created

| File | Size | Purpose |
|------|------|---------|
| `betabase_clean_dump.sql` | 140MB | Full pg_dump backup |
| `betabase-supabase-schema.sql` | 8KB | SQL to create tables |
| `scripts/import-betabase-data.js` | 6KB | Node.js import script |
| `BETABASE-RESTORE-GUIDE.md` | 4KB | Step-by-step guide |
| `BETABASE-RESTORE-STATUS.md` | 3KB | This status report |

## 🔧 Technical Notes

### Why Not Direct pg_dump Restore?
- Direct PostgreSQL connection to Supabase is blocked (firewall/security)
- Connection pooler requires different authentication
- **Solution:** Use Supabase REST API via Node.js script

### Import Strategy
- Batch size: 50 rows per request (Supabase limit)
- Rate limiting: 100ms delay between batches
- Error handling: Continue on batch failure, report at end
- Progress tracking: Real-time console output

### RLS Policies
- Currently **permissive** (allow all access)
- Adjust after import based on security requirements

## 🔗 Resources

- **Supabase Project:** https://supabase.com/dashboard/project/iopohiajcgkppajrkcfu
- **SQL Editor:** https://supabase.com/dashboard/project/iopohiajcgkppajrkcfu/sql/new
- **Table Editor:** https://supabase.com/dashboard/project/iopohiajcgkppajrkcfu/editor
- **Infisical Secrets:** `infisical secrets --env=dev`

## ⚠️ Prerequisites

- [x] Local Supabase Docker running
- [x] `betabase_backup` database accessible
- [x] All credentials in Infisical
- [x] Import scripts created
- [ ] **User signed in to Supabase** (required for Step 1)
- [ ] Tables created in Supabase (Step 1)
- [ ] Data imported (Step 2)

## 🚀 Ready to Proceed

Everything is prepared. Once you sign in to Supabase and run the schema SQL, we can execute the import script to complete the restore.
