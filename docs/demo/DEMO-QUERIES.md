# Demo Queries - Pre-Cache Ready

These queries warm the cache before recording. Run each one, let it complete, then they'll be instant on camera.

---

## Pre-Recording Warm-Up Sequence

Run these in order before hitting record:

### 1. AOMA Authentication Flow
```
What's the AOMA 2 API authentication flow?
```
**Why**: Core domain question, shows RAG works with technical content.

---

### 2. Offering Lifecycle
```
How does the Offering lifecycle work in AOMA?
```
**Why**: Business logic question, shows domain understanding.

---

### 3. Asset Management Endpoints
```
What are the main API endpoints for Asset management?
```
**Why**: API reference question, shows we index technical docs.

---

### 4. Diagram Generation (for background render)
```
Show me the authentication flow as a diagram
```
**Why**: This warms the Mermaid generation. On camera, offer it as optional.

---

## Demo Flow Queries

Use these during the actual recording:

### Chat Pillar (~90 sec)

**Primary question:**
```
What's the AOMA 2 authentication flow?
```

**Follow-up (if diagram offer appears):**
- Click "Would you like to see a diagram?"
- Zoom/pan to show interactivity

---

### Curate Pillar (~90 sec)

No chat queries needed - navigate to Curate tab and show:
- Feedback submission (thumbs up/down)
- Curator queue
- "One correction helps thousands of queries"

---

### Test Pillar (~60 sec)

No chat queries needed - navigate to Test tab and show:
- Home dashboard metrics
- Self-Healing queue
- Approve/reject workflow

---

## Anti-Hallucination Test

If you want to show honest boundaries:
```
Does AOMA have a blockchain integration?
```
**Expected**: "I don't have information about that" or similar honest response.

---

## Pre-Recording Checklist

```
[ ] Dev server running on localhost:3000
[ ] Ran all 4 warm-up queries above
[ ] Navigated to Test tab (loads data)
[ ] Navigated to Curate tab (loads data)
[ ] No console errors
[ ] Screen recording ready
```

---

## Cache Timing

- Query results cache for 5 minutes
- Run warm-up queries within 5 minutes of recording
- Mermaid diagrams render in background

---

*Last updated: November 28, 2025*
