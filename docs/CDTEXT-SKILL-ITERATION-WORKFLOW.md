# CDTEXT Skill - Iterative Learning Workflow

This document explains how to teach the Betabase chat system the CDTEXT parsing skill through **iterative feedback and ByteRover knowledge storage**.

---

## 🎯 Goal

Teach the AI to parse binary CDTEXT files and output beautiful tables - a demo-worthy skill that showcases:
- **Chat Pillar**: Complex binary parsing with domain knowledge
- **Curate Pillar**: Iterative improvement through feedback
- **ByteRover**: Pattern storage and retrieval across sessions

---

## 🏗️ Architecture (Three Layers)

### Layer 1: Vector Store (Foundation)
**What:** CDTEXT specification and examples  
**Where:** `siam_vectors` table (source_type = 'knowledge')  
**How:** Upload via `/api/knowledge/upload`  
**Why:** Provides base knowledge for retrieval during queries

### Layer 2: System Prompt (Skills)
**What:** Parsing algorithm and output format instructions  
**Where:** `src/app/api/chat/route.ts` lines 920-960 (approx)  
**How:** Added to `enhancedSystemPrompt` template  
**Why:** Tells the LLM *how* to use the retrieved knowledge

### Layer 3: ByteRover (Iterative Learning)
**What:** Patterns that worked, errors to avoid, edge cases  
**Where:** ByteRover MCP knowledge graph  
**How:** Store after each successful/failed parse  
**Why:** System remembers what works across sessions

---

## 📋 Setup Steps

### Step 1: Upload Knowledge Documents

```bash
# From project root
./scripts/upload-cdtext-knowledge.sh
```

This uploads:
- `docs/cdtext-parsing-guide.md` → Specification and algorithm
- `docs/cdtext-examples.md` → Test cases and expected outputs

**Verify:**
```bash
curl 'http://localhost:3000/api/knowledge/upload?organization=sony_music&division=digital_ops&app_under_test=aoma' | jq '.stats'
```

You should see 2 new documents with `category: "audio_mastering"`.

---

### Step 2: Start Dev Server

```bash
infisical run --env=dev -- pnpm dev
```

Navigate to http://localhost:3000

---

### Step 3: First Parse Attempt (Expect Failure!)

**Query:**
```
Can you parse this CDTEXT?

8000001C416D617A696E6720416C62756D0000C3A18101000854686520417274697374000000D2F88000011C536F6E67204F6E6500000000000000E8A28101011C54686520417274697374000000D2F88000021C536F6E672054776F00000000000000F1B38101021C416E6F746865722041727469737400A5C2
```

**Expected First Attempt:**
- ❌ May not recognize it as CDTEXT
- ❌ May confuse pack types
- ❌ May output raw hex instead of decoded text
- ✅ Should try to help

**What You'll See:**
> "I see a hexadecimal string. This looks like binary data - could you tell me what format this is?"

---

### Step 4: Provide Corrective Feedback

**Your Response:**
```
This is CDTEXT - a binary format for CD metadata. Each 18-byte pack has:
- Byte 0: Pack type (0x80=TITLE, 0x81=PERFORMER)
- Byte 1: Track number (0=album, 1-99=tracks)
- Bytes 4-15: ASCII text data (NULL-terminated)

Can you try parsing it again using this structure?
```

**Expected Second Attempt:**
- ✅ Recognizes pack structure
- ❌ May still have ASCII decoding issues
- ❌ May not group by track

---

### Step 5: Store the Learning in ByteRover

**After successful parse, run:**

```
MANUALLY in chat: "Can you store what you learned about CDTEXT parsing in your knowledge base?"
```

**AI should call:**
```typescript
byterover-store-knowledge: "CDTEXT parsing pattern learned:
- Format: 18-byte packs in hex (36 hex chars per pack)
- Pack structure: [Type][Track][Seq][Block][Data:12][CRC:2]
- Pack type 0x80 = TITLE, 0x81 = PERFORMER, 0x8E = ISRC
- Data bytes 4-15 are NULL-terminated ASCII
- Track 0 = album metadata, tracks 1-99 = individual tracks
- Output format: Markdown table grouped by track
- Example hex: 8000001C = TITLE pack for album (track 0)
- Decode bytes as: String.fromCharCode(...bytes).split('\\x00')[0]"
```

---

### Step 6: Test Retrieval in Next Session

**New session, query:**
```
How do I parse CDTEXT binary data?
```

**Expected Response:**
> "CDTEXT is parsed in 18-byte packs. Each pack contains a type ID (0x80 for title, 0x81 for performer), track number, and 12 bytes of NULL-terminated ASCII data. I can help you decode a CDTEXT file if you paste the hex string."

**Verify ByteRover worked:**
The AI remembered the pattern without you re-explaining!

---

## 🔄 Iteration Cycle (Repeat Until Perfect)

```
┌─────────────────────────────────────────┐
│ 1. User provides CDTEXT hex             │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 2. AI attempts parse                    │
│    (retrieves docs/cdtext-*.md)         │
│    (retrieves ByteRover patterns)       │
└──────────────┬──────────────────────────┘
               │
               ▼
         ┌────────────┐
         │ Success?   │
         └─────┬──────┘
               │
        ┌──────┴───────┐
        │              │
       NO             YES
        │              │
        ▼              ▼
┌─────────────┐  ┌──────────────────────┐
│ 3a. User    │  │ 3b. User confirms:   │
│  provides   │  │  "That's perfect!"   │
│  feedback   │  │                      │
└──────┬──────┘  └──────────┬───────────┘
       │                    │
       │                    ▼
       │         ┌────────────────────────┐
       │         │ 4. Store success       │
       │         │    pattern in ByteRover│
       │         └────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ 4a. Store error pattern in ByteRover    │
│     ("Don't do X, it causes Y")         │
└──────────────┬──────────────────────────┘
               │
               └──────► REPEAT
```

---

## 📊 Tracking Progress

### Success Metrics

| Iteration | Pack Type Accuracy | Track Grouping | ASCII Decode | Table Format | User Rating |
|-----------|-------------------|----------------|--------------|--------------|-------------|
| 1         | 0%                | ❌             | ❌           | ❌           | 1/5         |
| 2         | 50%               | ❌             | ❌           | ❌           | 2/5         |
| 3         | 100%              | ✅             | ❌           | ❌           | 3/5         |
| 4         | 100%              | ✅             | ✅           | ❌           | 4/5         |
| 5         | 100%              | ✅             | ✅           | ✅           | 5/5 ✅      |

### ByteRover Knowledge Growth

After each iteration, check ByteRover memory:
```
byterover-retrieve-knowledge: "CDTEXT parsing patterns"
```

You should see accumulating knowledge:
- **Iteration 1**: "CDTEXT is 18-byte packs"
- **Iteration 2**: "Pack type 0x80 is TITLE, not PERFORMER"
- **Iteration 3**: "Must group packs by track number (byte 1)"
- **Iteration 4**: "ASCII decode bytes 4-15, stop at NULL (\\x00)"
- **Iteration 5**: "Output as markdown table with Track | Type | Value columns"

---

## 🎬 Demo Script (Once Perfect)

### Setup
```bash
# Terminal 1: Dev server
infisical run --env=dev -- pnpm dev

# Terminal 2: CapCut recording ready
# Browser: http://localhost:3000 (incognito, full screen)
```

### Demo Flow

**🎤 Narration:**
> "This system can parse specialized binary formats like CDTEXT - the metadata format used in CD mastering. Watch this."

**👨‍💻 Action:**
Paste Example 5 from `docs/cdtext-examples.md`:
```
Can you decode this CDTEXT from a DDP master?

8000001C5468652042657374204F660000000000A1C38101000841646F6D6972616C00000000D8F28700001C504F5000000000000000000000E9D28E00011C555352433230323530313233D1A28000011C426C75652050616369666963000000F8B38101011C41646F6D6972616C00000000D8F28000021C536561626564000000000000000000E1D18101021C41646F6D6972616C00000000D8F2
```

**🤖 AI Response (Expected):**
> Here's the decoded CDTEXT:
>
> | Track | Type      | Value              |
> |-------|-----------|--------------------|
> | Album | TITLE     | The Best Of        |
> | Album | PERFORMER | Adomiral           |
> | Album | GENRE     | POP                |
> | 1     | TITLE     | Blue Pacific       |
> | 1     | PERFORMER | Adomiral           |
> | 1     | ISRC      | USRC20250123       |
> | 2     | TITLE     | Seabed             |
> | 2     | PERFORMER | Adomiral           |

**🎤 Narration:**
> "Instantly parsed. This is binary data that normally requires specialized software - but our system learned this skill through iterative training. And it gets better every time someone uses it."

**💡 Bonus:**
> "Want to see the raw binary structure?" → AI can explain pack-by-pack breakdown if asked

---

## 🧠 ByteRover Storage Examples

### After Successful Parse
```javascript
byterover-store-knowledge({
  messages: `CDTEXT Parsing - Successful Pattern (Iteration 5):

Algorithm that works:
1. Split hex string into 36-char chunks (18 bytes)
2. For each chunk:
   - byte[0] → pack type (use lookup: 0x80=TITLE, 0x81=PERFORMER, 0x8E=ISRC)
   - byte[1] → track number (0=Album, 1-99=tracks)
   - bytes[4-15] → ASCII data
3. Decode ASCII: bytes.map(b => String.fromCharCode(parseInt(b, 16))).join('').split('\\x00')[0]
4. Group by track number
5. Output markdown table

Example that worked perfectly:
Input: 8000001C416D617A696E6720416C62756D0000C3A1
Output: Track: Album, Type: TITLE, Value: "Amazing Album"

Key insights:
- Always check for NULL terminator (\\x00 = 0x00)
- Track 0 should display as "Album" not "0"
- Unknown pack types (>0x8F) should show as "UNKNOWN (0xXX)"
- CRC errors (bytes 16-17) don't prevent decoding - warn but continue`
});
```

### After Error/Failure
```javascript
byterover-store-knowledge({
  messages: `CDTEXT Parsing - Error Pattern to Avoid:

WRONG APPROACH (Iteration 2):
- Tried to decode entire hex string as one ASCII blob
- Result: Garbled output with control characters
- Why it failed: Didn't respect pack structure

CORRECT APPROACH:
- Must parse pack-by-pack (18 bytes each)
- Only bytes 4-15 of each pack contain text data
- Bytes 0-3 are metadata, bytes 16-17 are CRC

Lesson: Binary formats require structured parsing, not bulk text decode.`
});
```

---

## 🚀 Advanced: Adding More Skills

This same workflow can teach:
- **DDP file parsing** (audio mastering)
- **ISRC validation** (music metadata)
- **Audio file analysis** (WAV headers, sample rates)
- **Subtitle file parsing** (SRT, VTT)

**Pattern:**
1. Create docs/[skill]-guide.md
2. Create docs/[skill]-examples.md
3. Add skill section to system prompt
4. Upload to vector store
5. Iterate with ByteRover feedback
6. Demo when perfect!

---

## ✅ Success Checklist

- [ ] Knowledge docs uploaded to vector store
- [ ] System prompt includes CDTEXT skill section
- [ ] First parse attempted (expect failure)
- [ ] Feedback provided and second attempt made
- [ ] Success pattern stored in ByteRover
- [ ] Error patterns stored in ByteRover
- [ ] Third attempt uses retrieved ByteRover knowledge
- [ ] User confirms "that's perfect!"
- [ ] Demo recording successful
- [ ] Skill is production-ready

---

**This workflow demonstrates:**
- ✅ **RAG knowledge retrieval** (vector store docs)
- ✅ **System prompt engineering** (skill instructions)
- ✅ **Iterative learning** (ByteRover memory)
- ✅ **RLHF-like improvement** (user feedback loop)
- ✅ **Demo-ready output** (beautiful tables)

**Time to perfect:** ~5-7 iterations (15-20 minutes)  
**Demo impact:** 🔥🔥🔥 (very impressive for non-AI audiences)


