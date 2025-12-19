# CDTEXT Skill - Quick Start Guide

Get the CDTEXT parsing skill running in **5 minutes**!

---

## 🚀 Setup (3 commands)

```bash
# 1. Upload knowledge to vector store
./scripts/upload-cdtext-knowledge.sh

# 2. Start dev server
infisical run --env=dev -- pnpm dev

# 3. Open browser
open http://localhost:3000
```

---

## 🧪 Test It (Copy-Paste)

### Test 1: Simple Album

**Paste this into chat:**
```
Can you parse this CDTEXT?

8000001C416D617A696E6720416C62756D0000C3A18101000854686520417274697374000000D2F88000011C536F6E67204F6E6500000000000000E8A28101011C54686520417274697374000000D2F88000021C536F6E672054776F00000000000000F1B38101021C416E6F746865722041727469737400A5C2
```

**Expected Output:**
```markdown
| Track | Type      | Value              |
|-------|-----------|--------------------|
| Album | TITLE     | Amazing Album      |
| Album | PERFORMER | The Artist         |
| 1     | TITLE     | Song One           |
| 1     | PERFORMER | The Artist         |
| 2     | TITLE     | Song Two           |
| 2     | PERFORMER | Another Artist     |
```

---

### Test 2: With ISRC Codes

**Paste this:**
```
Parse this DDP CDTEXT:

8000001C476F6C64656E204869747300000000B8F18101000852617920436861726C65730000C1D28E00011C55535243313132333435363700D4A18000011C47656F726769612000000000000000E2B38101011C52617920436861726C65730000C1D28E00021C555352433939383736353433D5F2
```

**Expected Output:**
```markdown
| Track | Type      | Value              |
|-------|-----------|--------------------|
| Album | TITLE     | Golden Hits        |
| Album | PERFORMER | Ray Charles        |
| 1     | TITLE     | Georgia            |
| 1     | PERFORMER | Ray Charles        |
| 1     | ISRC      | USRC11234567       |
| 2     | ISRC      | USRC99876543       |
```

---

## 🔧 If It Doesn't Work

### Issue 1: "I don't have information about CDTEXT"

**Cause:** Vector store retrieval not finding docs  
**Fix:**
```bash
# Check vector store has the docs
curl 'http://localhost:3000/api/knowledge/upload?organization=sony_music&division=digital_ops&app_under_test=aoma' | jq '.stats'

# Should show "knowledge" source with 2+ documents
# If not, re-run upload script
./scripts/upload-cdtext-knowledge.sh
```

---

### Issue 2: AI outputs gibberish instead of table

**Cause:** First iteration - hasn't learned yet  
**Fix:** Provide feedback:
```
The pack structure is:
- Byte 0: Pack type (0x80=TITLE, 0x81=PERFORMER)
- Byte 1: Track number (0=album, 1-99=tracks)
- Bytes 4-15: NULL-terminated ASCII text

Please parse it again using this structure and output as a markdown table.
```

Then store the successful pattern:
```
Store what you just learned about CDTEXT parsing in your knowledge base using ByteRover.
```

---

### Issue 3: System prompt not updated

**Cause:** Old server cache  
**Fix:**
```bash
# Kill dev server (Ctrl+C)
# Restart
infisical run --env=dev -- pnpm dev
```

---

## 🎬 Demo Mode

For recording demos, add this phrase:
```
I'm recording a demo - can you parse this CDTEXT and format it beautifully?

[paste hex here]
```

The AI will output extra-clean markdown perfect for screenshots.

---

## 📊 View Progress

Check what the AI has learned:
```
What have you learned about CDTEXT parsing?
```

The AI should summarize patterns stored in ByteRover.

---

## 🧠 Store New Patterns

After each successful parse:
```
Store this CDTEXT parsing pattern in ByteRover for future sessions.
```

After each error/correction:
```
Remember that [specific error] happens when [specific condition]. Store this as a pattern to avoid.
```

---

## ✅ Success Criteria

You know it's working when:
- [ ] Hex paste → Instant table output
- [ ] All pack types decoded correctly (TITLE, PERFORMER, ISRC, etc.)
- [ ] Track 0 shows as "Album"
- [ ] Tracks 1-99 show as numbers
- [ ] Text is clean (no hex codes, no NULL bytes visible)
- [ ] Output is demo-ready (no manual cleanup needed)

---

## 🔥 Advanced Usage

### Request Specific Formats

```
Parse this CDTEXT and output as JSON instead of a table.
```

```
Parse this CDTEXT and include the raw pack structure for debugging.
```

### Handle Errors

```
This CDTEXT has CRC errors - can you still parse it?

[paste hex with corrupted packs]
```

### Multi-Language

```
This CDTEXT has Japanese characters - can you parse it?
```

---

## 📚 More Examples

See `docs/cdtext-examples.md` for 5 complete test cases including:
- Simple album (2 tracks)
- Album with ISRC codes
- Corrupted packs (CRC errors)
- Unknown pack types
- Real-world DDP master

---

**Time Investment:**
- Setup: 3 minutes
- First successful parse: 2-5 minutes
- Production-ready (after iterations): 15-20 minutes

**Demo Impact:** 🔥🔥🔥

**Wow Factor:** Audio engineers will be **amazed** this works!

