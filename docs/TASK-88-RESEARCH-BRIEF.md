# Task #88: Research - OpenAI Vector Store Migration to Supabase

**Created**: 2025-10-28
**Priority**: High
**Type**: Research & Architecture Planning
**Status**: Pending

---

## Context

**Current State**: Dual vector store architecture
- **OpenAI Assistant**: `asst_VvOHL1c4S6YapYKun4mY29fM`
  - Vector Store: `vs_68a6c6337b10819194ce40498ca7dd6a`
  - Contains: ~150 AOMA knowledge base documents
  - Used as: Fallback when Supabase returns no results
  - Speed: 2-5 seconds per query

- **Supabase pgvector**: `aoma_unified_vectors` table
  - Contains: 28 AOMA docs + 15,085 Jira tickets
  - Used as: Primary/fast path
  - Speed: <100ms per query

**Current Orchestrator Flow**:
```typescript
// Line 542-577 in aomaOrchestrator.ts
1. Try Supabase vector store (fast)
2. If no results → Fallback to OpenAI Assistant (slow)
```

---

## Research Questions

### 1. Can we export vector embeddings OR re-render source documents from OpenAI?
**CRITICAL**: This is TWO different approaches:

**Option A: Export Vector Embeddings** (Ideal)
- ✅ Faster (no re-embedding)
- ✅ Cheaper ($0 cost)
- ❓ **Unknown**: Does OpenAI Assistant API expose embeddings?
- ❓ **Unknown**: Can we retrieve vectors from vector store?

**Option B: Re-Render Source Documents** (Fallback)
- ✅ Definitely possible (files are stored)
- ❌ Slower (need to re-embed ~150 docs)
- ❌ Cost: ~$0.10 for new embeddings
- ✅ Gives us fresh embeddings with latest model

**Action**: Research OpenAI Assistant API capabilities for BOTH options

### 2. Can we migrate to Supabase pgvector?
- ✅ **YES** - Already proven with Jira migration (15,085 docs)
- ✅ Supabase supports 1536-dim vectors (OpenAI embedding size)
- ✅ Have working migration scripts

**Action**: Adapt existing `migrate-jira-to-unified.js` for AOMA

### 3. Would this eliminate need for LangChain?
- ❓ **UNCLEAR** - Need to check current LangChain usage
- 📊 Current usage: Only 3 references in codebase
- 📊 Not in package.json dependencies (checked)
- 🤔 Orchestrator mentions "LangChain agents" but may not use library

**Action**: Audit codebase for actual LangChain dependencies

### 4. What would be the performance impact?
**Expected**: 3-10x faster for AOMA queries

**Current**:
- Supabase try: 80ms → 0 results
- OpenAI fallback: 2500ms
- **Total**: 2580ms

**After Migration**:
- Supabase query: 80ms → 10 relevant docs
- GPT-4/GPT-5 synthesis: 400-600ms
- **Total**: 480-680ms (4-5x faster!)

### 5. What would be the cost impact?
**Current Monthly** (estimated):
- 600 queries/day fallback to Assistant @ $0.015 = $9/day
- Monthly: ~$270

**After Migration** (no fallback):
- Supabase queries: Free
- GPT-4 synthesis: $0.015/query × 1000 = $15/day
- Monthly: ~$450

**With 70% caching**:
- Cached: 700 queries/day = $0
- Uncached: 300 queries @ $0.015 = $4.50/day
- Monthly: ~$135 (50% savings!)

### 6. How would this work with future GPT-5?
**Perfect alignment!** See `docs/GPT5-SUPABASE-MIGRATION-ANALYSIS.md`

With GPT-5:
- Unified Supabase store (150 AOMA + 15K Jira)
- GPT-5 direct API (no Assistant overhead)
- Expected: 300-800ms total (3-10x faster)
- Simpler architecture
- Better cost control

---

## Strategic Analysis

### Option A: Migrate Now
**Pros**:
- ✅ Immediate 4-5x speed improvement
- ✅ Eliminates dual-system complexity
- ✅ Single source of truth
- ✅ Better caching opportunities
- ✅ Positions for GPT-5 migration

**Cons**:
- ⚠️ Migration effort (estimate: 4-6 hours)
- ⚠️ Risk of data loss (mitigate: test migration)
- ⚠️ Need to regenerate embeddings (~$0.10 cost)

### Option B: Wait for GPT-5
**Pros**:
- ✅ Migrate once with GPT-5 benefits
- ✅ Current system works
- ✅ Less immediate risk

**Cons**:
- ❌ Continue paying for slow queries
- ❌ GPT-5 timeline unknown (2-6 months?)
- ❌ Miss immediate improvements

### Option C: Hybrid Approach (RECOMMENDED)
**Phase 1: Prepare Now**
- Migrate AOMA docs to Supabase
- Keep Assistant as backup for 30 days
- A/B test with feature flags
- Validate performance

**Phase 2: When GPT-5 Launches**
- Switch to GPT-5 + Supabase
- Deprecate Assistant completely
- Optimize prompts for GPT-5

**Pros**:
- ✅ Lower risk (gradual rollout)
- ✅ Immediate speed benefits
- ✅ Easy rollback if issues
- ✅ Smooth path to GPT-5

---

## Technical Feasibility

### Migration Steps (Estimated)

1. **Extract AOMA content from OpenAI** (30 min)
   ```bash
   node scripts/export-openai-assistant-files.js
   # Output: data/aoma-docs/*.txt
   ```

2. **Generate embeddings** (20 min + $0.10)
   ```bash
   node scripts/generate-aoma-embeddings.js
   # Uses OpenAI text-embedding-3-small
   ```

3. **Insert into Supabase** (10 min)
   ```bash
   node scripts/migrate-aoma-to-supabase.js
   # Similar to Jira migration script
   ```

4. **Test vector search** (30 min)
   ```bash
   # Verify 28 → 150 AOMA docs in Supabase
   # Test queries return correct results
   # Compare quality vs Assistant
   ```

5. **Update orchestrator** (1 hour)
   ```typescript
   // Remove or flag fallback logic
   // Log metrics for comparison
   ```

6. **Monitor for 1 week** (ongoing)
   ```bash
   # Track: speed, quality, errors
   # Compare: new vs old system
   ```

**Total Time**: ~4-6 hours
**Total Cost**: ~$0.10 (embeddings)

---

## Risk Assessment

### High Risk Items
1. **Data Loss**: Lose AOMA content during migration
   - **Mitigation**: Backup OpenAI files first, test migration

2. **Quality Degradation**: Supabase results worse than Assistant
   - **Mitigation**: A/B test, keep Assistant as backup for 30 days

### Medium Risk Items
3. **Performance Not As Expected**: Still slow after migration
   - **Mitigation**: Optimize Supabase indexes, adjust match thresholds

4. **Cost Increase**: Higher than projected
   - **Mitigation**: Implement caching, monitor daily

### Low Risk Items
5. **LangChain Dependency**: Breaking changes
   - **Impact**: Minimal (only 3 references in codebase)

---

## Deliverables

### 1. Technical Feasibility Report
**Status**: This document + testing needed

**Tests Required**:
- [ ] Can extract files from OpenAI Assistant?
- [ ] Can generate embeddings for ~150 docs?
- [ ] Can insert into Supabase without errors?
- [ ] Does vector search return similar quality?
- [ ] Is performance actually faster?

### 2. Architecture Comparison
**Status**: See `docs/CORRECTED-ANALYSIS-2025-10-28.md`
**See Also**: `docs/GPT5-SUPABASE-MIGRATION-ANALYSIS.md`

### 3. Migration Plan
**Status**: Outlined above, needs validation

### 4. Cost-Benefit Analysis
**Summary**:
- **Cost**: ~$0.10 (one-time) + 4-6 hours dev time
- **Benefit**: 4-5x speed improvement + 50% cost savings (with cache)
- **ROI**: Positive within 1 week

### 5. Risk Assessment
**Status**: Documented above

### 6. Timeline Recommendation
**Recommended**: Option C (Hybrid Approach)
- **Phase 1**: Now (1 week)
- **Phase 2**: When GPT-5 launches (2-6 months)

---

## Next Actions

### Immediate (Research Phase)
1. ✅ Create this task in Task Master
2. ✅ Document research questions
3. ⏳ Test OpenAI file extraction
4. ⏳ Verify embedding generation works
5. ⏳ Test small migration (5 docs)

### If Feasible (Implementation Phase)
6. ⏳ Full AOMA migration (150 docs)
7. ⏳ Update orchestrator with feature flags
8. ⏳ A/B test with 10% traffic
9. ⏳ Monitor for 1 week
10. ⏳ Scale to 100% if successful

### Future (GPT-5 Phase)
11. ⏳ Integrate GPT-5 when available
12. ⏳ Deprecate OpenAI Assistant
13. ⏳ Optimize prompts for GPT-5

---

## Related Tasks

- **Task #68**: Jira Integration (✅ COMPLETE) - Proves migration feasibility
- **Task #72**: Update Orchestrator - May need updates after migration
- **Task #67**: Vectorize AOMA - Actually about completing Supabase migration
- **Task #87**: AOMA Screenshots - Independent, can proceed in parallel

---

## Questions for User

1. **Do we have the source files for the 150 AOMA docs?**
   - If yes: Easier migration (skip OpenAI extraction)
   - If no: Need to extract from OpenAI Assistant

2. **What's our risk tolerance?**
   - High: Migrate now, fast iteration
   - Medium: Hybrid approach (recommended)
   - Low: Wait for GPT-5

3. **What's our timeline for GPT-5?**
   - Affects whether we migrate now or wait

4. **Do we care about LangChain dependency?**
   - If yes: Good opportunity to remove it
   - If no: Can keep if useful

---

## Success Criteria

### Must Have
- ✅ All 150 AOMA docs in Supabase
- ✅ Vector search returns relevant results
- ✅ Performance < 1000ms for AOMA queries
- ✅ No data loss
- ✅ Zero production errors

### Should Have
- ✅ Performance < 500ms (4x improvement)
- ✅ Cost savings > 30%
- ✅ Feature flags for easy rollback
- ✅ Metrics dashboard for monitoring

### Nice to Have
- ✅ Remove LangChain dependency
- ✅ Implement hybrid search
- ✅ Add re-ranking
- ✅ 80%+ cache hit rate

---

## Constraints

**DO NOT**:
- ❌ Write production code yet (research phase)
- ❌ Deploy to production without testing
- ❌ Delete OpenAI Assistant (keep as backup)
- ❌ Break existing functionality

**DO**:
- ✅ Test thoroughly in development
- ✅ Document all findings
- ✅ Create rollback plan
- ✅ Get user approval before migration

---

**Last Updated**: 2025-10-28 22:30 UTC
**Status**: Research phase - awaiting user decision
**Estimated Effort**: 4-6 hours for full migration
**Estimated Timeline**: 1 week (with testing)
