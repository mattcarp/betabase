# AOMA Unified Vector Store Architecture

## Performance Optimization Through Intelligent Data Consolidation

**Version:** 1.0  
**Date:** August 21, 2025  
**Authors:** Matt & Claude (Team Effort! 🚀)

---

## Executive Summary

This document outlines a hybrid architecture that combines a unified Supabase vector store with intelligent orchestration to dramatically improve AOMA query response times while maintaining comprehensive multi-source data access.

**Current Problem:** Disparate endpoint calls causing 25+ second response times  
**Proposed Solution:** Single vector store + smart orchestration = sub-second responses  
**Expected Performance Gain:** 95%+ latency reduction

---

## Architecture Overview

### Current State (Distributed)

```
Query → Orchestrator → Multiple External Endpoints
                    ├─ AOMA Knowledge Base (HTTP)
                    ├─ Jira API (HTTP)
                    ├─ Git Repositories (HTTP)
                    ├─ Outlook/Email (HTTP)
                    └─ System Metrics (HTTP)
Total Latency: 25-45 seconds
```

### Proposed State (Unified)

```
Query → Smart Orchestrator → Unified Vector Store (Local)
                          └─ Embedded Multi-Source Data
                              ├─ AOMA Docs (vectorized)
                              ├─ Jira Issues (vectorized)
                              ├─ Git Commits (vectorized)
                              ├─ Email Context (vectorized)
                              └─ System Telemetry (vectorized)
Target Latency: <1 second
```

---

## Technical Specification

### 1. Unified Vector Store Schema

**Database:** Supabase with pgvector extension

```sql
-- Main unified vectors table
CREATE TABLE aoma_unified_vectors (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  embedding VECTOR(1536), -- OpenAI ada-002 dimensions
  source_type TEXT NOT NULL, -- 'knowledge', 'jira', 'git', 'email', 'metrics'
  source_id TEXT NOT NULL, -- Original record ID
  metadata JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX ON aoma_unified_vectors USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX ON aoma_unified_vectors (source_type);
CREATE INDEX ON aoma_unified_vectors USING gin (metadata);

-- Source freshness tracking
CREATE TABLE aoma_source_sync (
  source_type TEXT PRIMARY KEY,
  last_sync TIMESTAMP WITH TIME ZONE,
  sync_status TEXT, -- 'success', 'error', 'in_progress'
  records_count INTEGER,
  error_message TEXT
);
```

### 2. Data Ingestion Pipeline

```typescript
// Data ingestion service
class AOMADataIngestionService {
  async syncAllSources(): Promise<void> {
    const sources = [
      new AOMAKnowledgeIngestion(),
      new JiraTicketIngestion(),
      new GitCommitIngestion(),
      new EmailContextIngestion(),
      new SystemMetricsIngestion(),
    ];

    await Promise.all(sources.map((source) => source.syncToVectorStore()));
  }

  async syncSource(sourceType: string): Promise<SyncResult> {
    const embedding = await this.generateEmbedding(content);

    await supabase.from("aoma_unified_vectors").upsert({
      content,
      embedding,
      source_type: sourceType,
      source_id: originalId,
      metadata: enrichedMetadata,
    });
  }
}
```

### 3. Enhanced Orchestrator

```typescript
// Updated orchestrator with vector store integration
export class AOMAOrchestratorV2 {
  async executeOrchestration(query: string): Promise<any> {
    // 1. Analyze query to determine relevant source types
    const relevantSources = this.analyzeQuerySources(query);

    // 2. Generate query embedding
    const queryEmbedding = await this.generateQueryEmbedding(query);

    // 3. Vector search with source filtering
    const vectorResults = await supabase
      .from("aoma_unified_vectors")
      .select("content, source_type, metadata, embedding")
      .match({ source_type: { in: relevantSources } })
      .vectorSearch("embedding", queryEmbedding)
      .limit(50);

    // 4. Apply intelligent synthesis
    return await this.synthesizeResponse(query, vectorResults.data);
  }

  private analyzeQuerySources(query: string): string[] {
    const lowerQuery = query.toLowerCase();
    const sources = [];

    // Smart source selection based on query analysis
    if (lowerQuery.includes("jira") || lowerQuery.includes("ticket")) {
      sources.push("jira");
    }
    if (lowerQuery.includes("commit") || lowerQuery.includes("git")) {
      sources.push("git");
    }
    if (lowerQuery.includes("email") || lowerQuery.includes("communication")) {
      sources.push("email");
    }

    // Always include knowledge base for AOMA queries
    sources.push("knowledge");

    return sources;
  }
}
```

### 4. Progressive Enhancement Features

```typescript
// Progressive response system
class ProgressiveResponseSystem {
  async getProgressiveResponse(query: string) {
    // Phase 1: Immediate cached response
    const cachedResponse = await this.getCachedResponse(query);
    if (cachedResponse) {
      yield { phase: 'cached', data: cachedResponse, confidence: 0.8 };
    }

    // Phase 2: Fast vector search
    const vectorResponse = await this.vectorSearch(query);
    yield { phase: 'vector', data: vectorResponse, confidence: 0.9 };

    // Phase 3: Enhanced synthesis (if needed)
    if (query.complexity > 0.7) {
      const enhancedResponse = await this.enhancedSynthesis(query, vectorResponse);
      yield { phase: 'enhanced', data: enhancedResponse, confidence: 0.95 };
    }
  }
}
```

---

## Implementation Plan

### Phase 1: Foundation (Week 1-2)

- [ ] Set up Supabase vector store with schema
- [ ] Create data ingestion framework
- [ ] Build AOMA knowledge base vectorization

### Phase 2: Multi-Source Integration (Week 3-4)

- [ ] Implement Jira ticket ingestion
- [ ] Add Git commit vectorization
- [ ] Build email context extraction

### Phase 3: Smart Orchestration (Week 5-6)

- [ ] Update orchestrator for vector store queries
- [ ] Implement intelligent source selection
- [ ] Add progressive response streaming

### Phase 4: Optimization & Monitoring (Week 7-8)

- [ ] Performance monitoring dashboard
- [ ] Query optimization and caching
- [ ] A/B testing against current system

---

## Performance Expectations

| Metric                | Current | Target | Improvement    |
| --------------------- | ------- | ------ | -------------- |
| Average Response Time | 25s     | <1s    | 96% faster     |
| P95 Response Time     | 45s     | <2s    | 95% faster     |
| Multi-source Queries  | 30s+    | <1.5s  | 95% faster     |
| Cache Hit Ratio       | ~20%    | >80%   | 4x improvement |

---

## Success Metrics

1. **Performance:** Sub-second response times for 95% of queries
2. **Accuracy:** Maintain or improve response quality with multi-source synthesis
3. **Scalability:** Handle 10x query volume without performance degradation
4. **Reliability:** 99.9% uptime with graceful fallback mechanisms

---

## Risk Mitigation

- **Data Freshness:** Automated sync monitoring with alerts
- **Vector Quality:** Embedding quality tests and validation
- **Fallback Strategy:** Graceful degradation to current system if needed
- **Storage Costs:** Intelligent data lifecycle management

---

## Next Steps

1. **Immediate:** Begin Supabase vector store setup
2. **Ongoing:** Weekly performance reviews and optimization

---

_This architecture represents a significant leap forward in AOMA system performance while maintaining the sophisticated multi-source intelligence that makes our responses valuable. Let's build this together! 🚀_
