# 🚀 TIER 2: Medium-Effort Optimizations

**Estimated Impact**: 30-50% additional improvement (on top of Tier 1's 60-80%)  
**Estimated Effort**: 8-12 hours of development  
**Prerequisites**: Tier 1 complete ✅

---

## Overview: What Makes Tier 2 Different?

**Tier 1** was about caching and preventing duplicate work.  
**Tier 2** is about **intelligence** - making smarter decisions about:
- **WHERE** to look for answers (semantic routing)
- **HOW** to deliver results (streaming vs. batch)
- **WHEN** to fetch data (prefetching)

---

## 1. 🎯 Semantic Query Routing

**Problem**: Right now, we query BOTH Supabase and OpenAI for EVERY query, even when we know one source will have better results.

**Solution**: Use lightweight query classification to route intelligently.

### Examples
```typescript
// Jira-specific queries → ONLY Supabase (save 2-5s OpenAI call)
"Show me tickets assigned to me"
"What's the status of SIAM-1234?"
"List all open bugs"

// Documentation queries → ONLY OpenAI (save 100ms Supabase call)
"How do I submit an asset?"
"What are the asset categories?"
"Explain the AOMA workflow"

// Hybrid queries → BOTH (current behavior)
"What issues are there with asset submission?"
"Show me recent tickets about workflow problems"
```

### Implementation Plan

#### Step 1: Create Query Classifier (`src/services/queryClassifier.ts`)
```typescript
type QueryIntent = 'jira-only' | 'docs-only' | 'hybrid';

class QueryClassifier {
  classify(query: string): QueryIntent {
    const lowerQuery = query.toLowerCase();
    
    // Jira-only indicators
    const jiraKeywords = ['ticket', 'jira', 'assigned', 'bug', 'issue', 'sprint', 'epic'];
    const hasJiraKey = /[A-Z]+-\d+/.test(query); // e.g., SIAM-1234
    
    if (jiraKeywords.some(k => lowerQuery.includes(k)) || hasJiraKey) {
      return 'jira-only';
    }
    
    // Docs-only indicators
    const docsKeywords = ['how to', 'what is', 'explain', 'documentation', 'guide', 'tutorial'];
    if (docsKeywords.some(k => lowerQuery.includes(k))) {
      return 'docs-only';
    }
    
    // Default to hybrid for safety
    return 'hybrid';
  }
}
```

#### Step 2: Update Orchestrator (`src/services/aomaOrchestrator.ts`)
```typescript
// In executeOrchestrationInternal method:

const intent = queryClassifier.classify(query);

if (intent === 'jira-only') {
  // Skip OpenAI, only query Supabase
  const supabaseResult = await this.queryVectorStore(query, { sourceTypes: ['jira'] });
  return { sources: supabaseResult.sources, response: supabaseResult.response };
}

if (intent === 'docs-only') {
  // Skip Supabase, only query OpenAI
  const openaiResult = await this.callAOMATool("query_aoma_knowledge", { query });
  return openaiResult;
}

// Otherwise, use existing parallel hybrid logic
```

**Expected Impact**: 20-30% faster for specialized queries

---

## 2. 📡 Progressive Streaming Results

**Problem**: Users wait for BOTH sources to complete before seeing ANY results (2-5s wait).

**Solution**: Stream results as they arrive - show Supabase results immediately (100ms), then append OpenAI results (2-5s later).

### User Experience Improvement
```
Before (Tier 1):
[5s wait] → All results appear at once

After (Tier 2):
[100ms] → Supabase results appear (3-5 items)
[2-5s] → OpenAI results append (5-7 more items)
```

### Implementation Plan

#### Step 1: Update Orchestrator to Stream
```typescript
async executeOrchestrationInternal(
  query: string,
  normalizedQuery: string,
  cacheKey: string,
  progressCallback?: (update: any) => void
): Promise<any> {
  
  // Start Supabase query (fast)
  const supabasePromise = this.queryVectorStore(query, { ... });
  
  // Send immediate progress update
  progressCallback?.({ 
    phase: 'supabase_complete', 
    sources: await supabasePromise 
  });
  
  // Start OpenAI query (slower)
  const openaiPromise = this.callAOMATool("query_aoma_knowledge", { query });
  
  // Wait for OpenAI
  const openaiResult = await openaiPromise;
  
  // Send final merged result
  const merged = resultMerger.mergeResults(
    (await supabasePromise).sources,
    openaiResult.sources
  );
  
  progressCallback?.({ 
    phase: 'all_complete', 
    sources: merged 
  });
  
  return { sources: merged };
}
```

#### Step 2: Update Chat API to Handle Streams
```typescript
// In app/api/chat/route.ts

aomaOrchestrator.executeOrchestration(queryString, (update) => {
  if (update.phase === 'supabase_complete') {
    // Stream first batch of sources to client
    stream.write(`data: ${JSON.stringify({ sources: update.sources })}\n\n`);
  }
  
  if (update.phase === 'all_complete') {
    // Stream final merged sources
    stream.write(`data: ${JSON.stringify({ sources: update.sources })}\n\n`);
  }
});
```

**Expected Impact**: Perceived 80% faster (users see results in 100ms instead of 2-5s)

---

## 3. 🔮 Smart Prefetching

**Problem**: We only fetch data AFTER the user asks a question.

**Solution**: Predict likely follow-up queries and prefetch their results.

### Examples
```
User asks: "What is AOMA?"
Prefetch: "How do I use AOMA?", "AOMA documentation", "AOMA workflow"

User asks: "Show me my tickets"
Prefetch: "Ticket SIAM-1234 details", "Open bugs", "Recent updates"
```

### Implementation Plan

#### Step 1: Create Prefetch Service (`src/services/prefetchService.ts`)
```typescript
class PrefetchService {
  predictFollowUps(query: string, initialResults: any[]): string[] {
    // Use simple heuristics or LLM to predict likely follow-ups
    
    if (query.includes('what is')) {
      return [
        query.replace('what is', 'how to use'),
        query.replace('what is', 'documentation for'),
      ];
    }
    
    // Extract entities from results and build follow-ups
    const entities = this.extractEntities(initialResults);
    return entities.map(e => `Tell me more about ${e}`);
  }
  
  async prefetch(queries: string[]) {
    // Silently fetch and cache results in background
    queries.forEach(q => {
      aomaOrchestrator.executeOrchestration(q).catch(() => {
        // Ignore errors - prefetch is best-effort
      });
    });
  }
}
```

#### Step 2: Trigger Prefetch After Response
```typescript
// In app/api/chat/route.ts, after sending response:

const followUps = prefetchService.predictFollowUps(userQuery, sources);
prefetchService.prefetch(followUps); // Fire and forget
```

**Expected Impact**: 90%+ of follow-up queries served from cache (5ms instead of 2-5s)

---

## 4. 🗄️ Supabase Query Optimization

**Problem**: Supabase vector queries could be faster with better indexes and query strategies.

**Solution**: Add specialized indexes and optimize query parameters.

### Implementation Plan

#### Step 1: Create HNSW Index (Migration SQL)
```sql
-- Current index uses ivfflat (slower)
-- Upgrade to HNSW (faster, more accurate)

CREATE INDEX IF NOT EXISTS documents_embedding_hnsw_idx 
ON documents 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Drop old ivfflat index
DROP INDEX IF EXISTS documents_embedding_idx;
```

#### Step 2: Optimize Match Parameters
```typescript
// In lib/supabase.ts

// Before: Conservative settings
matchThreshold: 0.40,
matchCount: 10

// After: Optimized settings
matchThreshold: 0.35, // Lower threshold = more recall
matchCount: 5,        // Fewer results = faster query
```

#### Step 3: Add Query Result Caching at DB Level
```sql
-- Enable Supabase prepared statement caching
ALTER DATABASE postgres SET plan_cache_mode = force_generic_plan;
```

**Expected Impact**: 20-30% faster Supabase queries (100ms → 70ms)

---

## 5. 🧠 Adaptive Strategy Selection

**Problem**: We use the same "rapid" strategy for all queries, even complex ones that need comprehensive search.

**Solution**: Automatically select strategy based on query complexity.

### Examples
```
Simple query: "What is AOMA?" → rapid (1 source, fast)
Medium query: "Explain asset workflow" → focused (2 sources, balanced)
Complex query: "Compare all submission methods" → comprehensive (3+ sources, thorough)
```

### Implementation Plan

#### Step 1: Query Complexity Analyzer
```typescript
class QueryAnalyzer {
  analyzeComplexity(query: string): 'simple' | 'medium' | 'complex' {
    const wordCount = query.split(' ').length;
    const hasComparison = /compare|difference|versus|vs\./.test(query.toLowerCase());
    const hasMultipleConcepts = (query.match(/and|or|also/gi) || []).length > 1;
    
    if (hasComparison || hasMultipleConcepts || wordCount > 20) {
      return 'complex';
    }
    
    if (wordCount > 10) {
      return 'medium';
    }
    
    return 'simple';
  }
  
  selectStrategy(complexity: 'simple' | 'medium' | 'complex'): Strategy {
    const strategies = {
      simple: 'rapid',
      medium: 'focused',
      complex: 'comprehensive'
    };
    return strategies[complexity];
  }
}
```

#### Step 2: Update Orchestrator
```typescript
// In executeOrchestrationInternal:

const complexity = queryAnalyzer.analyzeComplexity(query);
const strategy = queryAnalyzer.selectStrategy(complexity);

const result = await this.callAOMATool("query_aoma_knowledge", {
  query,
  strategy, // Dynamic strategy selection
});
```

**Expected Impact**: 15-25% improvement in answer quality for complex queries

---

## Implementation Priority

### Recommended Order:
1. **Semantic Query Routing** (2-3 hours) - Biggest immediate impact
2. **Progressive Streaming** (3-4 hours) - Best UX improvement
3. **Supabase Optimization** (1-2 hours) - Easy database tuning
4. **Smart Prefetching** (2-3 hours) - Excellent for power users
5. **Adaptive Strategy** (1-2 hours) - Nice polish

---

## Expected Combined Impact

**Tier 1 + Tier 2 Together**:
- **Cache hits**: 5ms (1000x faster) ✅
- **Jira-only queries**: 100ms (20x faster) 🆕
- **Docs-only queries**: 500ms (10x faster) 🆕
- **Hybrid queries**: 2-3s (similar, but streaming makes it feel instant) 🆕
- **Follow-up queries**: 5ms cached (200x faster) 🆕

**Overall**: 70-85% reduction in average perceived latency

---

## Testing Strategy

Once the Next.js build bug is resolved:

### 1. Semantic Routing Tests
```typescript
// Test Jira-only routing
"Show me SIAM-1234" → Should only query Supabase
"List open bugs" → Should only query Supabase

// Test docs-only routing
"What is AOMA?" → Should only query OpenAI
"How do I submit?" → Should only query OpenAI

// Test hybrid fallback
"Recent issues with workflow" → Should query BOTH
```

### 2. Streaming Tests
```typescript
// Watch network tab - should see TWO response chunks:
1. First chunk: Supabase results (100ms)
2. Second chunk: Merged results (2-5s)
```

### 3. Prefetch Tests
```typescript
// Ask a question, then immediately ask follow-up
// Second query should be < 10ms (cache hit from prefetch)
```

---

## Tier 3 Preview (High-Impact, Long-Term)

After Tier 2, consider:
- **Manual AOMA Migration**: Migrate OpenAI vector store to Supabase (if source docs available)
- **Embedding Fine-tuning**: Custom embeddings trained on AOMA/Jira data
- **LLM-Powered Query Rewriting**: Improve query understanding
- **Multi-model Routing**: Use different LLMs for different query types

---

**Created**: 2025-10-30  
**Prerequisites**: Tier 1 Complete ✅  
**Status**: Ready to implement (after testing blocker resolved)

