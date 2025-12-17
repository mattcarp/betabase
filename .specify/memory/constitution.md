# The Betabase Constitution

## Overview

The Betabase is a QA intelligence platform that provides RAG-powered chat, test curation, and synthetic test generation for the AOMA (Asset & Order Management Application) system at Sony Music. This constitution defines the non-negotiable principles that govern all development.

---

## Core Principles

### I. Supabase-First Data Architecture

All vector data is stored in **Supabase PostgreSQL with pgvector extension**.

- **Primary table**: `siam_vectors` (legacy name, do not rename)
- **Embedding provider**: Gemini `text-embedding-004` (768 dimensions) as default
- **Embedding column**: `embedding_gemini` for Gemini, `embedding` for OpenAI fallback
- **NO OpenAI Vector Stores**: Never use OpenAI's file upload or vector store APIs for knowledge storage
- **Search function**: `match_siam_vectors_gemini` RPC for similarity search

### II. Multi-Tenant Context (NON-NEGOTIABLE)

Every database query MUST respect the tenant context:

```typescript
{
  organization: "sony-music",
  division: "digital-operations",  
  app_under_test: "aoma"
}
```

- All vectors are scoped by these three fields
- Never query without tenant context
- Use `DEFAULT_APP_CONTEXT` from `@/lib/supabase` as fallback

### III. RAG Quality Standards

Retrieval-Augmented Generation must follow these parameters:

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| **Chunk size** | ~1,800 characters | Optimal for Gemini embeddings |
| **Chunk overlap** | 200 characters (~11%) | Preserves context across chunks |
| **Match threshold** | 0.55 | Balance precision/recall |
| **Match count** | 15 results | Sufficient context for synthesis |
| **Context synthesis** | Top 8 results, 800 chars each | Pre-process before LLM |

- Always chunk large documents before embedding
- Use Gemini embeddings for BOTH documents AND queries (dimension match)
- Synthesize raw results into key insights before sending to main LLM

### IV. Session Continuity & Knowledge Persistence

Long-running agent work requires state management:

| File | Purpose | When to Update |
|------|---------|----------------|
| `claude-progress.txt` | Session-by-session log | END of every session |
| `features.json` | Feature tracking with backlog | When features complete |
| `ByteRover` | Cross-session knowledge | When learning patterns/solutions |

- Read progress files at START of every session
- Update progress files at END of every session
- Store reusable patterns in ByteRover for future retrieval

### V. Testing with Playwright

End-to-end testing is preferred over unit testing:

- Add `data-test-id` attribute to all interactive UI elements
- Prefer Playwright E2E tests over unit tests
- Avoid mocks and stubs - test against real services when possible
- Browser MCP can be used for visual verification

### VI. Demo Mode (No Authentication)

For development and demonstration:

- Use `NEXT_PUBLIC_BYPASS_AUTH=true` environment variable
- Never test authentication flows for demo purposes
- Demo environment: `localhost:3000` only
- Production (`siam-app.onrender.com`) has auth enabled - do not test there

---

## Technical Standards

### API Design

- All knowledge APIs under `/api/knowledge/*`
- Use proper HTTP methods (GET for read, POST for create, DELETE for remove)
- Return structured JSON with `success`, `error`, and `data` fields
- Include meaningful error messages with `details` when applicable

### Code Organization

- Services in `src/services/` - business logic
- API routes in `src/app/api/` - HTTP handlers only
- Components in `src/components/` - UI only
- No file should exceed 200 lines - refactor if necessary

### Git Workflow

- Use `git acm 'type(scope): message'` for commits
- Conventional commit format required
- Commit after each completed feature/fix
- Push with `git push origin $(git branch --show-current)`

---

## Source Types in Vector Store

| ID | Source Type | Description |
|----|-------------|-------------|
| 1 | `knowledge` | Documentation, specs, uploaded files |
| 2 | `jira` | Jira tickets (currently titles only) |
| 3 | `git` | Code commits and file changes |
| 4 | `email` | Email communications |
| 5 | `firecrawl` | Web crawl data (currently empty - needs re-crawl) |
| 6 | `metrics` | Performance metrics |

---

## What This Constitution Does NOT Cover

- Specific feature implementations (use specs for that)
- UI/UX design decisions (make them contextually)
- Third-party API integrations (document as needed)

---

*Last updated: 2025-12-17*
*Version: 1.0.0*
