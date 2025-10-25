# SIAM - Technical Deep Dive
## Meeting Intelligence Platform with MCP Integration

**Live Demo**: https://thebetabase.com
**Status**: ✅ Production Ready
**Date**: October 25, 2025

---

## Opening Context (2 min)

- Built intelligent dialogue system for enterprise knowledge management
- AOMA documentation assistant as proof of concept
- Focus today: what makes this DIFFERENT from generic chatbots
- Teaser: AI testing infrastructure (59 tests, Playwright + Vitest) - but that's a separate video

---

## Points of Differentiation (WHY THIS MATTERS)

### 1. AOMA Mesh MCP Server ⭐⭐⭐⭐⭐
**The Killer Feature**
- Not scraping docs like everyone else
- Custom API integration with live AOMA systems
- Real-time system state, not historical documentation
- Persistent connection to production AOMA environment

**Demo Impact:**
- "What is the current state of AOMA production?" → LIVE data
- "Analyze integration health" → Real-time system status
- Most chatbots: static docs. Ours: living systems.

### 2. System Diagram Generation ⭐⭐⭐⭐
**Visual Intelligence**
- Most chatbots: text walls
- SIAM: actual visual diagrams (Mermaid, architecture flows)
- Transforms system knowledge into actionable visuals
- Technical audiences love diagrams

**Demo Impact:**
- "Generate a system architecture diagram for AOMA"
- "Show integration points between AOMA and downstream systems"
- See it create visual representations, not just describe them

### 3. System Introspection ⭐⭐⭐⭐⭐
**Genuinely Novel**
- Not just "what does the doc say about AOMA?"
- "What is AOMA's current health? Dependencies? Integration status?"
- Knowledge extracted from RUNNING systems via MCP
- Understands system topology, not just documentation

**Demo Impact:**
- "Analyze dependencies between AOMA and reporting systems"
- "What's the integration health status?"
- System intelligence, not document retrieval

### 4. Multi-System Cross-Reference ⭐⭐⭐⭐
**Enterprise Gold**
- "How do changes in AOMA3 impact reporting pipeline?"
- Requires MCP connections to multiple systems
- Synthesizes cross-system dependencies and impact analysis
- Connected knowledge, not isolated silos

**Demo Impact:**
- Shows understanding across system boundaries
- Impact analysis: "If we change X, what breaks?"
- Enterprise decision support, not just Q&A

### 5. Anti-Hallucination + Citations
**Table Stakes, But Critical**
- Honest "I don't know" responses
- Source citations on every claim
- 95%+ citation accuracy (manual audit)
- Trust through transparency

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

### Demo Sequence (DIFFERENTIATION FOCUSED)

**Opening Tease (30 seconds)**
- "This demo runs on our AI testing infrastructure..."
- "59 automated tests, Playwright + Vitest, full CI/CD..."
- "But testing is a different video. Today: unique capabilities..."

**1. Basic Context (Quick)**
- "What is AOMA?"
- Show: streaming response, source citations
- Narration: "Standard RAG response. Nothing special yet..."
- Keep brief: establishing baseline

**2. DIFFERENTIATION: AOMA Mesh MCP Server**
- Query: "What is the current state of the AOMA production environment?"
- Narration:
  - "Now the interesting part - LIVE data from AOMA systems"
  - "Not scraping docs - actual API integration via custom MCP server"
  - "The MCP maintains persistent connection to AOMA APIs"
  - "Real-time data, not historical documentation"
- Show: MCP server logs in terminal
- **POINT OF DIFFERENTIATION #1: Live system integration**

**3. DIFFERENTIATION: System Diagram Generation**
- Query: "Generate a system architecture diagram for AOMA showing all integration points"
- Narration:
  - "Most chatbots only return text. Watch this..."
  - "It's actually GENERATING a visual diagram"
  - "Mermaid diagrams, system flows, architecture visualizations"
  - "Transforms abstract knowledge into actionable visuals"
- Wait for diagram to render
- **POINT OF DIFFERENTIATION #2: Visual diagram generation**

**4. DIFFERENTIATION: System Introspection**
- Query: "Analyze the dependencies and integration health between AOMA and downstream systems"
- Narration:
  - "Here's where it gets really interesting"
  - "Not just answering questions about systems"
  - "Actually ANALYZING system relationships via MCP"
  - "It's interrogating the AOMA mesh MCP server"
  - "Understanding system topology, not just documentation"
  - "Knowledge from RUNNING systems, not static docs"
- **POINT OF DIFFERENTIATION #3: System introspection**

**5. Anti-Hallucination Test**
- Query: "Does AOMA have a quantum computing integration?"
- Narration:
  - "Let's test trustworthiness with a trick question"
  - "This feature doesn't exist - will it admit that?"
  - "Notice: honest 'no information available' response"
  - "Doesn't fabricate features or make up capabilities"
  - "Critical for enterprise trust"
- Show: honest response

**6. DIFFERENTIATION: Multi-System Cross-Reference**
- Query: "How do changes in AOMA3 impact our downstream reporting systems?"
- Narration:
  - "Finally: cross-system intelligence"
  - "Requires understanding multiple systems"
  - "MCP servers for AOMA, reporting systems, integration points"
  - "Synthesizing cross-system dependencies"
  - "Not isolated knowledge silos - connected system intelligence"
- **POINT OF DIFFERENTIATION #4: Multi-system reasoning**

**Closing Summary (30 seconds)**
- "Key differentiators:"
  1. Live system data via custom AOMA mesh MCP
  2. Visual diagram generation (not just text)
  3. System introspection and health analysis
  4. Multi-system cross-reference and impact analysis
  5. Trust through anti-hallucination
- "And all backed by comprehensive AI testing infrastructure..."
- "(But that's the next video!)"

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

**Section 3: Live Web App Demo (10-12 min) - DIFFERENTIATION FOCUSED**
- Control: **PLAYWRIGHT AUTOMATION**
- Screen: Browser at https://thebetabase.com
- Script: `tests/demo/demo-differentiated.spec.ts`
- Opening tease: "This runs on our AI testing infrastructure (59 tests)... but that's a separate video"
- Queries:
  1. "What is AOMA?" → quick baseline (downplay it)
  2. "What is the current state of AOMA production?" → **DIFFERENTIATION: Live system data via AOMA mesh MCP**
  3. "Generate a system architecture diagram for AOMA" → **DIFFERENTIATION: Visual diagram generation**
  4. "Analyze dependencies between AOMA and downstream systems" → **DIFFERENTIATION: System introspection**
  5. "Does AOMA have quantum computing?" → anti-hallucination
  6. "How do changes in AOMA3 impact reporting systems?" → **DIFFERENTIATION: Multi-system reasoning**
- Closing: "Key differentiators: live data, diagrams, introspection, multi-system intelligence, trust"
- Why Playwright:
  - Perfect execution, showcases testing sophistication
  - Pause/resume for narration control
  - Reproducible, re-recordable
  - Part of the story (AI testing infrastructure teaser)

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

**Points of Differentiation (What Makes This Unique)**
1. **AOMA Mesh MCP Server**: Live system data, not static docs - custom API integration with persistent connections
2. **System Diagram Generation**: Visual intelligence - Mermaid diagrams, architecture flows, not just text
3. **System Introspection**: Knowledge from RUNNING systems - understands topology, health, dependencies
4. **Multi-System Intelligence**: Cross-system reasoning - impact analysis, connected knowledge
5. **Trust Through Transparency**: Anti-hallucination + citations - honest responses, source attribution

**What's Cool Technically**
- Custom MCP servers for enterprise systems (AOMA mesh)
- Real-time system interrogation capabilities
- Visual diagram generation from system knowledge
- Comprehensive AI testing infrastructure (59 tests, Playwright + Vitest)
- Zero console errors in production

**What's Hard**
- Building custom MCP servers for proprietary systems
- Maintaining persistent connections to enterprise APIs
- Authentication flows for locked-down systems
- Context window management for complex queries
- Ensuring MCP server reliability and fallback strategies

**What's Valuable for Enterprise**
- Live system intelligence, not static documentation
- Visual representations that aid decision-making
- Cross-system impact analysis for change management
- Trustworthy responses critical for enterprise adoption
- Extensibility: add new MCP servers, instant new capabilities

---

---

## Quick Reference: Narration Emphasis Points

**When Showing AOMA Mesh MCP:**
- "This isn't reading documentation..."
- "It's querying the AOMA mesh MCP server in real-time..."
- "Live system state, not historical docs..."
- "Custom API integration, not generic scraping..."

**When Diagrams Appear:**
- "Most chatbots give you text walls..."
- "This generates actual system diagrams..."
- "Mermaid, architecture flows, visual intelligence..."
- "Technical audiences love diagrams over descriptions..."

**When Showing System Introspection:**
- "Not just 'what does the doc say about AOMA?'..."
- "What is AOMA's health? Dependencies? Integration status?..."
- "Knowledge extracted from RUNNING systems..."
- "System intelligence, not document retrieval..."

**Testing Infrastructure Tease (Opening):**
- "This entire demo runs on our AI testing infrastructure..."
- "59 automated tests, Playwright + Vitest, full CI/CD..."
- "But testing is a different video..."
- "Today: what makes the chatbot unique..."

**Core Message:**
This isn't just another chatbot with RAG. It's a system intelligence platform with:
- Live data from custom MCP servers
- Visual diagram generation
- Real-time system introspection
- Multi-system cross-reference
- Enterprise-grade trust

---

**Last Updated**: October 25, 2025
**Status**: Ready for demo with differentiation focus
**Estimated Duration**: 20-25 minutes with Q&A
**Differentiation Script**: `tests/demo/demo-differentiated.spec.ts`
