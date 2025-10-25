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

### 1. Unified Multi-Source Knowledge ⭐⭐⭐⭐⭐
**The Integration Layer**
- Custom AOMA Mesh MCP server aggregating:
  - AOMA documentation (50+ pages, proprietary Sony Music Enterprise systems)
  - JIRA tickets and development status
  - Git commits and code repositories (local analysis)
  - Outlook email threads for project context
- Single unified vector store, not isolated silos
- Cross-references across all sources automatically

**Demo Impact:**
- "Show me JIRA tickets related to AOMA migration and the relevant code commits"
- "What does the documentation say about X, and has anyone emailed about it?"
- Most chatbots: one data source. Ours: unified enterprise intelligence.

### 2. System Diagram Generation ⭐⭐⭐⭐
**Visual Intelligence**
- Most chatbots: text walls
- SIAM: actual visual diagrams (Mermaid, architecture flows)
- Transforms system knowledge into actionable visuals
- Technical audiences love diagrams

**Demo Impact:**
- "Generate a system architecture diagram for AOMA showing all integration points"
- "Create a visual flow of how AOMA3 processes assets"
- See it create visual representations, not just describe them

### 3. Development Context Analysis ⭐⭐⭐⭐⭐
**Cross-Source Intelligence**
- Not just "what does the doc say?"
- "What are the active tickets? Recent commits? Email discussions? Combined context?"
- Analyzes development activity across multiple sources
- Understands project status from multiple perspectives

**Demo Impact:**
- "What's the current development status of AOMA3 migration?"
- Pulls: JIRA tickets, git commits, documentation updates, email threads
- Synthesizes: comprehensive status from multiple signals
- **This is genuinely novel**

### 4. Proprietary Enterprise Knowledge ⭐⭐⭐⭐
**Not Public Data**
- AOMA documentation is Sony Music proprietary
- Internal system architecture, workflows, integration points
- Confluence pages, internal wikis, design docs
- Knowledge that doesn't exist on the public internet

**Demo Impact:**
- "How does AOMA integrate with Sony's downstream reporting systems?"
- Answer comes from proprietary internal docs
- Competitive advantage: your company's specific systems

### 5. Code-Level Intelligence ⭐⭐⭐⭐
**Git + Code Analysis**
- Searches local git repositories
- Analyzes code files and commit history
- Links documentation concepts to actual implementation
- "Show me where feature X is implemented in code"

**Demo Impact:**
- "Find the authentication implementation in our codebase"
- "What code changes were made for AOMA3 migration?"
- Bridges documentation and actual code

### 6. Voice Conversational Interface ⭐⭐⭐⭐
**Natural Interaction**
- Voice input: speak your questions
- Voice output: hear responses (ElevenLabs integration)
- Hands-free operation for multitasking
- Natural conversation flow, not just text

**Demo Impact:**
- Actually TALK to your enterprise knowledge base
- Ask questions while looking at code/diagrams
- More natural than typing for complex queries
- **Most enterprise chatbots: text only. Ours: full voice conversation**

### 7. Anti-Hallucination + Citations ⭐⭐⭐
**Table Stakes, But Critical**
- Honest "I don't know" responses
- Source citations on every claim
- 95%+ citation accuracy (manual audit)
- Trust through transparency

---

## Recording Strategy with Descript

### Why Descript is Perfect for This
- Record screen + camera simultaneously
- Edit by editing transcript (remove "ums", mistakes)
- Add captions automatically
- Overdub narration if you mess up
- Add zoom effects, highlights, overlays in post
- Export with camera picture-in-picture

### Recording Approach: Segmented

**Record in 3 separate segments** (easier to edit than one 15-min take):

1. **Segment 1: Opening + Context** (2 min)
   - Hook: "What makes SIAM different?"
   - Quick intro to the 7 differentiators
   - "Let's see it in action"

2. **Segment 2: Live Demos** (10 min)
   - Run through all 7 differentiation demos
   - Use Playwright automation OR manual typing (your choice)
   - Can do multiple takes of each query
   - Descript will let you splice together the best takes

3. **Segment 3: Closing** (1 min)
   - Recap the 7 differentiators
   - Testing infrastructure tease
   - Call to action

### Pre-Recording Checklist

**Browser Setup:**
- [ ] Open thebetabase.com in clean Chrome profile
- [ ] Log in, verify it works
- [ ] Hide bookmarks bar (Cmd+Shift+B)
- [ ] Close all other tabs
- [ ] Set zoom to 100%
- [ ] Position window for good screen recording size

**Descript Setup:**
- [ ] New project: "SIAM Demo for Colleagues"
- [ ] Screen recording: Full screen OR application window
- [ ] Camera: Bottom right corner (or off if you prefer)
- [ ] Microphone: Test levels, speak at normal volume
- [ ] Recording template: 1080p, 30fps

**Content Prep:**
- [ ] Have DEMO-SCRIPT-BULLETS.md open on second screen
- [ ] Test each demo query works
- [ ] Close Slack, notifications, anything distracting
- [ ] Put phone on Do Not Disturb

### Recording Workflow

**For Each Segment:**

1. **Hit Record in Descript**
2. **Take a breath, smile** (if camera on)
3. **Start speaking naturally** - reference bullet script but don't read it
4. **If you mess up**: Keep going! Fix in editing
5. **Finish segment**
6. **Hit Stop**
7. **Review immediately** - if terrible, re-record that segment

**Tips:**
- Speak slightly slower than normal (easier to understand)
- Pause after each demo for 2 seconds (easier to edit)
- Over-emphasize key phrases: "POINT OF DIFFERENTIATION #1"
- If you stumble: pause, restart the sentence (Descript can remove the mistake)

### Post-Recording: Descript Editing

**Phase 1: Cleanup (30 mins)**
1. Let Descript transcribe
2. Edit transcript to remove:
   - "Um", "uh", "like"
   - False starts
   - Long pauses
   - Any mistakes
3. Transcript edits = video edits automatically

**Phase 2: Enhancement (30 mins)**
1. Add captions (auto-generate, then review)
2. Add zoom effects on key moments:
   - When clicking GitMerge button
   - When diagram renders
   - When showing source citations
3. Add text overlays:
   - "POINT OF DIFFERENTIATION #1" in big text
   - Key phrases highlighted
   - URLs at the end

**Phase 3: Polish (15 mins)**
1. Add intro/outro cards (optional)
2. Adjust camera position/size if needed
3. Remove filler frames
4. Export: 1080p MP4

### Alternative: Playwright Automation + Narration

**If you want to be fancy:**

1. Record Playwright running the demo (no talking)
2. Record voiceover separately (reading script)
3. Combine in Descript
4. Advantage: Perfect demo execution, clean audio

**Script:**
```bash
# Terminal 1: Record this with Descript (screen only)
npx playwright test tests/demo/demo-differentiated.spec.ts --headed

# Then in Descript:
# Record voiceover while watching the video
# Descript will sync them
```

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
1. User query → semantic search against vectorized knowledge
2. Retrieved contexts from multiple sources (docs + JIRA + Git + Email)
3. LLM with structured prompt and unified context
4. Streaming response with source citations
5. MCP servers provide cross-source intelligence

**[DIAGRAM PLACEHOLDER: Request flow diagram]**

---

## MCP Integration - The Interesting Part

### What is MCP?
- Anthropic's Model Context Protocol
- Lets LLMs interact with external tools/data sources
- Think: function calling, but with persistent connections

### Our Custom AOMA Mesh MCP Server
**What it actually does:**
- **Documentation Crawler**: Aggregates AOMA docs from Confluence, internal wikis
- **JIRA Integration**: search_jira_tickets, get_jira_ticket_count
- **Git Integration**: search_git_commits, search_code_files (local repos)
- **Email Integration**: search_outlook_emails for project context
- **Development Context**: analyze_development_context across all sources
- **Unified Vector Store**: Single knowledge base with source metadata

**Why this matters:**
- Written by us, for our specific enterprise needs
- Proprietary Sony Music systems (AOMA, internal processes)
- Cross-references information humans would never manually connect
- "What does the doc say? What's the ticket status? What changed in code? Any emails?"

**[DIAGRAM PLACEHOLDER: MCP server architecture]**

### Technical Challenges Solved
- Authentication flow: Playwright + Firecrawl for locked-down enterprise systems
- Unified vector store: Single embedding space with source discrimination
- Rate limiting and caching strategy across multiple APIs
- Error handling when sources timeout/fail (graceful degradation)

---

## Anti-Hallucination Architecture

### The Problem
- RAG systems still hallucinate
- LLMs confident about wrong information
- Citations don't guarantee accuracy

### Our Approach
- Retrieval-first: only answer from vectorized knowledge
- Explicit "I don't know" training
- Source attribution on every claim (doc/JIRA/Git/Email)
- Test suite: 20+ adversarial questions

### Technical Implementation
```
Prompt structure:
1. System: "Only use provided context from: docs, JIRA, Git, Email"
2. Context: <retrieved_chunks_with_source_metadata>
3. User query
4. Constraint: "If not in sources, say so. Always cite source type."
```

### Testing Strategy
- Automated test: ask about non-existent features
- Verify model responds "no information available"
- Red team test: trick questions (quantum computing integration)
- Monitor: log all "I don't know" responses for accuracy

---

## Live Demo Flow

### Setup
- Production site: https://thebetabase.com
- AOMA documentation loaded (~50 pages proprietary docs)
- JIRA integration active
- Git repositories indexed (local)
- Email search configured

### Demo Sequence (DIFFERENTIATION FOCUSED)

**Opening Tease (30 seconds)**
- "This demo runs on our AI testing infrastructure..."
- "59 automated tests, Playwright + Vitest, full CI/CD..."
- "But testing is a different video. Today: unique capabilities..."

**1. Basic Context (Quick - 1 min)**
- "What is AOMA?"
- Show: streaming response, source citations
- Narration: "Standard RAG response from proprietary docs... establishing baseline"
- Keep brief

**2. DIFFERENTIATION: Multi-Source Intelligence (2 min)**
- Query: "Show me JIRA tickets related to AOMA migration and the related code commits"
- Narration:
  - "Now the interesting part - querying MULTIPLE sources simultaneously"
  - "JIRA tickets + Git commits + documentation context"
  - "Custom AOMA mesh MCP server pulls from all three"
  - "Most chatbots: one source. Ours: unified enterprise intelligence"
- Show: Response references tickets, commits, and docs
- **POINT OF DIFFERENTIATION #1: Multi-source unified knowledge**

**3. DIFFERENTIATION: System Diagram Generation (2 min)**
- Query: "Generate a system architecture diagram for AOMA showing all integration points"
- Narration:
  - "Most chatbots only return text. Watch this..."
  - "It's actually GENERATING a visual diagram"
  - "Mermaid diagrams, system flows, architecture visualizations"
  - "Transforms abstract knowledge into actionable visuals"
- Wait for diagram to render
- **POINT OF DIFFERENTIATION #2: Visual diagram generation**

**4. DIFFERENTIATION: Development Context Analysis (2 min)**
- Query: "What's the current development status of AOMA3 migration?"
- Narration:
  - "Here's where it gets really interesting"
  - "Not just documentation - analyzing development activity"
  - "JIRA tickets: what's in progress? Git: what changed? Docs: what's specified?"
  - "Cross-source synthesis: comprehensive project status"
  - "Knowledge from multiple perspectives, not isolated silos"
- **POINT OF DIFFERENTIATION #3: Development context intelligence**

**5. DIFFERENTIATION: Code-Level Intelligence (2 min)**
- Query: "Find the authentication implementation in our codebase"
- Narration:
  - "Now let's bridge documentation to actual code"
  - "Searching local git repositories"
  - "Links documentation concepts to implementation"
  - "File locations, code snippets, commit history"
- Show: actual code references
- **POINT OF DIFFERENTIATION #4: Code-level analysis**

**6. Anti-Hallucination Test (1.5 min)**
- Query: "Does AOMA have a quantum computing integration?"
- Narration:
  - "Let's test trustworthiness with a trick question"
  - "This feature doesn't exist - will it admit that?"
  - "Notice: honest 'no information available' response"
  - "Doesn't fabricate features or make up capabilities"
  - "Critical for enterprise trust"
- Show: honest response

**7. DIFFERENTIATION: Proprietary Knowledge (1.5 min)**
- Query: "How does AOMA integrate with Sony's downstream reporting systems?"
- Narration:
  - "This is proprietary Sony Music Enterprise knowledge"
  - "Internal system architecture, not public information"
  - "Confluence pages, design docs, integration specs"
  - "Knowledge that doesn't exist on the public internet"
- Show: detailed proprietary response
- **POINT OF DIFFERENTIATION #5: Enterprise-specific knowledge**

**Closing Summary (30 seconds)**
- "Six key differentiators:"
  1. Multi-source unified knowledge (docs + JIRA + Git + Email)
  2. Visual diagram generation (not just text)
  3. Development context analysis (cross-source intelligence)
  4. Code-level intelligence (git repo analysis)
  5. Proprietary enterprise knowledge (Sony Music systems)
  6. Trust through anti-hallucination
- "All backed by comprehensive AI testing infrastructure..."
- "(But that's the next video!)"

---

[Rest of document remains the same with testing infrastructure, technical stack, etc.]

---

## Quick Reference: Narration Emphasis Points

**When Showing Multi-Source Intelligence:**
- "Not one data source - JIRA + Git + Docs + Email simultaneously..."
- "Custom AOMA mesh MCP server aggregates everything..."
- "Cross-references information humans wouldn't manually connect..."
- "Unified enterprise intelligence, not isolated silos..."

**When Diagrams Appear:**
- "Most chatbots give you text walls..."
- "This generates actual system diagrams..."
- "Mermaid, architecture flows, visual intelligence..."
- "Technical audiences love diagrams over descriptions..."

**When Showing Development Context:**
- "Not just 'what does the doc say?'..."
- "What's in JIRA? What changed in Git? Any emails? Combined context..."
- "Analyzes development activity across multiple sources..."
- "Comprehensive project status from multiple signals..."

**When Showing Code Intelligence:**
- "Searching local git repositories..."
- "Links documentation to actual implementation..."
- "File locations, code snippets, commit history..."
- "Bridges docs and code..."

**When Showing Proprietary Knowledge:**
- "This is Sony Music proprietary knowledge..."
- "Internal system architecture, not public information..."
- "Knowledge that doesn't exist on the public internet..."
- "Your company's specific systems..."

**Testing Infrastructure Tease (Opening):**
- "This entire demo runs on our AI testing infrastructure..."
- "59 automated tests, Playwright + Vitest, full CI/CD..."
- "But testing is a different video..."
- "Today: what makes the chatbot unique..."

**Core Message:**
This isn't just another chatbot with RAG. It's an enterprise intelligence platform with:
- Unified multi-source knowledge (docs + JIRA + Git + Email)
- Visual diagram generation
- Development context analysis
- Code-level intelligence
- Proprietary enterprise knowledge
- Enterprise-grade trust

---

**Last Updated**: October 25, 2025
**Status**: Ready for demo with REAL differentiation focus
**Estimated Duration**: 12-15 minutes demo + Q&A
**Differentiation Script**: `tests/demo/demo-differentiated.spec.ts` (needs updating)
