# CDTEXT Examples - For Testing & Iteration

## Example 1: Simple Album (2 tracks)

### Raw CDTEXT (Hex String)
```
8000001C416D617A696E6720416C62756D0000C3A18101000854686520417274697374000000D2F88000011C536F6E67204F6E6500000000000000E8A28101011C54686520417274697374000000D2F88000021C536F6E672054776F00000000000000F1B38101021C416E6F746865722041727469737400A5C2
```

### Expected Parsed Output
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

## Example 2: Album with ISRC Codes

### Raw CDTEXT (Hex String)
```
8000001C476F6C64656E204869747300000000B8F18101000852617920436861726C65730000C1D28E00011C55535243313132333435363700D4A18000011C47656F726769612000000000000000E2B38101011C52617920436861726C65730000C1D28E00021C555352433939383736353433D5F2
```

### Expected Parsed Output
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

## Example 3: Corrupted Pack (CRC Error)

### Raw CDTEXT (Hex String)
```
8000001C42726F6B656E20416C62756D00000000FFFF8101000854686520417274697374000000D2F8
```

### Expected Behavior
- **Pack 1 (Album Title)**: CRC invalid (FFFF) - mark as "⚠️ CRC Error" but still decode
- **Pack 2 (Performer)**: CRC valid - decode normally

### Expected Parsed Output
```markdown
| Track | Type      | Value              | Notes      |
|-------|-----------|--------------------|-----------| 
| Album | TITLE     | Broken Album       | ⚠️ CRC Error |
| Album | PERFORMER | The Artist         |            |
```

---

## Example 4: Unknown Pack Type

### Raw CDTEXT (Hex String)
```
8000001C4E6F726D616C205469746C6500000000C3A1FF01000812345678901234567890D4B2
```

### Expected Behavior
- **Pack 1 (0x80 - TITLE)**: Known type - decode normally
- **Pack 2 (0xFF - UNKNOWN)**: Unknown type - show raw hex

### Expected Parsed Output
```markdown
| Track | Type          | Value              |
|-------|---------------|--------------------| 
| Album | TITLE         | Normal Title       |
| 1     | UNKNOWN (0xFF)| 12 34 56 78 90 ... |
```

---

## Example 5: Real-World DDP Master (Simplified)

### Scenario
User is working on a DDP master for a Sony Music release and wants to verify CDTEXT

### Raw CDTEXT (Hex String)
```
8000001C5468652042657374204F660000000000A1C38101000841646F6D6972616C00000000D8F28700001C504F5000000000000000000000E9D28E00011C555352433230323530313233D1A28000011C426C75652050616369666963000000F8B38101011C41646F6D6972616C00000000D8F28000021C536561626564000000000000000000E1D18101021C41646F6D6972616C00000000D8F2
```

### Expected Parsed Output
```markdown
| Track | Type      | Value              |
|-------|-----------|--------------------|
| Album | TITLE     | The Best Of        |
| Album | PERFORMER | Adomiral           |
| Album | GENRE     | POP                |
| 1     | TITLE     | Blue Pacific       |
| 1     | PERFORMER | Adomiral           |
| 1     | ISRC      | USRC20250123       |
| 2     | TITLE     | Seabed             |
| 2     | PERFORMER | Adomiral           |
```

---

## Testing Prompts for AI

### Test 1: Basic Parsing
```
Can you decode this CDTEXT?
[paste Example 1 hex]
```

**Expected AI Behavior:**
1. Recognize it's CDTEXT binary
2. Parse packs correctly
3. Output clean table
4. No errors or warnings

---

### Test 2: Error Handling
```
I have a CDTEXT with some errors - can you still parse it?
[paste Example 3 hex with CRC error]
```

**Expected AI Behavior:**
1. Detect CRC error in pack 1
2. Still decode the data (best effort)
3. Include warning in output
4. Parse pack 2 normally

---

### Test 3: Professional Demo
```
I'm recording a demo about DDP mastering. Can you parse this CDTEXT and format it nicely?
[paste Example 5 hex]
```

**Expected AI Behavior:**
1. Parse all packs including GENRE and ISRC
2. Output beautiful markdown table
3. Professional presentation (no tech jargon)
4. Ready to screenshot for demo slide

---

## Iteration Improvement Path

### Iteration 1 (Expected First Attempt)
- ❌ May confuse pack types
- ❌ May not handle multi-byte text correctly
- ❌ May crash on invalid CRC
- ✅ Should recognize hexadecimal format

**Feedback to AI:** "The pack types are wrong - 0x80 is TITLE, not PERFORMER. Also, you need to decode bytes 4-15 as ASCII text."

---

### Iteration 2 (After Feedback)
- ✅ Pack types correct
- ✅ ASCII decoding works
- ❌ May not group by track number
- ❌ May show one row per pack instead of grouped

**Feedback to AI:** "Good! But please group all metadata by track. Track 0 is 'Album', tracks 1-99 are individual tracks."

---

### Iteration 3 (Getting Better)
- ✅ Pack types correct
- ✅ Grouped by track
- ❌ May not handle NULL terminators (\x00)
- ❌ May show raw bytes instead of strings

**Feedback to AI:** "Almost perfect! The text data is NULL-terminated ASCII. Decode bytes 4-15 as characters and stop at the first \x00."

---

### Iteration 4 (Should Be Perfect)
- ✅ Pack types correct
- ✅ Grouped by track
- ✅ NULL-terminated ASCII handled
- ✅ Beautiful table output
- ✅ Ready for demo

**Feedback to AI:** "That's perfect! This is exactly what I need for the demo."

---

## Success Metrics

### Parsing Accuracy
- [ ] 100% correct pack type identification
- [ ] 100% correct track grouping
- [ ] 100% correct ASCII decoding

### Error Resilience
- [ ] Handles CRC errors gracefully
- [ ] Shows unknown pack types without crashing
- [ ] Warns on incomplete data

### Demo Readiness
- [ ] Clean table output (markdown)
- [ ] Professional labels (no hex codes in main view)
- [ ] < 3 second response time
- [ ] User says "that's perfect!"

---

**How to Use This Document:**
1. Upload to vector store (source_type: "knowledge")
2. System retrieves when user mentions "CDTEXT" or "DDP"
3. Use examples for iterative testing
4. Store successful parsing patterns in ByteRover
5. Update system prompt with learned heuristics

**Integration with ByteRover:**
- After each successful iteration, store what worked
- After each error, store what to avoid
- Build up "CDTEXT parsing expert" knowledge over time

