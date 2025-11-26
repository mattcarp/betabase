# SUPABASE CONNECTION FIX - CRITICAL FOR TUESDAY DEMO

## 🔴 PROBLEM IDENTIFIED

Your RAG system couldn't answer "What is AOMA?" despite having **15,245 vectors** in Supabase because:

1. **DEMO MODE Code**: The `supabaseVectorService.ts` had hardcoded mock data that intercepted ALL AOMA queries (lines 129-186)
2. **Wrong Table**: The `match_siam_vectors_gemini()` function was querying `siam_unified_vectors` (empty) instead of `siam_vectors` (15,245 records)
3. **Type Mismatch**: PostgreSQL cosine distance returns `DOUBLE PRECISION` but the function declared `REAL`

## ✅ FIXES APPLIED

### Fix #1: Removed DEMO MODE Code ✓
**File**: `src/services/supabaseVectorService.ts`
- **Removed**: Lines 129-186 (mock AOMA data)
- **Impact**: RAG system now queries real Supabase database
- **Status**: ✅ COMPLETED

### Fix #2: Database Function (NEEDS YOUR ACTION)
**File**: `FIX_SUPABASE_FOR_DEMO.sql`
- **Action Required**: Run this SQL in your Supabase SQL Editor
- **What it does**: 
  - Updates `match_siam_vectors_gemini()` to query `siam_vectors` table
  - Fixes return type from `REAL` to `DOUBLE PRECISION`
  - Adds `created_at` and `updated_at` to return columns
- **Status**: ⚠️ NEEDS YOUR ACTION

## 📊 DATABASE STATUS

```
✅ siam_vectors table: 15,245 records
❌ siam_unified_vectors table: 0 records (empty)
✅ AOMA-specific vectors: 1,000+ records
✅ Connection: WORKING
```

## 🚀 HOW TO COMPLETE THE FIX

### Step 1: Run the SQL Fix
1. Open your Supabase dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `FIX_SUPABASE_FOR_DEMO.sql`
4. Click "Run"
5. You should see: "Fixed match_siam_vectors_gemini to use siam_vectors table! 🚀"

### Step 2: Test the Fix
```bash
npx tsx scripts/test-aoma-rag.ts
```

Expected output:
```
✅ SUCCESS! Found 5 real results from Supabase:
--- Result 1 ---
Similarity: 85.2%
Source: jira - AOMA-13047
Content: AOMA-13047: AOMA3: User managed email subscriptions...
```

### Step 3: Test in Browser
1. Refresh your app at http://localhost:3000
2. Ask: "What is AOMA?"
3. You should now get real answers from your 15,245 vectors!

## 🔍 VERIFICATION COMMANDS

Check database connection:
```bash
npx tsx scripts/find-aoma-vectors.ts
```

Check table counts:
```bash
npx tsx -e "
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  const { count } = await supabase
    .from('siam_vectors')
    .select('*', { count: 'exact', head: true });
  console.log('Total vectors:', count);
}
check();
"
```

## 📝 WHAT WAS WRONG

### Before:
```typescript
// DEMO MODE was intercepting queries
if (query.toLowerCase().includes("aoma")) {
  return [/* mock data */];  // ❌ Never reached real database
}
```

### After:
```typescript
// Removed DEMO MODE - queries go straight to Supabase
const { data, error } = await rpcClient.rpc('match_siam_vectors_gemini', {
  p_organization: 'sony-music',
  p_division: 'digital-operations',
  p_app_under_test: 'aoma',
  query_embedding: queryEmbedding,
  // ... ✅ Now queries real data
});
```

## 🎯 FOR TUESDAY DEMO

After running the SQL fix, your demo will:
- ✅ Answer "What is AOMA?" with real data from 15,245 vectors
- ✅ Use actual Jira tickets (AOMA-13047, AOMA-16965, etc.)
- ✅ Leverage your full knowledge base
- ✅ Show real RAG performance with Gemini embeddings

## 🆘 IF SOMETHING GOES WRONG

1. **SQL Editor shows error**: Copy the exact error message and share it
2. **Test script fails**: Run with `--debug` flag
3. **Browser still shows mock data**: Hard refresh (Cmd+Shift+R) and clear cache

## 📞 NEXT STEPS

1. ⚠️ **CRITICAL**: Run `FIX_SUPABASE_FOR_DEMO.sql` in Supabase SQL Editor
2. ✅ Test with `npx tsx scripts/test-aoma-rag.ts`
3. ✅ Test in browser at http://localhost:3000
4. 🎉 Demo ready for Tuesday!
