# CD Text Format - GNU libcdio Official Specification

**Source:** https://www.gnu.org/software/libcdio/cd-text-format.html  
**Copyright:** © 2011-2012 Thomas Schmitt, Rocky Bernstein  
**License:** Permission granted to copy, modify, and distribute with source attribution

---

## Overview

CD Text provides a way to store disc and track metadata in audio CDs. This information is displayed by CD players and reading software.

**Storage Location:** Sub-channel of the Lead-in area of the disc  
**Structure:** Organized into blocks (languages) and packs (categories)  
**Capacity:** Up to 8 language blocks, 253 packs per block, 12 bytes payload per pack

---

## Pack Structure (18 bytes total)

Each CD Text pack is exactly **18 bytes**:

| Byte Position | Field | Description |
|---------------|-------|-------------|
| 0 | Pack Type ID | Category identifier (0x80–0x8f) |
| 1 | Track Number | 0 = disc/album, 1-99 = individual tracks |
| 2 | Sequence Number | For multi-pack text sequences |
| 3 | Block Character Position | Offset within block |
| 4-15 | Data | 12 bytes of payload (text or binary) |
| 16-17 | CRC | Checksum for error detection |

---

## Pack Type IDs (Categories)

### Text Pack Types (0x80–0x85, 0x8e)

| Pack Type | Category | Applies To | Data Format |
|-----------|----------|------------|-------------|
| **0x80** | **Title** | Disc and each track | Text (NULL-terminated) |
| **0x81** | **Performers** | Disc and each track | Text (NULL-terminated) |
| **0x82** | **Songwriters** | Disc and each track | Text (NULL-terminated) |
| **0x83** | **Composers** | Disc and each track | Text (NULL-terminated) |
| **0x84** | **Arrangers** | Disc and each track | Text (NULL-terminated) |
| **0x85** | **Message Area** | Disc and each track | Text (NULL-terminated) |
| **0x8e** | **UPC/EAN and ISRC** | Disc (UPC/EAN) and tracks (ISRC) | Text (12 chars for ISRC) |

**Key Rules for Text Packs:**
- Text is **NULL-terminated ASCII** (ISO 8859-1 / Latin-1)
- Extended: MS-JIS for Japanese CDs
- UTF-8 is **NOT supported** (legacy format)
- Max length: 160 characters (via multi-pack sequences using Sequence Number field)
- ISRC codes are **exactly 12 characters** (e.g., `USRC20250123`)

### Disc-Only Pack Types (0x86, 0x87, 0x8d)

| Pack Type | Category | Applies To | Data Format |
|-----------|----------|------------|-------------|
| **0x86** | **Disc Identification** | Disc only (no tracks) | Text and binary |
| **0x87** | **Genre Identification** | Disc only (no tracks) | Text and binary code |
| **0x8d** | **Closed Information** | Disc only (proprietary) | Binary |

**Genre Codes:** See [Genre Categories](http://helpdesk.audiofile-engineering.com/index.php?pg=kb.page&id=123) for standard codes.

### Binary Pack Types (0x88, 0x89)

| Pack Type | Category | Applies To | Data Format |
|-----------|----------|------------|-------------|
| **0x88** | **Table of Contents (TOC)** | Disc only | Binary |
| **0x89** | **Second Table of Contents** | Disc only | Binary |

### Metadata Pack Type (0x8f)

| Pack Type | Category | Description |
|-----------|----------|-------------|
| **0x8f** | **Block Size Information** | Describes overall content of block and parts of all blocks |

**Reserved:** Pack Types 0x8a–0x8c are reserved for future use.

---

## Text Encoding Rules

### Character Set
- **Standard:** ISO 8859-1 (Latin-1)
- **Extended:** MS-JIS (Japanese CDs)
- **NOT supported:** UTF-8

### NULL Termination
All text data in bytes 4-15 is **NULL-terminated**:
- Text ends at first `0x00` byte
- Remaining bytes after NULL are padding
- Example: `41 6D 61 7A 69 6E 67 00 00 00 00 00` = "Amazing"

### Multi-Pack Sequences
For text longer than 12 bytes:
- Use multiple packs with same Pack Type and Track Number
- Increment Sequence Number (byte 2) for each continuation
- Concatenate data bytes in sequence order
- Total max: 160 characters per field

---

## Track Number Rules

| Track Number | Meaning |
|--------------|---------|
| **0** | Disc/Album-level metadata |
| **1-99** | Individual track metadata |

**Important:**
- Track 0 metadata applies to the entire album
- If a Pack Type appears for Track 0, it **should** also appear for each individual track (1-99)
- Exception: Pack Types 0x86, 0x87, 0x88, 0x89, 0x8d apply **only** to disc (Track 0), never to individual tracks

---

## CRC Error Detection (Bytes 16-17)

- **Purpose:** Detect data corruption
- **Algorithm:** CRC-16 (see MMC-3 spec Section 5.23)
- **Handling Invalid CRC:**
  - Mark pack as potentially corrupt
  - **Best practice:** Decode data anyway (best effort)
  - Warn user with "⚠️ CRC Error" indicator

---

## Language Support (Blocks)

CD Text supports up to **8 language blocks**:
- Each block contains a complete set of packs in one language
- Language codes defined by EBU (European Broadcasting Union)
- Block 0 is the default/primary language
- Language identified in Block Size Information pack (0x8f)

**Language Codes:** See [EBU Subtitling Format Spec Appendix 3](http://tech.ebu.ch/docs/tech/tech3264.pdf)

---

## Parsing Algorithm (Step-by-Step)

### Step 1: Validate Input
```
1. Check input is hexadecimal string
2. Verify length is multiple of 36 hex chars (18 bytes)
3. If invalid → Error: "Invalid CDTEXT format"
```

### Step 2: Split into Packs
```
For each 18-byte pack (36 hex chars):
  packType = byte[0]        // Pack Type ID
  trackNum = byte[1]        // Track Number
  seqNum = byte[2]          // Sequence Number
  blockPos = byte[3]        // Block Character Position
  data = bytes[4-15]        // 12 bytes of payload
  crc = bytes[16-17]        // CRC checksum
```

### Step 3: Validate CRC (Optional)
```
If CRC validation fails:
  Mark pack as "⚠️ CRC Error"
  Continue decoding (best effort)
```

### Step 4: Decode Data
```
If packType in [0x80-0x85, 0x8e]:  // Text packs
  text = decodeASCII(data)
  text = text.split('\x00')[0]      // Stop at NULL
  
If packType in [0x86, 0x87]:
  // Mixed text/binary - decode text portion
  
If packType in [0x88, 0x89, 0x8d, 0x8f]:
  // Binary data - display as hex or parse structure
```

### Step 5: Group by Track
```
Group packs by:
  - Track Number (byte[1])
  - Pack Type (byte[0])
  
Sort by:
  - Track Number ascending (0, 1, 2, 3...)
  - Pack Type ascending (0x80, 0x81, 0x82...)
```

### Step 6: Handle Multi-Pack Sequences
```
For packs with same trackNum and packType:
  Sort by Sequence Number (byte[2])
  Concatenate data fields in order
  Result = complete text string
```

### Step 7: Output Format
```markdown
| Track | Type      | Value              | Notes        |
|-------|-----------|--------------------|--------------|
| Album | TITLE     | [decoded string]   |              |
| Album | PERFORMER | [decoded string]   |              |
| 1     | TITLE     | [decoded string]   |              |
| 1     | PERFORMER | [decoded string]   |              |
| 1     | ISRC      | [ISRC code]        |              |
| 2     | TITLE     | [decoded string]   | ⚠️ CRC Error |
```

---

## Common Parsing Errors & Solutions

### Error 1: "Invalid pack length"
**Cause:** Input not multiple of 36 hex characters  
**Solution:** Validate length before parsing, reject or pad to valid boundary

### Error 2: "CRC mismatch"
**Cause:** Data corruption or incorrect CRC calculation  
**Solution:** Mark pack with warning, decode data anyway (best effort)

### Error 3: "Unknown pack type"
**Cause:** Reserved (0x8a-0x8c) or vendor-specific pack type  
**Solution:** Display as `UNKNOWN (0xXX)` with raw hex data

### Error 4: "Incomplete text sequence"
**Cause:** Missing continuation packs (gaps in Sequence Number)  
**Solution:** Decode available packs, mark as `[incomplete]`

### Error 5: "Invalid NULL termination"
**Cause:** Text data extends beyond 12 bytes without NULL  
**Solution:** Truncate at 12 bytes or flag as malformed

---

## Example Pack Decoding

### Example 1: Album Title Pack
```
Hex Input: 8000001C416D617A696E6720416C62756D0000C3A1

Breakdown:
  Byte 0:    80           → Pack Type = TITLE (0x80)
  Byte 1:    00           → Track Number = 0 (Album)
  Byte 2:    00           → Sequence Number = 0
  Byte 3:    1C           → Block Character Position = 28
  Bytes 4-15: 41 6D 61 7A 69 6E 67 20 41 6C 62 75 6D 00
              "A  m  a  z  i  n  g     A  l  b  u  m  \0"
  Bytes 16-17: C3 A1       → CRC checksum

Decoded Output:
  Track: Album (0)
  Type: TITLE
  Value: "Amazing Album"
```

### Example 2: Track 1 ISRC Code
```
Hex Input: 8E00011C55535243323032353031323300D4A1

Breakdown:
  Byte 0:    8E           → Pack Type = ISRC (0x8e)
  Byte 1:    01           → Track Number = 1
  Byte 2:    00           → Sequence Number = 0
  Byte 3:    1C           → Block Character Position = 28
  Bytes 4-15: 55 53 52 43 32 30 32 35 30 31 32 33 00
              "U  S  R  C  2  0  2  5  0  1  2  3  \0"
  Bytes 16-17: D4 A1       → CRC checksum

Decoded Output:
  Track: 1
  Type: ISRC
  Value: "USRC20250123" (12 characters)
```

---

## Integration with DDP (Disc Description Protocol)

CD Text is commonly found in **DDP masters** (industry standard for CD mastering):
- DDP files contain complete CD image including CD Text
- CD Text data stored in Lead-in sub-channel
- DDP authoring software (Sadie, Sonoris DDP Creator, etc.) generates CD Text packs
- DDP players display CD Text information

**Use Cases:**
- Verify CD Text before duplication
- Extract metadata from DDP masters
- Validate ISRC codes match documentation
- Check track/artist credits

---

## References

1. **SCSI Multimedia Commands (MMC-3)**, Revision 10g, November 2001  
   Section 5.23 (READ TOC/PMA/ATIP Command), Annex J (CD Text format)  
   Search for: `mmc3r10g.pdf`

2. **Sony DADC CD Text Authoring Materials**  
   Originally: http://www.sonydadc.com/file/cdtext.zip  
   Archive: http://web.archive.org/web/20070204035327/http://www.sonydadc.com/file/cdtext.zip

3. **GNU libcdio Project**  
   https://www.gnu.org/software/libcdio/  
   C library for CD access and CD Text parsing

4. **EBU Subtitling Data Exchange Format** (Language codes)  
   Appendix 3, February 1991  
   http://tech.ebu.ch/docs/tech/tech3264.pdf

5. **Genre Codes Reference**  
   http://helpdesk.audiofile-engineering.com/index.php?pg=kb.page&id=123

---

## Implementation Notes

### Recommended Libraries
- **libcdio** (C) - Official GNU implementation
- **libburnia** - CD/DVD burning with CD Text support
- **cdrecord** - Command-line tool with CD Text support

### Testing Tools
- **cd-text-read** - Read CD Text from physical CDs
- **cdrecord** - Write CD Text to recordable media
- **cdrdao** - Cue sheet with CD Text support

### Higher-Level Formats

**CDRWIN Cue Sheet with CD Text:**
```
TITLE "Album Title"
PERFORMER "Artist Name"
CATALOG 1234567890123

TRACK 01 AUDIO
  TITLE "Song Title"
  PERFORMER "Artist Name"
  ISRC USRC20250123
  INDEX 01 00:00:00
```

**Sony Text File Format (Input Sheet Version 0.7T):**
```
TITLE= "Album Title"
PERFORMER= "Artist Name"

TRACK 01
TITLE= "Song Title"
PERFORMER= "Artist Name"
ISRC= USRC20250123
```

These higher-level formats are compiled into binary CD Text packs by authoring software.

---

## Advanced Features

### Multi-Language Support
- Up to 8 language blocks in one CD
- Each block has identical pack structure
- Block 0 is primary/default language
- Language switching handled by Block Size Information (0x8f)

### Character Position Tracking
- Block Character Position (byte 3) tracks offset
- Used for efficient text packing across packs
- Enables quick seeking to specific text positions

### Size Optimization
- Disc-level packs (0x86, 0x87) can be referenced by all tracks
- Avoids duplicating identical information
- Compact representation saves sub-channel space

---

## Validation Checklist

When parsing CD Text, verify:

- [ ] **Pack Length:** Input is multiple of 36 hex chars (18 bytes)
- [ ] **Pack Type:** Value is 0x80–0x8f (valid range)
- [ ] **Track Number:** Value is 0–99 (valid range)
- [ ] **NULL Termination:** Text data properly terminated with 0x00
- [ ] **ISRC Length:** ISRC codes are exactly 12 characters
- [ ] **CRC Validation:** Check CRC, warn if invalid but continue
- [ ] **Track 0 Rules:** Disc-only pack types never appear on tracks 1-99
- [ ] **Sequence Order:** Multi-pack sequences increment correctly

---

## Demo-Ready Output Format

**Markdown Table (Recommended):**
```markdown
| Track | Type      | Value              | Notes        |
|-------|-----------|--------------------|--------------|
| Album | TITLE     | The Best Of        |              |
| Album | PERFORMER | Adomiral           |              |
| Album | GENRE     | POP                |              |
| 1     | TITLE     | Blue Pacific       |              |
| 1     | PERFORMER | Adomiral           |              |
| 1     | ISRC      | USRC20250123       |              |
| 2     | TITLE     | Seabed             |              |
| 2     | PERFORMER | Adomiral           | ⚠️ CRC Error |
```

**JSON Format (Alternative):**
```json
{
  "album": {
    "title": "The Best Of",
    "performer": "Adomiral",
    "genre": "POP"
  },
  "tracks": [
    {
      "number": 1,
      "title": "Blue Pacific",
      "performer": "Adomiral",
      "isrc": "USRC20250123"
    },
    {
      "number": 2,
      "title": "Seabed",
      "performer": "Adomiral",
      "crcError": true
    }
  ]
}
```

---

**This specification is the authoritative reference for implementing CDTEXT parsing in The Betabase chat system.**

*Compiled from: GNU libcdio CD Text Format documentation*  
*Original URL: https://www.gnu.org/software/libcdio/cd-text-format.html*  
*Adapted for: The Betabase CDTEXT parsing skill*  
*Date: December 19, 2025*




