## Knowledge Integration Demo Guide

This guide helps you demo SIAM's unified knowledge integration across code (Git), docs (Confluence/Firecrawl), and tickets (JIRA).

### Pre-Demo Checklist

- Knowledge sources indexed and fresh (git, confluence, jira, firecrawl)
- Sub-500ms query times on preset scenarios
- Stable access to Supabase and MCP (Railway) services
- Fallback screenshots or cached results ready

### Flow (Approx. 25 minutes)

1. Context (2m)

- Fragmented knowledge problem and SIAM solution overview
- Architecture highlights: MCP tools + Supabase vectors

2. Cross-Source Discovery (5m)

- Query: "How does AOMA handle file uploads?"
- Show combined results from code, docs, JIRA

3. Code Intelligence (4m)

- Query: "Show me the authentication flow in the codebase"
- Demonstrate precise code discovery and related files

4. Documentation Integration (4m)

- Query: "What are the recent changes to the asset ingestion workflow?"
- Highlight freshness and relevance scoring

5. Troubleshooting (4m)

- Query: "How to debug AOMA upload failures?"
- Synthesize code + docs + historical issues

6. Interactive (6m)

- Invite colleague queries and filter by source
- Show performance metrics and knowledge coverage

### Tips

- Emphasize speed (<500ms), relevance, and source attribution
- Explain embeddings/semantic search briefly when asked
- Mention access control and data privacy as needed

### Fallbacks

- Use `scripts/prepare-demo-scenarios.sh` output if live sources degrade
- Reference `tmp/demo/demo-scenarios.json` for expected results

### Useful Scripts

- Validate E2E: `scripts/validate-knowledge-integration.sh`
- Optimize vectors: `scripts/optimize-vector-performance.sh`
- Prepare scenarios: `scripts/prepare-demo-scenarios.sh`
