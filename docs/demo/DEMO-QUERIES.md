# SIAM (The Beta Base) Demo Queries - Copy/Paste Ready

## Overview
These natural language queries are designed to showcase **SIAM (aka "The Beta Base")**—our enterprise AI testing platform—as it tests and analyzes **AOMA** (the Application Under Test).

**Key Branding**:
- **Platform**: SIAM / The Beta Base
- **AUT**: AOMA (Asset & Offering Management App)
- **Visual Style**: Nano Banana 2 (Neon/Dark)

---

## Demo Flow (Total: ~5 minutes)

### 1. Warm-Up Query (30 seconds)
**Purpose**: Establish SIAM/Beta Base identity

```
What is the Beta Base and how does it help with testing AOMA?
```

**Expected Response**: Should explain that The Beta Base (SIAM) is the intelligent testing platform currently configured to test the AOMA multi-tenant system.

---

### 2. Architecture Diagram Query (60 seconds)
**Purpose**: Showcase Mermaid diagram generation for the AUT (AOMA)

```
Generate a system architecture diagram for AOMA showing all integration points including the Unified Session Manager, data sources, and external APIs
```

**Expected Response**: Should generate a colorful "Nano Banana 2" styled Mermaid flowchart of **AOMA's** architecture:
- API Gateway
- Unified Session Manager (USM)
- Vector Database
- External integrations (JIRA, GitHub)

**Demo Actions**:
- Wait for diagram to render
- Zoom/Pan
- **Voiceover**: "Here, The Beta Base is visualizing AOMA's architecture dynamically."

---

### 3. RLHF Feedback Loop Query (45 seconds)
**Purpose**: Explain the platform's learning capability

```
How does the Beta Base's RLHF feedback loop improve retrieval quality for AOMA documentation?
```

**Expected Response**: Should explain how curator feedback on AOMA-related answers updates the embeddings to make the platform smarter about the AUT.

---

### 4. Curate Tab Demonstration (90 seconds)
**Purpose**: Show the RLHF UI where we curate knowledge about AOMA

**Actions**:
1. Click "Curate" tab
2. Show feedback queue (questions about AOMA)
3. Submit feedback
4. **Voiceover**: "Curators review how well The Beta Base answers questions about AOMA. This feedback loop is essential for maintaining accurate knowledge about the system under test."

---

### 5. TestSprite Self-Healing Query (60 seconds)
**Purpose**: Showcase automated testing of the AUT

```
Explain how TestSprite automatically fixed the broken login test in AOMA last night
```

**Expected Response**: Sequence diagram showing:
- AOMA CI/CD pipeline failure
- TestSprite agent analyzing AOMA's DOM
- Selector drift detection
- Automated fix generation

---

### 6. Complex Multi-Source Query (45 seconds)
**Purpose**: Demonstrate hybrid RAG across AOMA's data sources

```
Show me the latest JIRA tickets related to the AOMA3 migration and the corresponding GitHub commits
```

**Expected Response**: Multi-source retrieval combining JIRA tickets and GitHub commits specific to the AOMA project.

---

### 7. Anti-Hallucination Demo (30 seconds)
**Purpose**: Show honest boundaries regarding the AUT

```
Does AOMA have a blockchain integration for NFT minting?
```

**Expected Response**: Honest "I don't know" - The Beta Base knows AOMA's documentation and correctly identifies this feature doesn't exist.

---

## Backup Queries (If Time Permits)

### Database Schema Diagram
```
Generate an ERD showing the SIAM multi-tenant database schema with tables for organizations, users, knowledge_elements, and rlhf_feedback
```

### Testing Dashboard
```
Show me the test results dashboard with pass/fail statistics
```

### Voice Feature
```
[Click microphone icon and speak]: "What is the Unified Session Manager?"
```

---

## Pre-Demo Checklist

- [ ] Server running on `localhost:3000`
- [ ] AOMA MCP backend healthy
- [ ] Supabase connected
- [ ] At least 2-3 chat interactions logged (for Curate tab demo)
- [ ] Queries copied to clipboard or second monitor
- [ ] Screen recording software ready (CapCut/Descript)
- [ ] Microphone tested

---

## Troubleshooting

**If diagram doesn't render**:
- Check browser console for errors
- Refresh page
- Try a simpler query: "Show me a simple flowchart of the chat API"

**If Curate tab is empty**:
- Send 2-3 test queries first
- Check server logs for RLHF logging errors
- Verify Supabase connection

**If response is slow (>10s)**:
- Check AOMA MCP health: `GET /api/aoma/health`
- Verify Railway backend is running
- Consider bypassing AOMA for demo: set `NEXT_PUBLIC_BYPASS_AOMA=true`

---

## Timing Guide

| Query | Expected Time | Total Elapsed |
|-------|---------------|---------------|
| 1. What is SIAM | 5-8s | 0:30 |
| 2. Architecture diagram | 8-12s | 1:30 |
| 3. RLHF explanation | 6-10s | 2:15 |
| 4. Curate tab demo | N/A | 3:45 |
| 5. TestSprite workflow | 8-12s | 4:45 |
| 6. Multi-source query | 10-15s | 5:30 |
| 7. Anti-hallucination | 5-8s | 6:00 |

**Target Total**: 5-6 minutes (allows for voiceover and transitions)
