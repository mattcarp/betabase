# JIRA ITSM Training Data Integration Plan

**Created:** 2025-11-04
**Status:** ✅ Data Extracted & Processed
**Next:** Upload to Vector Database

---

## 📊 What We Have

### Raw Data
- **Source:** Sony Music JIRA ITSM Export (Nov 2024)
- **File:** `data/aoma-export.csv` (13MB)
- **Total Records:** 309,125 tickets (CSV includes many attachment columns)
- **Unique Tickets:** 2,179 support tickets

### Processed Data
- **Location:** `docs/aoma/training-data/`
- **Files:**
  - `jira-tickets-processed.json` (3.0MB) - Full structured data
  - `ticket-chunks.json` (3.0MB) - Ready for embedding
  - `sample-queries.json` (2.8KB) - Test queries
  - `jira-tickets-summary.md` (23KB) - Analysis report

### Key Statistics
- **Total Tickets:** 2,179
- **AOMA-Related:** 1,044 (47.9%)
- **Resolution Rate:** 97.1% (2,116 resolved)
- **Avg Content Length:** 846 characters per ticket
- **Date Range:** Oct 9 - Nov 8, 2024

### Breakdown by Type
- **AOMA:** 1,400 tickets (64.2%) 
- **PROMO:** 468 tickets (21.5%)
- **BOX:** 261 tickets (12.0%)
- **DX:** 36 tickets (1.7%)
- **CI:** 14 tickets (0.6%)

---

## 🎯 Value Proposition

This dataset provides:

1. **Real User Questions** - Actual problems users face with AOMA
2. **Proven Solutions** - 97% of tickets are resolved with solutions
3. **Common Patterns** - Identify frequently occurring issues
4. **Natural Language** - How real users describe problems
5. **Context Rich** - Includes metadata, priorities, dates

---

## 🚀 Integration Steps

### Phase 1: Vector Database Setup ✅ READY
**Input:** `ticket-chunks.json` (2,179 chunks)

#### Option A: Supabase (Current Setup)
```sql
-- Already have pgvector extension enabled
-- Use existing `aoma_knowledge` table or create new `jira_tickets` table

CREATE TABLE IF NOT EXISTS jira_tickets (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  summary TEXT,
  metadata JSONB,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON jira_tickets USING ivfflat (embedding vector_cosine_ops);
```

#### Option B: Pinecone (Alternative)
- Create new index: `aoma-jira-tickets`
- Dimension: 1536 (OpenAI ada-002)
- Metric: cosine
- Namespace: `jira-support`

### Phase 2: Create Embeddings
**Script:** Create `scripts/aoma/upload_ticket_embeddings.mjs`

```javascript
// Pseudocode
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const chunks = JSON.parse(fs.readFileSync('ticket-chunks.json'));

for (const chunk of chunks) {
  // Create embedding
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: chunk.content
  });
  
  // Insert into Supabase
  await supabase.from('jira_tickets').insert({
    id: chunk.id,
    content: chunk.content,
    summary: chunk.summary,
    metadata: chunk.metadata,
    embedding: response.data[0].embedding
  });
}
```

**Cost Estimate:**
- 2,179 chunks × 846 avg chars = ~1.8M tokens
- text-embedding-3-small: $0.02 / 1M tokens
- **Total Cost: ~$0.04**

### Phase 3: Update Chat API
**File:** `src/app/api/chat/route.ts`

Add JIRA ticket search alongside existing knowledge base:

```typescript
// 1. Search JIRA tickets
const { data: tickets } = await supabase.rpc('match_jira_tickets', {
  query_embedding: embedding,
  match_threshold: 0.7,
  match_count: 5
});

// 2. Search existing AOMA docs
const { data: docs } = await supabase.rpc('match_aoma_knowledge', {
  query_embedding: embedding,
  match_threshold: 0.7,
  match_count: 5
});

// 3. Combine results with proper weighting
const context = [
  ...docs.map(d => ({ source: 'documentation', ...d })),
  ...tickets.map(t => ({ source: 'support_ticket', ...t }))
];
```

### Phase 4: Testing
**File:** `scripts/test-jira-enhanced-search.mjs`

Test queries from `sample-queries.json`:
```bash
node scripts/test-jira-enhanced-search.mjs
```

Expected improvements:
- ✅ Better answers to user-specific questions
- ✅ Real example solutions from past tickets
- ✅ Knowledge of common issues and workarounds

---

## 📈 Expected Improvements

### Before (Documentation Only)
**User:** "How do I upload assets to AOMA?"
**AI:** *Generic answer from wiki docs*

### After (Documentation + Tickets)
**User:** "How do I upload assets to AOMA?"
**AI:** *Generic answer PLUS real examples:*
- "Based on ticket ITSM-48932, users successfully upload via Simple Upload"
- "Common issue (ITSM-47521): ensure file format is WAV/FLAC"
- "Tip from ITSM-46789: batch uploads require Media Batch Converter"

---

## 🎓 Learning Opportunities

From analyzing the tickets, we can:

1. **Build FAQ** - Top 20 most common questions
2. **Improve Docs** - Fill gaps where users struggle
3. **Proactive Help** - Warn users about known issues
4. **Better UX** - Simplify workflows that generate tickets

---

## 📋 Implementation Checklist

- [x] Download JIRA CSV export
- [x] Process and structure ticket data
- [x] Create embedding-ready chunks
- [x] Analyze ticket patterns
- [ ] Create Supabase table (or Pinecone index)
- [ ] Generate embeddings (OpenAI)
- [ ] Upload to vector database
- [ ] Update chat API to include ticket search
- [ ] Test with sample queries
- [ ] Deploy to production
- [ ] Monitor quality improvements

---

## 💰 Cost Analysis

### One-Time Setup
- **Embedding Creation:** ~$0.04 (2,179 × 846 chars)
- **Developer Time:** ~2 hours
- **Total:** ~$0.04 + 2 hours

### Ongoing Costs
- **Storage:** Negligible (3MB in Supabase)
- **Search Queries:** Already covered by existing embedding budget
- **Maintenance:** Update quarterly with new JIRA exports

---

## 🔄 Update Strategy

### Quarterly Refresh
1. Export new JIRA tickets (quarterly)
2. Run `process_jira_export.mjs` on new data
3. Run `create_ticket_embeddings.mjs` to create chunks
4. Upload new/updated tickets to vector DB
5. Test quality with sample queries

### Automation (Future)
- JIRA API integration for real-time updates
- Webhook on ticket resolution → auto-embed
- Dashboard showing ticket-derived answers

---

## 📚 Related Documentation

- [AOMA Knowledge Base Structure](./AOMA-DOCUMENTATION-INDEX.md)
- [Embedding Strategy](../EMBEDDING-STRATEGY.md)
- [Chat API Documentation](../../src/app/api/chat/README.md)

---

## 🚨 Important Notes

### Data Privacy
- ✅ All tickets are internal Sony Music support requests
- ✅ No customer PII exposed
- ✅ Metadata includes ticket IDs for traceability

### Quality Control
- ⚠️ Only 0.0% of tickets have comments
- ✅ 97.1% have resolutions
- ✅ Descriptions provide good context

### Limitations
- Tickets are recent (Oct-Nov 2024 only)
- Most tickets are completed status updates, not complex issues
- Few tickets have detailed troubleshooting threads

---

## 🎯 Success Metrics

After implementation, measure:

1. **Response Quality**
   - User satisfaction scores
   - "Was this helpful?" click rate
   - Time to find answer

2. **Citation Rate**
   - How often AI cites JIRA tickets
   - Which ticket types are most useful

3. **Support Reduction**
   - Fewer duplicate JIRA tickets created
   - Faster self-service resolution

---

**Status:** Ready for Phase 2 (Create Embeddings)  
**Owner:** Development Team  
**Timeline:** Can be completed in 1 day

