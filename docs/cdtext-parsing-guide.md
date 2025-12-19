# CDTEXT Binary Format - Parsing Guide

## What is CDTEXT?

CDTEXT is a binary format embedded in CD audio discs to store metadata like:
- Track titles
- Artist names
- Album title
- ISRC codes
- Genre
- Performer information

**Key Characteristics:**
- Binary format (not human-readable)
- Defined by Red Book standard extension
- Pack-based structure (18 bytes per pack)
- Multiple language support
- CRC error checking

---

## Binary Structure

### Pack Format (18 bytes total)

```
Byte 0: Pack Type ID
Byte 1: Track Number
Byte 2: Sequence Number  
Byte 3: Block Character Position
Bytes 4-15: Data (12 bytes of actual content)
Bytes 16-17: CRC checksum
```

### Pack Type IDs (Critical!)

| ID (Hex) | Type | Description |
|----------|------|-------------|
| 0x80 | TITLE | Album/Track title |
| 0x81 | PERFORMER | Artist/Performer name |
| 0x82 | SONGWRITER | Songwriter information |
| 0x83 | COMPOSER | Composer information |
| 0x84 | ARRANGER | Arranger information |
| 0x85 | MESSAGE | Message to listener |
| 0x86 | DISC_ID | Disc identification |
| 0x87 | GENRE | Genre code |
| 0x8e | ISRC | ISRC code |
| 0x8f | SIZE_INFO | Size information |

---

## Parsing Algorithm

### Step 1: Validate Input
```
1. Check if input is hexadecimal string
2. Verify length is multiple of 18 bytes (36 hex chars)
3. Validate CRC for each pack
```

### Step 2: Extract Packs
```
For each 18-byte pack:
  - Extract pack type (byte 0)
  - Extract track number (byte 1)
  - Extract data bytes (bytes 4-15)
  - Verify CRC (bytes 16-17)
```

### Step 3: Decode Text Data
```
- Text is NULL-terminated ASCII
- Pack sequences may span multiple packs
- Track 0 = album-level metadata
- Track 1-99 = individual tracks
```

### Step 4: Group by Track/Type
```
Group packs by:
  - Track number (byte 1)
  - Pack type (byte 0)
  
Output format:
  Track 0 (Album):
    - Title: [decoded string]
    - Performer: [decoded string]
  Track 1:
    - Title: [decoded string]
    - Performer: [decoded string]
```

---

## Example Binary Data

### Example 1: Album Title Pack
```
Hex: 8000001C416D617A696E6720416C62756D0000C3A1
Breakdown:
  80 = TITLE pack type
  00 = Track 0 (album-level)
  00 = Sequence 0
  1C = Block char position
  41 6D 61 7A 69 6E 67 20 41 6C 62 75 6D 00 = "Amazing Album\0"
  C3 A1 = CRC
```

**Decoded Output:**
```
Track: Album (0)
Type: TITLE
Value: "Amazing Album"
```

### Example 2: Track 1 Performer
```
Hex: 8101000854686520417274697374000000D2F8
Breakdown:
  81 = PERFORMER pack type
  01 = Track 1
  00 = Sequence 0
  08 = Block char position
  54 68 65 20 41 72 74 69 73 74 00 = "The Artist\0"
  D2 F8 = CRC
```

**Decoded Output:**
```
Track: 1
Type: PERFORMER  
Value: "The Artist"
```

---

## Common Parsing Errors & Solutions

### Error 1: "Invalid pack length"
**Cause:** Input not multiple of 36 hex characters (18 bytes)
**Fix:** Pad or truncate to valid length, warn user

### Error 2: "CRC mismatch"
**Cause:** Data corruption or incorrect CRC calculation
**Fix:** Mark pack as potentially corrupt, decode anyway (best effort)

### Error 3: "Unknown pack type"
**Cause:** Reserved or vendor-specific pack type
**Fix:** Display as "UNKNOWN (0xXX)" with raw data

### Error 4: "Incomplete text sequence"
**Cause:** Missing continuation packs
**Fix:** Mark as incomplete, show partial data with "[incomplete]" suffix

---

## Output Format for Users

### Table Format (Recommended)
```
| Track | Type      | Value              |
|-------|-----------|--------------------|
| Album | TITLE     | Amazing Album      |
| Album | PERFORMER | Various Artists    |
| 1     | TITLE     | Song One           |
| 1     | PERFORMER | The Artist         |
| 1     | ISRC      | USRC11234567       |
| 2     | TITLE     | Song Two           |
| 2     | PERFORMER | Another Artist     |
```

### JSON Format (Alternative)
```json
{
  "album": {
    "title": "Amazing Album",
    "performer": "Various Artists"
  },
  "tracks": [
    {
      "number": 1,
      "title": "Song One",
      "performer": "The Artist",
      "isrc": "USRC11234567"
    }
  ]
}
```

---

## Validation Rules

### Required Fields
- Every disc MUST have album title (pack 0x80, track 0)
- Every track SHOULD have title (pack 0x80, track N)

### Optional Fields
- ISRC codes (highly recommended for commercial releases)
- Performer/artist info
- Genre codes

### Length Limits
- Title: max 160 characters (multi-pack sequences)
- Performer: max 160 characters
- ISRC: exactly 12 characters

---

## Advanced Features

### Multi-Language Support
- Language blocks identified by size info pack (0x8F)
- Each language has separate pack sequences
- First language (0) is default

### Character Encoding
- Standard: ISO 8859-1 (Latin-1)
- Extended: MS-JIS for Japanese CDs
- UTF-8 NOT supported (legacy format)

---

## Demo Scenarios

### Scenario 1: Simple Album
User pastes short CDTEXT with album + 2 tracks
→ System should decode and display clean table in <5 seconds

### Scenario 2: Complex Multi-Track
User pastes full album (15 tracks) with ISRC codes
→ System should handle multi-pack sequences correctly

### Scenario 3: Corrupted Data
User pastes CDTEXT with CRC errors
→ System should warn but still attempt decode (best effort)

### Scenario 4: Unknown Pack Types
User pastes vendor-specific CDTEXT with custom packs
→ System should show known packs, mark unknown as "CUSTOM (0xXX)"

---

**Skill Improvement Targets:**
1. **Accuracy**: Correctly decode pack types and track assignments
2. **Error Handling**: Graceful degradation for corrupted/incomplete data
3. **Presentation**: Beautiful table output with clear labels
4. **Speed**: Parse and display in <3 seconds for typical album

**Success Criteria:**
- User says "that's perfect!" after seeing output
- No manual corrections needed
- Handles edge cases without crashing
- Output is immediately demo-ready

