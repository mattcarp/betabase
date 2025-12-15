# Pre-Cache Strategy for Demo Recording

**Goal:** Instant responses during recording (sub-200ms perceived latency)

---

## How Caching Works

### Vector Search Cache
- **Supabase pgvector** results cached in memory
- **Warm-up:** Run query once, subsequent identical queries = instant
- **Duration:** Cache persists until dev server restart
- **Key:** Exact query text must match

### Gemini Response Cache
- **Response streaming** from Gemini API
- **Not cached** by default (each call hits API)
- **Workaround:** Use identical queries to leverage Gemini's internal cache

### Mermaid Diagram Cache
- **Client-side rendering** (browser)
- **Instant on re-render** if same diagram code
- **Trick:** Generate diagram before recording, re-ask on camera

---

## Pre-Recording Warm-Up Sequence

Run these **5 minutes before recording** (in order):

### 1. Multi-Tenant ERD
```
Show me the multi-tenant database architecture
```
**Wait for:** Mermaid diagram to fully render
**Why:** Opens with this - must be instant

### 2. Core AOMA Query
```
What are the steps to link a product to a master in AOMA?
```
**Wait for:** Full streaming response + citations
**Why:** Main demo query for Chat pillar

### 3. Product Workflow
```
Show this as a workflow diagram
```
**Wait for:** Mermaid to render
**Why:** Follow-up diagram demo

### 4. Release Notes
```
What new features are in AOMA 2.116.0?
```
**Wait for:** Response complete
**Why:** Backup query if needed

### 5. Navigate Tabs
- Click "Curate" → wait for load
- Click "Test" → wait for dashboard
- Click "Chat" → return to start
**Why:** Lazy-loaded components now in memory

---

## During Recording: Query Order

Use these **exact queries** (already cached):

### Opening (Multi-Tenant ERD)
```
Show me the multi-tenant database architecture
```
**Expected:** Instant Mermaid render (< 1s)

### Chat Pillar
```
What are the steps to link a product to a master in AOMA?
```
**Expected:** Streaming starts immediately, citations appear inline

**Optional follow-up:**
```
Show this as a workflow diagram
```
**Expected:** Mermaid renders fast (already cached)

### Curate Pillar
- No queries needed
- UI interaction only (thumbs, stars, submit)

### Test Pillar
- No queries needed
- Navigate tabs, show stats, click healing items

---

## Cache Invalidation Points

**Restart dev server** = all cache lost
**Change query text** = new cache miss
**5+ minutes idle** = some cache may expire

---

## Emergency: Cache Miss During Recording

### If Query Slow
1. **Don't panic** - keep recording
2. Say: "Processing multi-source query..."
3. **CapCut fix:** Trim the wait time in edit

### If Diagram Slow
1. Say: "Diagram generating..."
2. **CapCut fix:** Speed up this section 1.5x
3. Or: Skip diagram, say "available on demand"

### If Complete Failure
1. **Cut recording**
2. Re-run warm-up sequence
3. Wait 2 minutes
4. Start recording again

---

## Verification Checklist

Before you hit record, verify:

- [ ] Ran all 5 warm-up queries
- [ ] Each query responded < 3 seconds
- [ ] Mermaid diagrams rendered fully
- [ ] Navigated to Test tab (loaded)
- [ ] Navigated to Curate tab (loaded)
- [ ] No console errors visible
- [ ] Dev server logs show no errors

---

## Advanced: Pre-Seeding Data

If you want the **Curate feedback queue** to have items:

```bash
# Run this script (if it exists)
npm run seed:demo-feedback
```

If you want the **Test dashboard** to show real healing attempts:

```bash
# Mock data should already be in SelfHealingTestViewer.tsx
# If not, the component has 3 built-in mock items
```

---

## Timing: When to Warm Up

**5 minutes before recording:**
- Optimal - cache is hot
- Gemini connection established
- Vector search warmed

**10+ minutes before:**
- Some cache may cool
- Re-run one query to verify

**Immediately before:**
- Risky - if something fails, no time to fix
- Only do this if you've tested extensively

---

## What Gets Cached vs What Doesn't

### ✅ Cached (Fast on Second Run)
- Supabase vector search results
- Mermaid diagram rendering (client-side)
- Component lazy-load (React)
- Tab data (if already navigated)

### ❌ Not Cached (Always API Call)
- Gemini streaming responses (each call hits API)
- Live Supabase writes (feedback submission)
- Test dashboard stats (if real-time)

### 🤔 Partially Cached
- Gemini may have internal cache for identical prompts
- But don't rely on it

---

**Strategy:** Warm up everything, record quickly, edit ruthlessly in CapCut

---

*Created: December 15, 2025*
*Part of: DEMO-CAPCUT-MASTER.md workflow*
