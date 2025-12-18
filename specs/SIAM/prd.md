# Product Requirements Document: SIAM - Smart Intelligence for Asset Management

> **Moved from**: `.taskmaster/docs/prd.txt`  
> **Last Updated**: 2025-12-16  
> **Status**: Active

## Project Overview

Transform the AOMA orchestration system from a distributed multi-endpoint architecture to a unified vector store approach, reducing response times from 25+ seconds to sub-second performance while maintaining comprehensive multi-source intelligence.

**SIAM** (Smart Intelligence for Asset Management) provides an AI-powered interface to AOMA (Asset and Offering Management Application) knowledge, featuring three core pillars:
1. **Chat** - Intelligent Q&A with multi-source RAG
2. **Curate** - RLHF feedback and document management
3. **Test** - Automated testing with human-in-the-loop review

## Business Goals

- Achieve 95%+ reduction in query response latency (25s → <1s)
- Maintain or improve response accuracy through intelligent multi-source synthesis
- Scale to handle 10x query volume without performance degradation
- Provide real-time access to AOMA knowledge across all data sources
- Enable continuous improvement via RLHF feedback loop

## User Personas

1. **AOMA Engineers**: Need fast access to technical documentation, system status, and integration details
2. **Support Teams**: Require quick resolution of user issues using comprehensive knowledge base
3. **Product Managers**: Want insights from Jira, Git commits, and system metrics for planning
4. **System Administrators**: Need real-time system health and performance data
5. **QA Engineers**: Need automated testing dashboards with human escalation workflows

## Functional Requirements

### Core Features

1. **Unified Vector Store**
   - Single Supabase database with pgvector extension
   - Consolidated embeddings from all AOMA data sources
   - Real-time data synchronization and freshness tracking

2. **Multi-Source Data Ingestion**
   - AOMA Knowledge Base vectorization
   - Jira ticket content embedding
   - Git commit history processing
   - Email/communication context extraction
   - System metrics and telemetry data

3. **Intelligent Orchestration**
   - Smart source selection based on query analysis
   - Vector similarity search with source filtering
   - Progressive response enhancement
   - Fallback to current system if needed

4. **Performance Optimization**
   - Response caching with intelligent invalidation
   - Query optimization and monitoring
   - Progressive loading for complex queries
   - Performance analytics dashboard

5. **RLHF/Curate System**
   - Thumbs up/down feedback collection
   - Star ratings for response quality
   - Document relevance toggling
   - Curator notes and annotations
   - Semantic deduplication at 85% threshold

6. **Automated Testing Dashboard**
   - Test result visualization
   - Human-in-the-loop review workflows
   - Self-healing test generation
   - Pass/fail trend analytics

### Technical Specifications

- **Database**: Supabase with pgvector (1536-dimensional embeddings)
- **Embedding Model**: OpenAI text-embedding-ada-002 / Gemini
- **Query Processing**: <1 second target for 95% of queries
- **Data Freshness**: Real-time sync with 5-minute maximum staleness
- **Scalability**: Support for 1000+ concurrent queries
- **Frontend**: Next.js 16+ with React 19, Vercel AI SDK v5
- **Authentication**: Cognito magic-link flow (bypassed for demo)

## User Experience Flow

### Current Experience
1. User asks AOMA question
2. System orchestrates multiple API calls (25+ seconds)
3. User receives consolidated response (if successful)

### Target Experience  
1. User asks AOMA question
2. Intelligent orchestrator queries unified vector store (<1 second)
3. System returns synthesized multi-source response immediately
4. Optional: Progressive enhancement for complex queries
5. User can provide feedback via Curate tab
6. Feedback improves future responses

## Success Metrics

- **Performance**: 95% of queries respond in <1 second
- **Accuracy**: Response quality scores maintain >90% satisfaction
- **Availability**: 99.9% uptime with graceful degradation
- **Adoption**: 100% migration from current distributed system
- **RLHF**: Measurable improvement in response quality over time

## Implementation Phases

### Phase 1: Foundation (2 weeks)
- Set up Supabase vector store infrastructure
- Create data ingestion framework
- Implement AOMA knowledge base vectorization

### Phase 2: Multi-Source Integration (2 weeks)
- Add Jira ticket ingestion pipeline
- Implement Git commit vectorization
- Build email context extraction

### Phase 3: Smart Orchestration (2 weeks)
- Update orchestrator for vector store queries
- Implement intelligent source selection algorithms
- Add progressive response streaming

### Phase 4: Optimization & Launch (2 weeks)
- Performance monitoring and analytics
- A/B testing against current system
- Full production deployment

## Risk Mitigation

- **Data Quality**: Automated embedding validation and quality checks
- **Performance**: Load testing and capacity planning
- **Reliability**: Graceful fallback to distributed system
- **Security**: Proper access controls and data encryption via Supabase RLS

## Dependencies

- Supabase instance with pgvector extension
- OpenAI/Gemini API access for embeddings
- Current AOMA system data sources (via aoma-mesh-mcp on Railway)
- ByteRover MCP for knowledge persistence
- Render.com for deployment

## Definition of Done

- Sub-second response times achieved for 95% of queries
- All data sources successfully integrated into vector store
- Performance monitoring dashboard operational
- Current system deprecated with successful migration
- Documentation and knowledge transfer completed
- Three-pillar demo successfully recorded

## User Stories

### Epic 1: Vector Store Foundation
- As an engineer, I want a unified data store so that queries don't timeout
- As a system admin, I want real-time sync monitoring so I know data is fresh
- As a developer, I want proper indexing so that queries are fast

### Epic 2: Multi-Source Intelligence  
- As a support agent, I want consolidated information so I can resolve issues quickly
- As a product manager, I want insights from all sources so I can make informed decisions
- As an AOMA user, I want comprehensive answers so I don't need to check multiple systems

### Epic 3: Performance Optimization
- As any user, I want instant responses so I can maintain my workflow
- As a system admin, I want performance monitoring so I can optimize the system
- As a developer, I want intelligent caching so the system scales efficiently

### Epic 4: RLHF & Continuous Improvement
- As a curator, I want to rate responses so the system improves
- As an admin, I want to upload documents so the knowledge base grows
- As a user, I want to see that my feedback matters

### Epic 5: Automated Testing
- As a QA engineer, I want automated test visualization so I can prioritize reviews
- As a developer, I want self-healing tests so maintenance burden decreases
- As a manager, I want ROI metrics so I can justify the testing investment

---

This unified approach will revolutionize AOMA system performance while maintaining the comprehensive intelligence that makes our responses valuable.










