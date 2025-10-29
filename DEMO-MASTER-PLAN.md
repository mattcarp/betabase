# SIAM Demo Master Plan
**Recording Tonight | Delivery Tomorrow Afternoon**

---

## Executive Summary

You're creating a **4-minute segmented demo** using **Descript** with **Shure SM-B microphone**. The demo showcases **7 key differentiators** of SIAM/thebetabase.com - enterprise intelligence that goes beyond basic chatbots.

### Demo Format
- **Segmented Approach**: 3 separate recordings spliced in Descript
- **Total Runtime**: 4:00-4:15 (with charm buffer)
- **Recording Tonight**: ~2 hours total (recording + editing)
- **Delivery**: Tomorrow afternoon

### Success Criteria
✅ All 4 demo queries work flawlessly
✅ Progress indicator doesn't duplicate or hang
✅ Showcases multi-source intelligence
✅ Demonstrates visual diagram generation
✅ Proves anti-hallucination measures

---

## 🎯 Seven Key Differentiators

1. **Unified Enterprise Knowledge** - JIRA + Git + Docs + Email (not isolated silos)
2. **Visual Diagram Generation** - Mermaid diagrams, not text walls
3. **Development Intelligence** - Cross-source context synthesis
4. **Anti-Hallucination Trust** - Honest "I don't know" responses
5. **Strategic SLM/Fine-Tuning** - Domain-specific, not general-purpose
6. **Semantic Deduplication** - 85% similarity threshold for file management
7. **Comprehensive Testing** - 59 automated Playwright tests

---

## 🎬 Recording Strategy - Segmented Approach

### Why Segmented?
- ✅ Easier to perfect each part
- ✅ Can re-record just one segment if needed
- ✅ Less pressure than one 4:45 take
- ✅ Faster editing (splice in Descript)

### Segment A: Hook + Core Demos (3:00)
**Recording steps:**
1. **Hook (30s)**: "Not another chatbot... enterprise intelligence for Sony Music... 7 differentiators..."
2. **Demo 1 (45s)**:
   - Query: "What is AOMA?"
   - Narrate: "Standard RAG, proprietary docs"
   - Then: "Show me JIRA tickets related to AOMA migration and the related code commits"
   - Narrate: "Multi-source: JIRA, Git, Docs, Email - Differentiator #1"
3. **Demo 2 (45s)**:
   - Query: "Generate a system architecture diagram for AOMA showing all integration points"
   - Narrate: "Visual diagrams, not text walls - Differentiator #2"
4. **Demo 3 (45s)**:
   - Query: "What's the current development status of AOMA3 migration?"
   - Narrate: "Dev context synthesis - Differentiator #3"
5. **Demo 4 (30s)**:
   - Query: "Does AOMA have a blockchain integration?"
   - Narrate: "Trick question, honest 'no info' - Differentiator #4"

### Segment B: SLM Strategy (45s)
**Pure talking (no screen action):**
- "GPT-4/5 knows protein folding, quantum physics"
- "Sony Music users don't need that"
- "Small Language Model + fine-tuning"
- "Domain-specific: AOMA, DDEX, Sony workflows"
- "FASTER, CHEAPER, MORE ACCURATE"
- "Current: GPT-4o/5 → Next: Fine-tuned mini → Future: Custom SLM"
- "Differentiator #5: Strategic AI approach"

### Segment C: Curate Tab + Close (1:00)
**Screen demo:**
1. Click "Curate" tab
2. Show: "Document management - Upload proprietary docs"
3. Hover over Dedupe button (GitMerge icon)
4. Narrate: "Intelligent deduplication - semantic similarity at 85% threshold"
5. "Keeps newest, removes duplicates automatically"
6. "All backed by 59 automated Playwright tests"
7. **Final recap (15s)**:
   - "Multi-source knowledge, visual intelligence, dev context"
   - "Anti-hallucination, strategic SLM roadmap"
   - "Questions?"

---

## 📋 Demo Queries (Copy/Paste Ready)

**Keep these visible on second monitor:**

```
What is AOMA?

Show me JIRA tickets related to AOMA migration and the related code commits

Generate a system architecture diagram for AOMA showing all integration points

What's the current development status of AOMA3 migration?

Does AOMA have a blockchain integration?
```

---

## 🖼️ System Diagrams Available

### Existing Diagrams (12 total in SIAM-MERMAID-DIAGRAMS.md)

**For Demo Use (Priority Order):**

1. **SIAM High-Level Architecture** (Diagram 1)
   - Shows: Browser → Next.js → OpenAI + Supabase + Railway
   - Use for: "Here's our overall architecture"
   - Best for: Technical overview

2. **AOMA Mesh MCP Server Architecture** (Diagram 6)
   - Shows: MCP tools, data sources, orchestration
   - Use for: "This is how multi-source intelligence works"
   - Best for: Differentiator #1

3. **AOMA Orchestrator Decision Logic** (Diagram 4)
   - Shows: Vector search vs Railway MCP decision flow
   - Use for: "How we route queries intelligently"
   - Best for: Technical deep-dive

4. **Performance Comparison** (Diagram 9)
   - Shows: Before/after optimization (30s → 14s)
   - Use for: "53% faster with vector optimization"
   - Best for: Performance story

**Query That Generates Diagrams:**
```
Generate a system architecture diagram for AOMA showing all integration points
```
This will generate a Mermaid diagram LIVE during the demo!

---

## 🎙️ Recording Setup - Do Now (15 minutes)

### Step 1: Descript Configuration

**Open Descript and create project:**
- [ ] Launch Descript
- [ ] New Project → "SIAM Demo Final"
- [ ] Template: Screen Recording
- [ ] Resolution: 1920x1080
- [ ] Frame Rate: 30fps

**Audio Setup (Shure SM-B):**
- [ ] Input Device: Select "Shure SM-B"
- [ ] Quality: High
- [ ] Noise Reduction: ON
- [ ] Echo Cancellation: ON
- [ ] Test levels: Speak, should hit -12dB to -6dB

**Screen Source:**
- [ ] Source: Application Window → Chrome
- [ ] Preview to verify framing

**Camera:**
- [ ] Option A: Bottom-right PIP, small size
- [ ] Option B: OFF (screen-only)
- [ ] **Recommendation**: Start screen-only

### Step 2: Chrome Browser Setup

```bash
# Server should already be running at http://localhost:3000
# Check with:
curl -s http://localhost:3000 | head -20
```

- [ ] Hide bookmarks bar: `Cmd+Shift+B`
- [ ] Zoom 100%: `Cmd+0`
- [ ] Close all other tabs (only localhost open)
- [ ] Close DevTools if open
- [ ] Position window: Centered, good framing
- [ ] Test ONE query: "What is AOMA?" (verify works)

### Step 3: Environment Prep

- [ ] Close Slack
- [ ] Close email
- [ ] Phone: Do Not Disturb
- [ ] Water nearby
- [ ] Good lighting (if using camera)
- [ ] Quiet space

### Step 4: Second Monitor

- [ ] Open this file: `/Users/mcarpent/Documents/projects/siam/DEMO-RECORDING-CHEAT-SHEET.md`
- [ ] Enlarge text for easy glancing
- [ ] Position where you can see without turning head

---

## ✂️ Editing in Descript (30 minutes)

### Phase 1: Quick Splice (5 min)

1. Arrange segments: A → B → C
2. Trim dead space at start/end of each
3. Add smooth transitions (1-2 second overlap)

### Phase 2: Cleanup (15 min)

1. Let Descript transcribe all segments
2. Click "Remove filler words" button (auto-removes um, uh, like)
3. Edit transcript to remove:
   - False starts
   - Long pauses
   - Any stumbles
4. Transcript edits = video edits (Descript magic!)

### Phase 3: Polish (10 min)

1. Add captions (auto-generate, review for accuracy)
2. Style: Bottom-center, readable font
3. Watch full video start-to-finish
4. Fix any jarring cuts
5. Check timing: Should be 4:30-4:45

### Phase 4: Export (2 min)

1. Click "Publish"
2. Export as: MP4
3. Resolution: 1080p
4. Quality: High
5. Download

**Total editing time: ~30 minutes**

---

## 🎯 Tonight's Timeline

**Total time: ~2 hours from start to exported video**

| Task | Time | Notes |
|------|------|-------|
| Descript setup | 10 min | Audio test critical |
| Chrome setup | 5 min | Clean, centered |
| Practice run (no recording) | 10 min | Get comfortable |
| Record Segment A | 15 min | Hook + 4 demos |
| Record Segment B | 5 min | SLM strategy (easy) |
| Record Segment C | 10 min | Curate + close |
| Review recordings | 10 min | Check quality |
| Edit in Descript | 30 min | Splice, cleanup, polish |
| Export video | 5 min | 1080p MP4 |
| **TOTAL** | **~2 hours** | **Done tonight!** |

---

## 💡 Key Talking Points (Memorize These)

### Hook (30s)
- Not another chatbot
- Enterprise intelligence for Sony Music
- 7 differentiators
- Strategic SLM/fine-tuning approach

### Multi-Source Intelligence
- "Unified enterprise knowledge"
- "Not isolated silos"
- "JIRA + Git + Docs + Email simultaneously"

### SLM Strategy
- "Domain-specific, not general-purpose"
- "Proprietary knowledge only"
- "Faster, cheaper, more accurate for our use case"
- "No protein folding expertise needed here"

### Anti-Hallucination
- "Honest 'I don't know'"
- "No fabrication when uncertain"
- "Enterprise trust over impressive-sounding nonsense"

### Curate Tab
- Upload: ~50 pages AOMA docs
- Delete: Outdated files
- Dedupe: **Semantic similarity at 85% threshold**
- Testing: 59 automated Playwright tests

---

## 🚨 Troubleshooting

### If Audio Choppy
- Close other apps
- Restart Descript
- Lower quality to Medium

### If Screen Laggy
- Close DevTools
- Close other Chrome tabs
- Record screen-only (no camera)

### If You Keep Making Mistakes
- Take a break, walk around
- Record in smaller chunks
- Remember: Descript can fix almost anything

### If Demo Query Slow
- Narrate while waiting: "Processing multi-source query..."
- Use silence - it's okay
- Can trim long pauses in editing

### If Progress Indicator Duplicates
- Refresh the page
- Have backup: mention it's "real-time processing"
- Focus on the result, not the indicator

---

## 📊 Technical Verification (Before Recording)

### Server Status
```bash
# Check localhost is running
curl -s http://localhost:3000 | grep "The Betabase"

# Check AOMA-mesh-mcp server
curl -s -X POST https://luminous-dedication-production.up.railway.app/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":"test","method":"tools/call","params":{"name":"query_aoma_knowledge","arguments":{"query":"What is AOMA?","strategy":"rapid"}}}' \
  | grep "response"

# Expect: Response with AOMA information in ~19 seconds
```

### Console Errors
```bash
# Open Chrome DevTools → Console
# Look for any RED errors
# Should be ZERO errors before recording

# Common acceptable warnings:
# - Development mode warnings
# - React strict mode warnings
```

### Web Vitals
- CLS should be 0 (no layout shift)
- FCP should be < 1.5s (fast content paint)
- INP should be < 200ms (interaction responsiveness)

**Verify these in Chrome DevTools → Lighthouse**

---

## 🎨 System Diagrams - Rendering Instructions

### Option 1: Mermaid Live (Recommended - 5 minutes)

```bash
# For each diagram you want to show:
# 1. Open: https://mermaid.live
# 2. Copy diagram from docs/SIAM-MERMAID-DIAGRAMS.md
# 3. Paste into Mermaid Live
# 4. Export → PNG (1920x1080)
# 5. Save to: docs/diagrams/exports/
```

### Option 2: CLI Rendering (Fastest for all diagrams)

```bash
cd ~/Documents/projects/siam

# Install mermaid-cli if you haven't
npm install -g @mermaid-js/mermaid-cli

# Create export directory
mkdir -p docs/diagrams/exports

# Render diagrams (examples):
# Note: These commands extract mermaid blocks and render them

# SIAM High-Level Architecture
mmdc -i docs/SIAM-MERMAID-DIAGRAMS.md -o docs/diagrams/exports/01-siam-architecture.png \
  -t dark -b transparent -w 1920 -H 1080

# AOMA Mesh MCP Architecture
mmdc -i docs/SIAM-MERMAID-DIAGRAMS.md -o docs/diagrams/exports/06-mcp-architecture.png \
  -t dark -b transparent -w 1920 -H 1080

# Performance Comparison
mmdc -i docs/SIAM-MERMAID-DIAGRAMS.md -o docs/diagrams/exports/09-performance.png \
  -t dark -b transparent -w 1920 -H 1080
```

**Note**: If mmdc has issues with multiple diagrams in one file, use Mermaid Live instead.

### Diagrams Needed for Demo

**Priority 1 (Must Have):**
- SIAM High-Level Architecture (Diagram 1)
- AOMA Mesh MCP Server Architecture (Diagram 6)

**Priority 2 (Nice to Have):**
- AOMA Orchestrator Decision Logic (Diagram 4)
- Performance Comparison (Diagram 9)

**Priority 3 (Generated Live):**
- The "Generate architecture diagram" query will create a diagram during the demo!

---

## ✅ Pre-Recording Checklist

**Right before hitting record:**

### Technical
- [ ] Descript recording settings verified
- [ ] Shure SM-B audio levels tested (-12dB to -6dB)
- [ ] Chrome at http://localhost:3000
- [ ] Browser clean (no bookmarks/tabs)
- [ ] DevTools closed
- [ ] Test query works: "What is AOMA?"
- [ ] No console errors
- [ ] Progress indicator behaves correctly

### Environment
- [ ] Cheat sheet visible on second monitor
- [ ] Environment quiet
- [ ] Phone on Do Not Disturb
- [ ] Water nearby
- [ ] Good lighting (if using camera)

### Mental
- [ ] Deep breath taken
- [ ] Smile ready (you can hear it in your voice!)
- [ ] Confidence high - you know this system inside-out

---

## 🎬 Emergency Backup Lines

### If Something Breaks
- "Let me try that again..."
- "The response is still streaming, bear with me..."
- "This is why we have 59 automated tests..."
- "In production, this runs much faster..."

### If You Get Stuck
- "What's important here is..."
- "The key point is..."
- "Let me move on to show you..."

### If Demo Query Slow
- "While this processes, let me explain..."
- "Processing multi-source query across JIRA, Git, and documentation..."
- [Use the silence, trim in editing]

---

## 🚀 What NOT to Say

❌ "Live AOMA system integration"
❌ "Real-time production monitoring"
❌ "This connects directly to AOMA"

✅ "Proprietary AOMA documentation"
✅ "Development intelligence from multiple sources"
✅ "Strategic approach to enterprise AI"

---

## 📦 Demo Assets Inventory

### Existing Files ✅
1. ✅ `DEMO-FINAL-CHECKLIST.md` - Complete workflow
2. ✅ `docs/DEMO-4-MINUTE-BULLETS.md` - Bullet script
3. ✅ `docs/DEMO-SCRIPT-BULLETS.md` - Full talking points
4. ✅ `docs/DEMO_VIDEO_PLAN.md` - 2-minute product video plan
5. ✅ `docs/SIAM-MERMAID-DIAGRAMS.md` - 12 system diagrams
6. ✅ `docs/diagrams/` - 3 specific diagrams
7. ✅ `DEMO-READINESS-REPORT.md` - Technical verification
8. ✅ Localhost running at http://localhost:3000
9. ✅ AOMA-mesh-mcp server operational (v2.7.0)

### Files to Create 🔨
1. 🔨 `DEMO-RECORDING-CHEAT-SHEET.md` - Second monitor reference
2. 🔨 Rendered diagrams (PNG exports)
3. 🔨 Test all 4 demo queries

---

## 🎯 Next Actions (In Order)

### 1. Test Demo Queries (10 minutes)
```bash
# Open Chrome at localhost:3000
# Test each query, verify they work:
# 1. "What is AOMA?"
# 2. "Show me JIRA tickets related to AOMA migration and the related code commits"
# 3. "Generate a system architecture diagram for AOMA showing all integration points"
# 4. "Does AOMA have a blockchain integration?"
```

### 2. Create Cheat Sheet (5 minutes)
- Copy queries to a simple text file
- Add key talking points
- Enlarge font for easy reading

### 3. Render Priority Diagrams (10 minutes)
- Use Mermaid Live for Diagrams 1 and 6
- Export as PNG 1920x1080
- Save to docs/diagrams/exports/

### 4. Set Up Recording Environment (15 minutes)
- Follow Step-by-Step Recording Setup above
- Test audio levels
- Test one practice recording

### 5. Practice Run (10 minutes)
- Go through Segment A without recording
- Get comfortable with the flow
- Adjust talking points if needed

### 6. RECORD (45 minutes)
- Record all 3 segments
- Review each one
- Re-record if needed

### 7. EDIT (30 minutes)
- Splice segments in Descript
- Remove filler words
- Add captions
- Export MP4

---

## 🎉 You're Ready!

**Remember:**
- You know this system inside-out
- Descript can fix mistakes
- Segmented = less pressure
- First take doesn't have to be perfect
- Your charm will carry it

**This is your moment to showcase something genuinely innovative!**

---

## 📞 Support Resources

### Technical Issues
- SIAM codebase: `/Users/mcarpent/Documents/projects/siam`
- Test commands: See "Technical Verification" section above
- Console monitoring: Chrome DevTools → Console

### Demo Content
- Full script: `docs/DEMO-SCRIPT-BULLETS.md`
- 4-minute bullets: `docs/DEMO-4-MINUTE-BULLETS.md`
- Diagrams: `docs/SIAM-MERMAID-DIAGRAMS.md`

### Recording Help
- Descript docs: https://help.descript.com
- Shure SM-B guide: [In your hardware docs]
- Mermaid Live: https://mermaid.live

---

**Created**: October 29, 2025, 5:45 PM
**Status**: READY FOR RECORDING TONIGHT
**Deliverable**: MP4 video file, 4:00-4:15 runtime
**Delivery**: Tomorrow afternoon

🎬 **GO MAKE SOMETHING AWESOME!** 🎬
