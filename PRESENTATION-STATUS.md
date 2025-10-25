# SIAM - Technical Deep Dive
## Meeting Intelligence Platform with MCP Integration

**Live Demo**: https://thebetabase.com
**Status**: ✅ Production Ready
**Date**: October 25, 2025

---

## Opening Context (2 min)

- Built intelligent dialogue system for enterprise knowledge management
- AOMA documentation assistant as proof of concept
- Focus today: architecture, MCP integration, what's technically interesting

---

## System Architecture Overview

**[DIAGRAM PLACEHOLDER: High-level architecture]**

### Core Components
- Next.js 15 frontend (React Server Components)
- Supabase PostgreSQL + pgvector for semantic search
- GPT-5 API integration (45% error reduction vs GPT-4)
- MCP (Model Context Protocol) server integration
- Streaming response pipeline

### Data Flow
1. User query → semantic search against vectorized docs
2. Retrieved contexts → LLM with structured prompt
3. Streaming response with source citations
4. MCP servers can inject live data (JIRA, Git, etc.)

**[DIAGRAM PLACEHOLDER: Request flow diagram]**

---

## MCP Integration - The Interesting Part

### What is MCP?
- Anthropic's Model Context Protocol
- Lets LLMs interact with external tools/data sources
- Think: function calling, but with persistent connections

### Our Implementation
- JIRA MCP server: query tickets, create issues, update status
- GitHub MCP server: search code, read files, analyze commits
- Supabase MCP server: direct database queries
- Custom AOMA scraper MCP server

**[DIAGRAM PLACEHOLDER: MCP server architecture]**

### Technical Challenges Solved
- Authentication flow: hybrid Playwright + Firecrawl approach
- Session management across MCP connections
- Rate limiting and caching strategy
- Error handling when MCP servers timeout/fail

### Live Demo Components
- Ask about JIRA tickets related to specific feature
- Query GitHub commits for implementation details
- Cross-reference documentation with actual code

---

## Anti-Hallucination Architecture

### The Problem
- RAG systems still hallucinate
- LLMs confident about wrong information
- Citations don't guarantee accuracy

### Our Approach
- Retrieval-first: only answer from vectorized docs
- Explicit "I don't know" training
- Source attribution on every claim
- Test suite: 20+ adversarial questions

### Technical Implementation
```
Prompt structure:
1. System: "Only use provided context, admit gaps"
2. Context: <retrieved_chunks>
3. User query
4. Constraint: "If not in context, say so"
```

### Testing Strategy
- Automated test: ask about non-existent features
- Verify model responds "no information available"
- Red team test: trick questions (teleportation feature)
- Monitor: log all "I don't know" responses for accuracy

---

## Live Demo Flow

### Setup
- Production site: https://thebetabase.com
- AOMA documentation loaded (~50 pages)
- MCP servers running locally (show terminal)

### Demo Sequence

**1. Basic RAG Query**
- "What is AOMA?"
- Show: streaming response, source citations
- Point out: response time (<2s), citation accuracy

**2. MCP Integration**
- "Show me JIRA tickets related to AOMA migration"
- Demonstrates: live data integration, not just static docs
- Show: MCP server logs, API calls

**3. Cross-Reference Query**
- "Compare AOMA2 vs AOMA3 architecture"
- Show: synthesis across multiple doc sources
- Highlight: structured comparison, no hallucination

**4. Anti-Hallucination Test**
- "Does AOMA have a blockchain integration?"
- Expected: "No information about blockchain in AOMA docs"
- Point out: doesn't fabricate features

**5. Code Integration** (if time)
- "Find the authentication implementation in our codebase"
- Uses: GitHub MCP server
- Show: actual code snippets, file locations

---

## Testing Infrastructure

### Test Coverage
- 59 production tests (Playwright + Vitest)
- Visual regression testing
- MCP integration tests
- Anti-hallucination validation suite
- Console error monitoring (currently: 0 errors)

### CI/CD Pipeline
- Deploy to Render.com on merge to main
- Automated test run on every deployment
- Performance benchmarks tracked
- Rollback strategy if tests fail

**[DIAGRAM PLACEHOLDER: Testing pyramid]**

### Interesting Technical Bits
- Vitest UI mode for interactive debugging
- Custom Playwright reporters for MCP calls
- Network log capture during tests
- Screenshot diffing with threshold tuning

---

## Technical Stack Choices

### Why These Technologies?

**Next.js 15**
- React Server Components: reduced client bundle
- Streaming responses: better UX for LLM
- Built-in API routes for MCP server proxy

**Supabase**
- pgvector: native PostgreSQL extension
- Real-time subscriptions (future: collaborative sessions)
- Row-level security for multi-tenant

**GPT-5**
- 45% fewer errors vs GPT-4 (OpenAI benchmark)
- Better instruction following
- Improved citation accuracy

**MCP**
- Standardized protocol vs custom integrations
- Community ecosystem of servers
- Better than function calling for persistent connections

---

## Challenges & Solutions

### Challenge 1: AOMA Authentication
- Problem: Sony's SSO + CAPTCHA
- Solution: Playwright automation + Firecrawl fallback
- Trade-off: slower but reliable

### Challenge 2: Context Window Management
- Problem: 50-page docs exceed context limits
- Solution: semantic chunking + relevance scoring
- Result: top 5 chunks typically sufficient

### Challenge 3: MCP Server Reliability
- Problem: servers crash, timeout, rate-limit
- Solution: graceful degradation, retry logic, caching
- Monitor: Sentry for MCP errors

### Challenge 4: Testing Streaming Responses
- Problem: Playwright doesn't handle SSE well
- Solution: custom event listener, buffer streaming chunks
- Verify: complete response received, no truncation

---

## What's Next

### Near-term (Next Sprint)
- Multi-document RAG: query across multiple systems
- Conversation memory: context across queries
- Advanced MCP: write operations (create JIRA tickets from chat)

### Medium-term
- Voice interface: real-time audio transcription
- Multi-modal: analyze diagrams, screenshots
- Collaborative sessions: multiple users, shared context

### Research Interests
- Better citation granularity (paragraph vs document)
- Hybrid search: vector + keyword + graph
- Cost optimization: local embedding models
- Agent orchestration: multi-step reasoning with MCP tools

---

## Recording Strategy - Hybrid Control

### Screen Flow Map

**Section 1: Opening + Architecture Diagrams (3-4 min)**
- Control: Manual
- Screen: Slides/diagrams
- Tools: Keynote, Excalidraw, or PowerPoint
- Show: Architecture diagram, MCP flow diagram, data flow
- Recording: Screen share slides, camera in corner

**Section 2: MCP Servers Running (2-3 min)**
- Control: Manual (authenticity important)
- Screen: Terminal split view
- Show:
  - Terminal 1: MCP servers running
  - Terminal 2: Live logs streaming
  - VS Code: Quick peek at MCP config
- Talk: "These are the actual MCP servers - JIRA, GitHub, Supabase..."
- Why manual: Shows it's real, not faked

**Section 3: Live Web App Demo (8-10 min)**
- Control: **PLAYWRIGHT AUTOMATION**
- Screen: Browser at https://thebetabase.com
- Script: `tests/demo-recording.spec.ts`
- Queries:
  1. "What is AOMA?" → streaming response, citations
  2. "Show me JIRA tickets related to AOMA migration" → MCP integration
  3. "Compare AOMA2 vs AOMA3 architecture" → synthesis
  4. "Does AOMA have a blockchain integration?" → anti-hallucination
  5. (Optional) "Find authentication implementation" → GitHub MCP
- Why Playwright:
  - Perfect execution, no typos
  - Pause/resume for narration control
  - Shows testing infrastructure
  - Re-recordable if needed

**Section 4: Testing Infrastructure (3-4 min)**
- Control: Manual
- Screen: Vitest UI + Playwright HTML Reporter
- Show:
  - 59 passing tests in Vitest
  - Playwright report from demo script
  - Network tab with MCP calls
- Why manual: More impressive live navigation

**Section 5: Code Deep Dive (3-4 min)**
- Control: Manual
- Screen: VS Code
- Show:
  - Anti-hallucination prompt engineering
  - MCP integration code
  - Streaming response handler
- Keep brief: show, don't explain every line

### Recording Workflow

**Phase 1: Prepare Assets**
1. Create architecture diagrams (Excalidraw, Mermaid, or similar)
2. Write Playwright demo script with pause points
3. Start MCP servers, verify logs are visible
4. Open all tools in separate windows (Terminal, VS Code, Browser, Vitest UI)

**Phase 2: Record Segments**
- Use Descript's screen recording
- Record each section separately (easier to edit)
- Narrate naturally, pause for emphasis
- Playwright segments: narrate over automation
- No script reading - speak from bullet points

**Phase 3: Edit in Descript**
- Remove filler words (automatic)
- Delete mistakes from transcript
- Adjust pacing: speed up boring parts
- Add smooth transitions between sections
- Export with your timing, not scripted timing

### Playwright Demo Script Requirements

**Must support narrator control:**
- Configurable pauses between actions
- Visual indicators when waiting for narration
- Ability to resume on keypress (for timing flexibility)
- Slow, deliberate typing (looks more natural)
- Hover highlights on key UI elements

**Script structure:**
```typescript
// Helper for narrator-controlled pauses
const narratorPause = async (seconds: number) => {
  await page.waitForTimeout(seconds * 1000);
};

// Each demo step with built-in pauses
async function demoStep1(page) {
  await page.fill('[data-testid="chat-input"]', 'What is AOMA?', { delay: 50 });
  await narratorPause(2); // Pause for narration
  await page.click('[data-testid="send"]');
  await page.waitForSelector('[data-testid="streaming-response"]');
  await narratorPause(5); // Let response stream while narrating
}
```

---

## Demo Logistics

### URLs & Access
- Production: https://thebetabase.com
- Test account: siam-test-x7j9k2p4@mailinator.com
- GitHub: [repo URL if sharing]
- MCP servers: localhost (show terminal)

### Backup Plan
- Screenshots of key interactions
- Screen recording if live demo fails
- Code walkthrough of interesting modules

### Questions to Anticipate
1. "How do you prevent prompt injection?" → Input sanitization + system prompt constraints
2. "What's the latency breakdown?" → 200ms retrieval + 1-2s GPT streaming
3. "Can it handle code as context?" → Yes, GitHub MCP server
4. "Multi-tenancy approach?" → Supabase RLS + namespace isolation
5. "Cost per query?" → ~$0.02 (GPT-5) + negligible vector search

---

## Technical Metrics

**Performance**
- First token latency: <1s
- Full response: 1-3s (depends on length)
- Semantic search: ~200ms (pgvector indexed)
- MCP call overhead: ~500ms (network + auth)

**Reliability**
- Uptime: 99.x% (Render.com hosting)
- Test pass rate: 100% (59/59 passing)
- Console errors: 0 (verified in production)
- Failed MCP calls: graceful fallback to docs-only

**Quality**
- Citation accuracy: manual audit shows 95%+
- Hallucination rate: <5% (adversarial test suite)
- User satisfaction: N/A (not deployed to end users yet)

---

## Key Takeaways

**What's Cool Technically**
- MCP integration: live data + RAG in single interface
- Anti-hallucination: actually works, not just marketing
- Testing approach: comprehensive, automated, fast feedback

**What's Hard**
- Authentication flows: every enterprise system different
- Context window limits: always trade-off coverage vs precision
- MCP reliability: you're at mercy of external servers

**What's Valuable**
- Knowledge accessibility: instant vs hours of searching
- Synthesis capability: connects disparate sources
- Extensibility: add new MCP servers, instant new capabilities

---

**Last Updated**: October 25, 2025
**Status**: Ready for demo
**Estimated Duration**: 20-25 minutes with Q&A
