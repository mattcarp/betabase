# SIAM Demo Screencast Script

**Format**: Side-by-side script for Playwright screencasts
**Meta-approach**: Using the system's test generation to demo itself

---

## The Three Pillars

1. **Chat** - Talk to the knowledge base
2. **Curate** - Correct and improve responses
3. **Test** - Self-healing automated tests

---

## Pre-Recording Setup

```bash
# Kill port and start fresh
npx kill-port 3000 && npm run dev

# Have these files ready:
# - A cdtext.bin file (real CD Text binary from a DDP master)

# Output location: ~/Desktop/playwright-screencasts/
# Resolution: 1920x1080 (auto-detected from screen)
# Format: .webm
```

---

## How to Record Each Segment

1. Navigate to **Test tab** > **AI Test Generator** subtab
2. In the prompt field, type the natural language description
3. Check **Record screencast** in Advanced Options
4. Enter target URL: `http://localhost:3000`
5. Click **Generate & Record**
6. Playwright opens Chrome, records the screencast, saves to Desktop

---

## SEGMENT 1: Landing Page (10 sec)

| Playwright Action | Narration |
|------------------|-----------|
| Navigate to landing page | *no narration - visual only* |
| Show three-pillar layout | *brief pause* |

---

## SEGMENT 2: Chat Pillar (3 chats)

### Chat 1: The Meta ERD Infographic (~60 sec)

*The system creates an infographic explaining its own database architecture*

| Playwright Action | Narration |
|------------------|-----------|
| Click Chat tab | *silent* |
| Type: "Hey, I'm doing a demo for my friends. Can you make an infographic of the ERD - just the top level - to show how the multi-tenant architecture works?" | *typing sounds* |
| Press Enter | *silent* |
| Loading state appears (30-50 sec) | "Nano Banana Pro generates infographics using Gemini..." |
| Infographic appears | "And there it is. The system just explained itself." |
| Point to Organization tier | "Organizations at the top - Sony Music, SMEJ, completely isolated." |
| Point to Division tier | "Divisions within each org." |
| Point to Application tier | "And the apps being tested - AOMA, Alexandria, USM." |

**Test Generation Input:**
```
Go to the Chat tab
Type "Hey, I'm doing a demo for my friends. Can you make an infographic of the ERD - just the top level - to show how the multi-tenant architecture works?"
Press Enter
Wait for the infographic to generate (30-50 seconds)
Verify an infographic image appears showing the multi-tenant architecture
```

---

### Chat 2: DDP and CD Text Parsing (~90 sec)

*The system parses a real binary file from a CD master, then generates code in another language*

| Playwright Action | Narration |
|------------------|-----------|
| Type: "I have this file that I think is from a DDP. Can you explain what a DDP spec is? How many bytes per sector? How many tracks can it have?" | *typing sounds* |
| Wait for response | "It knows the Red Book spec, sector sizes, everything." |
| Type: "I also have this cdtext.bin file - it's just jumbled hex. Can you make sense of it?" | *typing sounds* |
| Paste or upload the cdtext.bin hex content | *silent* |
| Wait for parsed response | "Watch this..." |
| Response shows parsed track listing table | "It decoded the binary. Track titles, performers, ISRCs." |
| Point to any non-English text with translation | "It even translates non-English metadata." |
| | |
| **The Showstopper:** | |
| Type: "Wow, you did that translation so quickly. Could you write that parser code so I can use it myself? Write it in Rust. And when you give your answer, write the text explanation in Mandarin Chinese." | *typing sounds* |
| Wait for response | "Now watch this..." |
| Response appears with Chinese text | "The explanation is in Mandarin." |
| Rust code block appears with Shiki formatting | "But the code is Rust. Production-ready." |
| Point to Chinese comments/explanation | "It code-switches effortlessly." |

**Test Generation Input:**
```
Type "I have this file from a DDP. Can you explain the DDP spec - bytes per sector, track limits?"
Wait for response explaining DDP format
Type "Here's a cdtext.bin file - it's just hex. Can you parse it?"
Paste the hex content of the cdtext.bin file
Wait for response with parsed track listing table
Verify the response shows track titles, performers, and ISRCs
Type "Wow, you did that translation so quickly. Could you write that parser code so I can use it myself? Write it in Rust. And when you give your answer, write the text explanation in Mandarin Chinese."
Wait for response
Verify the response contains Chinese characters in the explanation
Verify a Rust code block appears with syntax highlighting
```

**What the CD Text skill does:**
- Parses 18-byte packs from hex
- Decodes: TITLE (0x80), PERFORMER (0x81), ISRC (0x8E), etc.
- Track 0 = album metadata, Tracks 1-99 = individual tracks
- Translates non-English text (Italian to English with poetic meaning)
- Generates parser code in any language (Rust, Python, TypeScript, etc.)
- Can respond in any human language while keeping code in the target programming language

**NEW Enhanced Output (v0.24.54+):**
After parsing, the skill now adds rich context:

1. **Artist Spotlight Section:**
   - Full name, nationality, active years
   - Genre/style, albums sold worldwide
   - Notable hits, brief biography
   - Example: "Eros Ramazzotti - 70+ million albums sold, known as Italy's most successful international artist"

2. **Album Context Section:**
   - Release year and label (BMG/Ariola 2000)
   - Chart performance (#1 in Italy)
   - Album theme and significance

3. **Technical Deep Dive:**
   - What is CD-TEXT (Red Book extension)
   - DDP format explained (industry standard for CD masters)
   - ISRC code breakdown (NL = Netherlands, A20 = Sony Music/BMG registrant)

**CD Text Hex to Paste (Eros Ramazzotti album):**
```
80000000 5374696C 656C6962 65726F00 F7C18001 01004C27 4F6D6272 61204465 6C20A216 8001020C 47696761 6E746500 46756F63 D3F48002 03046F20 4E656C20 46756F63 6F0083ED 80030400 4C6F2053 70697269 746F2044 391E8003 050C6567 6C692041 6C626572 69008557 80040600 556E2041 6E67656C 6F204E6F 3CA18004 070C6E20 4527004C 27417175 696C6FAA 80050807 61204520 496C2043 6F6E646F 3D318005 090F7200 5069C3B9 20436865 2050ED00 80060A0A 756F6900 496C204D 696F2041 340A8007 0B086D6F 72652050 65722054 65003A60 80080C00 4520416E 636F7220 4D692043 BF648008 0D0C6869 65646F00 496D7072 6F76DD68 80090E06 76697361 204C7563 65204164 030C8009 0F0F2045 7374004E 656C6C27 417A4B15 800A1007 7A757272 6974C3A0 00416D69 37F2800B 11036361 20446F6E 6E61204D 69612726 800B120F 00506572 204D6520 50657220 2060800C 130B5365 6D707265 00000000 0000D11C 81001400 45726F73 2052616D 617A7A6F AE778100 150C7474 69000000 00000000 00001CC6 81091600 00000000 00000000 00000000 1B838600 17003734 33323137 39323233 32000008 87001800 00000000 00000000 00000000 B28D8E00 19003734 33323137 39323233 3230C7D2 8E001A0C 004E4C41 32303030 30303039 3D1E8E01 1B0B3300 4E4C4132 30303030 30306041 8E021C0A 3834004E 4C413230 30303030 0A788E03 1D093039 32004E4C 41323030 3030D584 8E041E08 30303839 004E4C41 32303030 E5568E05 1F073030 30383600 4E4C4132 30306471 8E062006 30303030 3935004E 4C413230 A2F98E07 21053030 30303039 31004E4C 4132D53E 8E082204 30303030 30303837 004E4C41 D0368E09 23033230 30303030 30383800 4E4CB9BB 8E0A2402 41323030 30303030 3934004E 2D1A8E0B 25014C41 32303030 30303039 30002270 8E0C2600 4E4C4132 30303030 30303835 66AA8E0C 270C0000 00000000 00000000 00007979 8F002800 00010C00 14030000 00000101 0E4C8F01 29000000 00000000 0F032A00 00005999 8F022A00 00000000 09000000 00000000 1A2200
```
*This is a real Eros Ramazzotti album - Italian text will be translated*

---

### Chat 3: JIRA Tickets + Code Display (~75 sec)

*Troubleshooting flow: problem → tickets → code*

| Playwright Action | Narration |
|------------------|-----------|
| Type: "I'm having a problem with asset ingestion timing out. Is there any information on this?" | *typing sounds* |
| Wait for response | *silent* |
| Response mentions JIRA tickets | "It found related tickets from our JIRA." |
| Point to ticket references (AOMA-1234 format) | "Real ticket keys with subject lines." |
| Show tickets styled as clickable links | "Click through to JIRA if you're on the VPN." |
| Response continues with context about the issue | *silent* |
| Response asks: "Would you like to see where this might be in the code? We had this working before." | "It can show the actual code." |
| Type: "Yes" or click yes | *silent* |
| Code block appears with Shiki/tokyo-night formatting | "Beautifully formatted with the tokyo-night theme." |
| Point to filename header | "File path right here." |
| Point to line numbers | "Line numbers for easy reference." |
| Response ends: "Is there anything else I can help you with?" | *silent* |

**Test Generation Input:**
```
Type "I'm having a problem with asset ingestion timing out. Is there any information on this?"
Wait for response
Verify the response mentions JIRA tickets in PROJECT-NUMBER format
Verify tickets appear as clickable links
When the response asks about showing code, type "Yes"
Wait for code block to appear
Verify the code block shows with syntax highlighting
Verify filename and line numbers are visible
```

**What happens:**
- JIRA skill surfaces 2-3 relevant tickets (e.g., AOMA-1234, AOMA-5678)
- Tickets display with key + subject line, styled as links
- System offers to show relevant code
- CodeBlock component renders with:
  - Shiki syntax highlighting
  - tokyo-night theme
  - Filename header with file icon
  - Line numbers
  - Copy button

---

## Summary: Chat Segment Features Demonstrated

| Chat | Feature | Tech |
|------|---------|------|
| 1 | Infographic generation | Nano Banana Pro (Gemini 3) |
| 2 | Binary file parsing | CD Text skill |
| 3 | JIRA integration | JIRA skill + clickable tickets |
| 3 | Code display | Shiki + tokyo-night theme |

---

## Recording Notes

### Timing Estimates
- Chat 1 (ERD): ~60 sec (30-50 sec generation wait)
- Chat 2 (CD Text + Rust/Chinese): ~90 sec
- Chat 3 (JIRA + Code): ~75 sec
- **Total Chat segment: ~4 min**

### Feature Status (Updated 2025-12-21)
**TESTED & WORKING:**
- [x] Nano Banana Pro infographic generation (v0.24.54)
  - Thinking mode ENABLED (Google Search grounding)
  - Updated `betabaseERD` template with correct Sony Music hierarchy
  - ~41 sec generation time, 2+ MB images
- [x] CD Text parsing skill (ENHANCED)
  - Parses Eros Ramazzotti album correctly
  - Beautiful shadcn table with Track, Title, Translation, ISRC
  - NEW: Artist Spotlight section (biography, albums sold, notable hits)
  - NEW: Album Context section (release info, chart performance)
  - NEW: Technical Deep Dive (DDP format, ISRC breakdown)

**TESTED & WORKING (v0.24.55):**
- [x] JIRA ticket display
  - Shows ticket IDs with titles (ITSM-54132 - TICKETS PORTADAS, etc.)
  - Skill loader now detects source types from RAG
  - Critical fix: RAG context was in catch block, moved to try block
- [x] Code display with Shiki/tokyo-night
  - Full TypeScript syntax highlighting
  - Shows AssetUploaderService with TUS upload handling
  - Key technical observations formatted nicely

**NEEDS TESTING:**
- [ ] Multi-language code generation (Rust parser)
- [ ] Mandarin Chinese response capability
- [ ] JIRA tickets as clickable markdown links (currently plain text)

### Files Needed
- `cdtext.bin` - Real CD Text binary (hex format)
- Example hex for demo if needed

### Shiki/Tokyo-Night
The code formatter uses Shiki (created by Evan You, who is Chinese not Japanese - but tokyo-night is indeed the theme name). It provides:
- Premium syntax highlighting
- Dark theme optimized for readability
- Filename headers
- Line numbers
- Copy functionality

---

## SEGMENT 3: Test Pillar (~75 sec)

*Self-healing tests - AI-powered test maintenance that eliminates brittle test syndrome*

**See also:** [PILLAR-3-TEST-DEMO-SCRIPT.md](../PILLAR-3-TEST-DEMO-SCRIPT.md) for detailed narration

### Dashboard Overview (10 sec)

| Playwright Action | Narration |
|------------------|-----------|
| Click Test tab | *silent* |
| Dashboard loads | "The Test Dashboard gives real-time visibility into your entire test suite." |
| Point to stats | "8,719 tests, 12,177 executions, 80% pass rate." |

---

### Self-Healing - Star Feature (30 sec)

| Playwright Action | Narration |
|------------------|-----------|
| Click "Self-Healing" sub-tab | *silent* |
| Stats display | "Here's where the magic happens." |
| Point to 1,247 monitored | "We're monitoring 1,247 tests." |
| Point to 1,089 auto-healed | "1,089 have been automatically healed." |
| Point to 94.2% success | "That's a 94% success rate." |
| Point to 3.1s avg time | "Average heal time: 3.1 seconds." |
| | "When a button moves or a class name changes, the AI recognizes the intent and updates selectors automatically." |
| | "No more brittle tests breaking every sprint." |

---

### Historical Tests (15 sec)

| Playwright Action | Narration |
|------------------|-----------|
| Click "Historical Tests" sub-tab | *silent* |
| Table loads with 8,719 tests | "Historical Tests lets you explore your entire test library." |
| Use filter/search | "Filter by status, search by name." |
| Click a test row | "Drill into any test for execution history." |

---

### RLHF Tests (10 sec)

| Playwright Action | Narration |
|------------------|-----------|
| Click "RLHF Tests" sub-tab | *silent* |
| Dashboard loads | "RLHF Tests are auto-generated from curator corrections." |
| Point to "13 generated/week" | "When a human corrects an AI response, we create a regression test." |
| | "14 tests generated, 7 currently passing." |

---

### Optional: Impact Metrics / Live Monitor (10 sec)

| Playwright Action | Narration |
|------------------|-----------|
| Click "Impact Metrics" | "Impact Metrics show testing affects real outcomes." |
| Point to feedback stats | "3.43 average rating from 240 submissions." |

---

### Test Segment Key Stats

| Metric | Value |
|--------|-------|
| Total tests | 8,719 |
| Executions | 12,177 |
| Pass rate | 80.4% |
| Self-healed | 1,089 |
| Heal success rate | 94.2% |
| Avg heal time | 3.1s |
| RLHF tests generated | 14 |
| Generated per week | 13 |

---

## SEGMENT 4: Curate Pillar (~75 sec)

*RLHF in action - Human expertise teaching AI, creating a feedback loop*

**The Story**: AI needs human judgment. Curators review AI responses, mark what's relevant, correct mistakes, and that feedback becomes training data.

**Recording Scripts**: `scripts/record-curate-video-1.ts`, `record-curate-video-2.ts`, `record-curate-video-3.ts`

---

### Curate 1: Document Relevance Marking (~25 sec)

*Demonstrates: AI needs human judgment*

| Playwright Action | Narration |
|------------------|-----------|
| Click Curate tab | *silent* |
| Wait for Curate panel to load | "The Curate tab is where human expertise meets AI learning." |
| Click RLHF sub-tab | *silent* |
| RLHF interface loads | "RLHF - Reinforcement Learning from Human Feedback." |
| Click on a feedback card | "Each card represents an AI response that needs review." |
| Card expands showing context | "Here's a question about asset configuration." |
| Click thumbs up (Helpful) | "This response was helpful - one click." |
| Click "Relevant" on a document | "Mark which retrieved documents were actually useful." |
| Click "Not Relevant" on another | "And which ones missed the mark." |
| Click Submit/Save | *silent* |
| Toast confirmation appears | "That's one feedback cycle - 10 seconds of expertise captured forever." |

**Test Generation Input:**
```
Click Curate tab
Wait for Curate panel to load
Click RLHF sub-tab
Click on the first feedback card to expand it
Click thumbs up / Helpful button
Click Relevant on a document
Click Not Relevant on another document
Click Submit
Verify toast confirmation appears
```

---

### Curate 2: Correction Flow (~30 sec)

*Demonstrates: AI learns from human expertise*

| Playwright Action | Narration |
|------------------|-----------|
| Already on RLHF tab | *continuing from previous* |
| Click on a different feedback card | "Here's one where the AI got it wrong." |
| Card expands | *silent* |
| Click thumbs DOWN (Not Helpful) | "Thumbs down - this response needs work." |
| Correction textarea appears | "Now I can type the correct answer." |
| Type: "Per Q3 policy update: Use the new asset classification system. See KB-2847 for details." | *visible typing, ~35 char/sec* |
| | "I'm adding institutional knowledge the AI doesn't have." |
| Click Submit | *silent* |
| Toast: "Correction saved" | "That correction becomes training data." |
| | "Next time someone asks this, the AI will know." |

**Test Generation Input:**
```
Click on a feedback card
Click thumbs down / Not Helpful button
Click in the correction textarea
Type "Per Q3 policy update: Use the new asset classification system. See KB-2847 for details."
Click Submit
Verify toast confirmation appears
```

**What's Happening Behind the Scenes:**
- Correction stored in `human_corrections` table
- Linked to original query + AI response
- Used for fine-tuning and RAG improvement
- Creates regression test in Test pillar (RLHF Tests)

---

### Curate 3: Quality Review / Metrics (~20 sec)

*Demonstrates: Cumulative impact over time*

| Playwright Action | Narration |
|------------------|-----------|
| Click Overview tab (in Curate) | "The Overview shows the cumulative impact." |
| Stats cards visible | *silent* |
| Click on Total Feedback stat card | "Total feedback received." |
| Click on filter dropdown | "Filter by status, time period." |
| Select an option | *silent* |
| Click back to RLHF tab | *silent* |
| Click on a feedback card | "Drill into any feedback item." |
| Toggle a checkbox/switch if visible | *silent* |
| Click back to Overview | *silent* |
| Hover over chart element | "Hover for detailed metrics." |
| Tooltip shows data | "The AI improves because humans invest their expertise." |

**Test Generation Input:**
```
Click Overview tab in Curate
Click on a stats card
Click on a filter dropdown
Select a filter option
Click RLHF tab
Click on a feedback card
Click back to Overview
Hover over a chart element
Verify tooltip appears with data
```

---

### Curate Segment Key Stats

| Metric | What It Shows |
|--------|---------------|
| Total Feedback | Number of AI responses reviewed |
| Helpful Rate | % marked as helpful |
| Corrections Made | Human expertise captured |
| Documents Marked | Relevance training for retrieval |
| Training Impact | How corrections improve AI |

---

### Curate Recording Notes

**Timing:**
- Curate 1 (RLHF Workflow): ~25 sec
- Curate 2 (Correction Flow): ~30 sec
- Curate 3 (Quality Review): ~20 sec
- **Total Curate segment: ~75 sec**

**Technical Notes:**
- All recordings use 1920x1080 viewport
- No `slowMo` - use explicit `sleep()` for pacing
- Click + wait pattern: `click()` then `sleep(2000-3000ms)`
- Restart dev server between recording sessions if clicks stop registering

**Key Message:**
"Every thumbs up, every correction, every relevance mark - it all feeds back. The AI doesn't just respond, it learns. Human expertise becomes institutional memory."

---

## Summary: All Three Pillars

| Pillar | Duration | Key Demo |
|--------|----------|----------|
| Chat | ~4 min | ERD infographic, CD Text parsing, JIRA+code |
| Test | ~75 sec | Self-healing tests (94% success), 8,719 monitored |
| Curate | ~75 sec | RLHF feedback loop, corrections become training |

**Total Runtime: ~6 minutes**

---

*Last updated: 2025-12-22*
