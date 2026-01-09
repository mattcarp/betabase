/**
 * DDP Parser Service (Client-Side)
 *
 * Parses DDP (Disc Description Protocol) files entirely in the browser.
 * Based on DDP 2.00 specification by Doug Carson & Associates (DCA).
 *
 * A DDP folder contains several files defining a CD master:
 * - DDPID: Disc identifier (128 bytes)
 * - DDPMS: Map stream with 128-byte packets describing all other files
 * - DDPPQ: PQ descriptor with 64-byte packets for track/index/time info
 * - CD-TEXT: Sony CD-TEXT in 18-byte pack format (may be named *.BIN or CDTEXT)
 * - *.TRK/*.DAT: Audio data files
 *
 * This is a front-end only service - no server upload required.
 */

import type {
  DDPId,
  DDPMsEntry,
  DDPPqEntry,
  CDTextData,
  DDPTrack,
  ParsedDDP,
  DDPDetectionResult,
} from '../types/ddp';

// ============================================================================
// Constants from DDP Specification
// ============================================================================

const DDPID_SIZE = 128;
const DDPMS_BLOCK_SIZE = 128;
const DDPPQ_BLOCK_SIZE = 64;
const CDTEXT_PACK_SIZE = 18;
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB - skip audio files
const FRAMES_PER_SECOND = 75;

// CD-TEXT pack types (from Red Book / Sony CD-TEXT specification)
const CDTEXT_PACK_TYPES: Record<number, string> = {
  0x80: 'TITLE',
  0x81: 'PERFORMER',
  0x82: 'SONGWRITER',
  0x83: 'COMPOSER',
  0x84: 'ARRANGER',
  0x85: 'MESSAGE',
  0x86: 'DISC_ID',
  0x87: 'GENRE',
  0x88: 'TOC_INFO',
  0x89: 'TOC_INFO2',
  0x8D: 'CLOSED_INFO',
  0x8E: 'ISRC',
  0x8F: 'SIZE_INFO',
};

// ============================================================================
// File Reading Utilities
// ============================================================================

async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

function arrayBufferToString(buffer: ArrayBuffer, start: number = 0, length?: number): string {
  const bytes = new Uint8Array(buffer, start, length);
  let result = '';
  for (let i = 0; i < bytes.length; i++) {
    result += String.fromCharCode(bytes[i]);
  }
  return result;
}

// ============================================================================
// DDP Detection
// ============================================================================

export function detectDDP(files: File[]): DDPDetectionResult {
  const hasDDPMS = files.some(f => f.name.toUpperCase() === 'DDPMS');
  const hasDDPID = files.some(f => f.name.toUpperCase() === 'DDPID');
  
  // PQ file can be DDPPQ or contain "PQ" in name
  const hasDDPPQ = files.some(f => {
    const upper = f.name.toUpperCase();
    return upper === 'DDPPQ' || upper.includes('PQ');
  });
  
  // CD-TEXT can be:
  // - Named CDTEXT.BIN, CD-TEXT.BIN, or similar
  // - A small .BIN file (< 10KB) with UPC/barcode as filename
  // - Referenced in DDPMS with SUB field = "CDTEXT"
  const hasCDText = files.some(f => {
    const upper = f.name.toUpperCase();
    if (upper.includes('CDTEXT') || upper.includes('CD-TEXT')) return true;
    // Small .BIN files are typically CD-TEXT
    if (upper.endsWith('.BIN') && f.size > 0 && f.size <= 10 * 1024) return true;
    return false;
  });

  // Audio files: .TRK, .DAT, or large binary files
  const audioFiles = files
    .filter(f => {
      const upper = f.name.toUpperCase();
      return f.size > MAX_FILE_SIZE || 
             upper.endsWith('.TRK') || 
             upper.endsWith('.DAT');
    })
    .map(f => f.name);

  const skippedFiles = files
    .filter(f => f.size > MAX_FILE_SIZE)
    .map(f => f.name);

  return {
    isDDP: hasDDPMS, // DDPMS is the only required file
    hasDDPMS,
    hasDDPID,
    hasDDPPQ,
    hasCDText,
    audioFiles,
    skippedFiles,
  };
}

// ============================================================================
// DDPID Parser (128 bytes) - DDP 2.00 Format
// ============================================================================

function parseDDPID(buffer: ArrayBuffer): DDPId {
  const str = arrayBufferToString(buffer, 0, DDPID_SIZE);
  
  // DDP 2.00 DDPID format:
  // 0-7:   DDPID identifier ("DDP 2.00" or "DDP 1.01")
  // 8-20:  UPC/EAN (13 chars)
  // 21-28: MSS Map Stream Start
  // 29-36: MSL Reserved
  // 37:    MED Media number
  // 38-85: MID Master ID (48 chars)
  // 86:    BK Orange/Yellow book specifier
  // 87-88: TYPE Type of disc
  // 89:    NSIDE Number of sides
  // 90:    SIDE Current side
  // 91:    NLAYER Number of layers
  // 92:    LAYER Current layer
  // 93-94: SIZ Size of user text (DDP 1.01 uses 86-87)
  // 95-127: TXT User text (DDP 1.01 uses 88-127)
  
  const ddpid = str.substring(0, 8).trim();
  const isDDP2 = ddpid.includes('2.');
  
  return {
    ddpid,
    upc: str.substring(8, 21).trim(),
    mss: str.substring(21, 29).trim(),
    msl: str.substring(29, 37).trim(),
    med: str.charAt(37).trim(),
    mid: str.substring(38, 86).trim(),
    bk: isDDP2 ? str.charAt(86).trim() : undefined,
    type: isDDP2 ? str.substring(87, 89).trim() : undefined,
    nside: isDDP2 ? str.charAt(89).trim() : undefined,
    side: isDDP2 ? str.charAt(90).trim() : undefined,
    nlayer: isDDP2 ? str.charAt(91).trim() : undefined,
    layer: isDDP2 ? str.charAt(92).trim() : undefined,
    txt: isDDP2 ? str.substring(95, 128).trim() : str.substring(88, 128).trim(),
  };
}

// ============================================================================
// DDPMS Parser (128-byte packets) - DDP 2.00 Format
// ============================================================================

function parseDDPMSPacket(buffer: ArrayBuffer, offset: number): DDPMsEntry | null {
  const str = arrayBufferToString(buffer, offset, DDPMS_BLOCK_SIZE);
  
  // Check for valid packet marker
  const mpv = str.substring(0, 4);
  if (mpv !== 'VVVM') {
    return null;
  }
  
  // DDP 2.00 DDPMS format (128 bytes):
  // 0-3:    MPV "VVVM"
  // 4-5:    DST Data Stream Type (D0=main, S0=subcode)
  // 6-13:   DSP Data Stream Pointer (sector address)
  // 14-21:  DSL Data Stream Length (sectors for DA, bytes for subcode)
  // 22-29:  DSS Data Stream Start (CD sector location)
  // 30-37:  SUB Subcode descriptor ("PQ DESCR", "CDTEXT", etc.)
  // 38-39:  CDM CD Mode ("DA", "10", "20", etc.)
  // 40:     SSM Source Storage Mode
  // 41:     SCR Source Scrambled
  // 42-45:  PRE1 Pregap 1 sectors
  // 46-49:  PRE2 Pregap 2/pause sectors
  // 50-53:  PST Postgap sectors
  // 54:     MED Media number
  // 55-56:  TRK Track number
  // 57-58:  IDX Index number
  // 59-70:  ISRC (12 chars)
  // 71-73:  SIZ Size of DSI
  // 74-90:  DSI Data Stream Identifier (filename, 17 chars)
  // 91:     NEW (DDP 2.00)
  // 92-95:  PRE1NXT (DDP 2.00)
  // 96-103: PAUSEADD (DDP 2.00)
  // 104-112: OFS (DDP 2.00)
  // 113-127: PAD
  
  const dsl = parseInt(str.substring(14, 22).trim(), 10) || 0;
  const cdm = str.substring(38, 40).trim().toUpperCase();
  
  return {
    mpv,
    dst: str.substring(4, 6).trim(),
    dsp: str.substring(6, 14).trim(),
    dsl,
    dss: str.substring(22, 30).trim(),
    sub: str.substring(30, 38).trim(),
    cdm,
    ssm: str.substring(40, 41).trim(),
    scr: str.substring(41, 42).trim(),
    pre1: str.substring(42, 46).trim(),
    pre2: str.substring(46, 50).trim(),
    pst: str.substring(50, 54).trim(),
    med: str.substring(54, 55).trim(),
    trk: str.substring(55, 57).trim(),
    idx: str.substring(57, 59).trim(),
    isrc: str.substring(59, 71).trim(),
    siz: str.substring(71, 74).trim(),
    dsi: str.substring(74, 91).trim(),
    new_: str.substring(91, 92).trim(),
    pre1nxt: str.substring(92, 96).trim(),
    pauseadd: str.substring(96, 104).trim(),
    ofs: str.substring(104, 113).trim(),
    pad: str.substring(113).trim(),
    fileSize: dsl, // Will be recalculated if needed
  };
}

function parseDDPMS(buffer: ArrayBuffer): DDPMsEntry[] {
  const entries: DDPMsEntry[] = [];
  const packetCount = Math.floor(buffer.byteLength / DDPMS_BLOCK_SIZE);
  
  for (let i = 0; i < packetCount; i++) {
    const entry = parseDDPMSPacket(buffer, i * DDPMS_BLOCK_SIZE);
    if (entry) {
      entries.push(entry);
    }
  }
  
  return entries;
}

// ============================================================================
// DDPPQ Parser (64-byte packets) - PQ Descriptor Format
// ============================================================================

function parseDDPPQPacket(buffer: ArrayBuffer, offset: number): DDPPqEntry | null {
  const str = arrayBufferToString(buffer, offset, DDPPQ_BLOCK_SIZE);
  
  // Check for valid packet marker
  const spv = str.substring(0, 4);
  if (spv !== 'VVVS') {
    return null;
  }
  
  // DDP PQ Descriptor format (64 bytes):
  // 0-3:   SPV "VVVS"
  // 4-5:   TRK Track number (00=lead-in, AA=lead-out)
  // 6-7:   IDX Index number
  // 8-9:   HRS Hours (reserved, usually spaces)
  // 10-11: MIN Minutes
  // 12-13: SEC Seconds
  // 14-15: FRM Frames (0-74)
  // 16-17: CB1 Control byte 1
  // 18-19: CB2 Control byte 2 (reserved)
  // 20-31: ISRC (12 chars)
  // 32-44: UPC (13 chars)
  // 45-63: TXT User text (19 chars)
  
  return {
    spv,
    trk: str.substring(4, 6).trim(),
    idx: str.substring(6, 8).trim(),
    hrs: str.substring(8, 10).trim(),
    min: str.substring(10, 12).trim(),
    sec: str.substring(12, 14).trim(),
    frm: str.substring(14, 16).trim(),
    cb1: str.substring(16, 18).trim(),
    cb2: str.substring(18, 20).trim(),
    isrc: str.substring(20, 32).trim(),
    upc: str.substring(32, 45).trim(),
    txt: str.substring(45, 64).trim(),
  };
}

function parseDDPPQ(buffer: ArrayBuffer): DDPPqEntry[] {
  const entries: DDPPqEntry[] = [];
  const packetCount = Math.floor(buffer.byteLength / DDPPQ_BLOCK_SIZE);
  
  for (let i = 0; i < packetCount; i++) {
    const entry = parseDDPPQPacket(buffer, i * DDPPQ_BLOCK_SIZE);
    if (entry) {
      entries.push(entry);
    }
  }
  
  // Calculate durations between entries
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    
    // Only process index 01 entries (track starts, not index 00 pregaps)
    if (entry.idx === '01' && entry.trk !== 'AA' && entry.trk !== '00') {
      const currentFrames = timeToFrames(entry.min, entry.sec, entry.frm);
      
      // Find the next track's start (index 01) or lead-out (AA)
      for (let j = i + 1; j < entries.length; j++) {
        const nextEntry = entries[j];
        
        // Next track index 01 or lead-out
        if (nextEntry.idx === '01' && 
            (nextEntry.trk === 'AA' || parseInt(nextEntry.trk, 10) > parseInt(entry.trk, 10))) {
          const nextFrames = timeToFrames(nextEntry.min, nextEntry.sec, nextEntry.frm);
          entry.dur = framesToDuration(nextFrames - currentFrames);
          break;
        }
      }
      
      // Calculate pregap from previous index 00 entry
      if (i > 0) {
        const prevEntry = entries[i - 1];
        if (prevEntry.idx === '00' && prevEntry.trk === entry.trk) {
          const prevFrames = timeToFrames(prevEntry.min, prevEntry.sec, prevEntry.frm);
          entry.preGap = currentFrames - prevFrames;
        }
      }
    }
  }
  
  return entries;
}

// ============================================================================
// CD-TEXT Parser (Sony format - 18-byte packs)
// ============================================================================

function parseCDText(buffer: ArrayBuffer): CDTextData {
  const bytes = new Uint8Array(buffer);
  const packCount = Math.floor(bytes.length / CDTEXT_PACK_SIZE);
  
  // CD-TEXT pack format (18 bytes):
  // Byte 0: Pack type (0x80=title, 0x81=performer, 0x82=songwriter, etc.)
  // Byte 1: Track number (0=album, 1-99=tracks)
  // Byte 2: Sequence number
  // Byte 3: Block/character position info
  // Bytes 4-15: Text data (12 bytes)
  // Bytes 16-17: CRC
  
  // Collect text fragments by track and type
  const textFragments: Map<string, string[]> = new Map();
  
  for (let i = 0; i < packCount; i++) {
    const packStart = i * CDTEXT_PACK_SIZE;
    const packType = bytes[packStart];
    const trackNumber = bytes[packStart + 1] & 0x7F; // Mask high bit
    
    // Only process known text pack types
    const typeName = CDTEXT_PACK_TYPES[packType];
    if (!typeName) continue;
    
    // Skip non-text types
    if (packType >= 0x88 && packType <= 0x8D) continue;
    
    // Extract text data (bytes 4-15)
    const textBytes = bytes.slice(packStart + 4, packStart + 16);
    let text = '';
    
    for (const byte of textBytes) {
      if (byte === 0) break; // NULL terminator
      if (byte >= 0x20 && byte <= 0x7E) {
        text += String.fromCharCode(byte);
      } else if (byte >= 0x80 && byte <= 0xFF) {
        // Extended ASCII / Latin-1
        text += String.fromCharCode(byte);
      }
    }
    
    if (!text) continue;
    
    const key = `${trackNumber}:${typeName}`;
    if (!textFragments.has(key)) {
      textFragments.set(key, []);
    }
    textFragments.get(key)!.push(text);
  }
  
  // Build result structure
  const result: CDTextData = {
    tracks: [],
  };
  
  // Get album info (track 0)
  const albumTitle = textFragments.get('0:TITLE')?.join('');
  const albumPerformer = textFragments.get('0:PERFORMER')?.join('');
  
  if (albumTitle) result.albumTitle = albumTitle;
  if (albumPerformer) result.albumPerformer = albumPerformer;
  
  // Find all track numbers
  const trackNumbers = new Set<number>();
  for (const key of textFragments.keys()) {
    const trackNum = parseInt(key.split(':')[0], 10);
    if (trackNum > 0) trackNumbers.add(trackNum);
  }
  
  // Build track list
  const sortedTracks = Array.from(trackNumbers).sort((a, b) => a - b);
  for (const trackNum of sortedTracks) {
    result.tracks.push({
      number: trackNum,
      title: textFragments.get(`${trackNum}:TITLE`)?.join(''),
      performer: textFragments.get(`${trackNum}:PERFORMER`)?.join(''),
      songwriter: textFragments.get(`${trackNum}:SONGWRITER`)?.join(''),
      isrc: textFragments.get(`${trackNum}:ISRC`)?.join(''),
    });
  }
  
  return result;
}

// ============================================================================
// Time/Frame Utilities
// ============================================================================

function timeToFrames(min: string, sec: string, frm: string): number {
  const mins = parseInt(min, 10) || 0;
  const secs = parseInt(sec, 10) || 0;
  const frames = parseInt(frm, 10) || 0;
  return (mins * 60 * FRAMES_PER_SECOND) + (secs * FRAMES_PER_SECOND) + frames;
}

function framesToDuration(frames: number): string {
  const totalSeconds = Math.floor(frames / FRAMES_PER_SECOND);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function framesToMSF(frames: number): string {
  const totalSeconds = Math.floor(frames / FRAMES_PER_SECOND);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const frm = frames % FRAMES_PER_SECOND;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frm.toString().padStart(2, '0')}`;
}

// ============================================================================
// Build Combined Track List
// ============================================================================

function buildTracks(
  msEntries: DDPMsEntry[],
  pqEntries: DDPPqEntry[],
  cdText?: CDTextData
): DDPTrack[] {
  const trackMap = new Map<number, DDPTrack>();
  
  // First pass: Get track info from DDPMS (D0 entries with CDM=DA)
  for (const entry of msEntries) {
    if (entry.dst === 'D0' && entry.cdm === 'DA') {
      const trackNum = parseInt(entry.trk, 10);
      if (!isNaN(trackNum) && trackNum > 0) {
        if (!trackMap.has(trackNum)) {
          trackMap.set(trackNum, {
            number: trackNum,
            isrc: entry.isrc || undefined,
            dsi: entry.dsi || undefined,
          });
        } else {
          const track = trackMap.get(trackNum)!;
          if (!track.isrc && entry.isrc) track.isrc = entry.isrc;
          if (!track.dsi && entry.dsi) track.dsi = entry.dsi;
        }
      }
    }
  }
  
  // Second pass: Add timing from DDPPQ
  for (const entry of pqEntries) {
    if (entry.idx === '01' && entry.trk !== 'AA' && entry.trk !== '00') {
      const trackNum = parseInt(entry.trk, 10);
      if (!isNaN(trackNum) && trackNum > 0) {
        if (!trackMap.has(trackNum)) {
          trackMap.set(trackNum, { number: trackNum });
        }
        
        const track = trackMap.get(trackNum)!;
        track.duration = entry.dur;
        track.startTime = `${entry.min}:${entry.sec}:${entry.frm}`;
        track.preGap = entry.preGap;
        
        // ISRC from PQ takes precedence (it's authoritative)
        if (entry.isrc) {
          track.isrc = entry.isrc;
        }
      }
    }
  }
  
  // Third pass: Add CD-TEXT metadata
  if (cdText) {
    for (const textTrack of cdText.tracks) {
      if (trackMap.has(textTrack.number)) {
        const track = trackMap.get(textTrack.number)!;
        track.title = textTrack.title;
        track.performer = textTrack.performer;
        track.songwriter = textTrack.songwriter;
        // CD-TEXT ISRC only if not already set
        if (!track.isrc && textTrack.isrc) {
          track.isrc = textTrack.isrc;
        }
      } else {
        // Track exists only in CD-TEXT
        trackMap.set(textTrack.number, {
          number: textTrack.number,
          title: textTrack.title,
          performer: textTrack.performer,
          songwriter: textTrack.songwriter,
          isrc: textTrack.isrc,
        });
      }
    }
  }
  
  // Return sorted track list
  return Array.from(trackMap.values()).sort((a, b) => a.number - b.number);
}

// ============================================================================
// Calculate Total Duration
// ============================================================================

function calculateTotalDuration(pqEntries: DDPPqEntry[]): string | undefined {
  // Find lead-out entry (TRK = "AA")
  const leadout = pqEntries.find(e => e.trk === 'AA' && e.idx === '01');
  
  if (leadout) {
    const frames = timeToFrames(leadout.min, leadout.sec, leadout.frm);
    return framesToDuration(frames);
  }
  
  // Fallback: use last entry
  if (pqEntries.length > 0) {
    const last = pqEntries[pqEntries.length - 1];
    const frames = timeToFrames(last.min, last.sec, last.frm);
    return framesToDuration(frames);
  }
  
  return undefined;
}

// ============================================================================
// Find CD-TEXT File
// ============================================================================

function findCDTextFile(files: File[], msEntries: DDPMsEntry[]): File | undefined {
  // First, check DDPMS for CD-TEXT reference
  const cdtextEntry = msEntries.find(e => 
    e.sub.toUpperCase().includes('CDTEXT') || 
    e.sub.toUpperCase().includes('CD TEXT')
  );
  
  if (cdtextEntry && cdtextEntry.dsi) {
    const dsiName = cdtextEntry.dsi.trim().toUpperCase();
    const file = files.find(f => f.name.toUpperCase() === dsiName);
    if (file) return file;
  }
  
  // Check for files with CDTEXT in name
  const cdtextNamedFile = files.find(f => {
    const upper = f.name.toUpperCase();
    return (upper.includes('CDTEXT') || upper.includes('CD-TEXT')) && 
           f.size <= MAX_FILE_SIZE;
  });
  if (cdtextNamedFile) return cdtextNamedFile;
  
  // Check for small .BIN files (typical CD-TEXT size is ~500-4000 bytes)
  const binFile = files.find(f => {
    const upper = f.name.toUpperCase();
    return upper.endsWith('.BIN') && 
           f.size > 0 && 
           f.size <= 10 * 1024; // < 10KB
  });
  
  return binFile;
}

// ============================================================================
// Main Parser
// ============================================================================

export async function parseDDP(files: File[]): Promise<ParsedDDP> {
  const result: ParsedDDP = {
    msEntries: [],
    pqEntries: [],
    tracks: [],
    summary: {
      trackCount: 0,
      hasCdText: false,
      hasPq: false,
      files: [],
    },
    files: [],
  };
  
  // Build file lookup by uppercase name
  const filesByName: Record<string, File> = {};
  for (const file of files) {
    filesByName[file.name.toUpperCase()] = file;
    
    // Track file info for summary
    if (file.size <= MAX_FILE_SIZE) {
      const upperName = file.name.toUpperCase();
      result.files.push({
        name: file.name,
        size: file.size,
      });
      
      let fileType = 'Other';
      if (upperName === 'DDPMS') fileType = 'Map Stream';
      else if (upperName === 'DDPID') fileType = 'Disc ID';
      else if (upperName.includes('PQ')) fileType = 'PQ Descriptor';
      else if (upperName.includes('CDTEXT') || upperName.includes('CD-TEXT')) fileType = 'CD-TEXT';
      else if (upperName.endsWith('.BIN') && file.size <= 10 * 1024) fileType = 'CD-TEXT';
      
      result.summary.files.push({
        name: file.name,
        size: file.size,
        type: fileType,
      });
    }
  }
  
  // Parse DDPID
  const ddpidFile = filesByName['DDPID'];
  if (ddpidFile && ddpidFile.size <= MAX_FILE_SIZE) {
    const buffer = await readFileAsArrayBuffer(ddpidFile);
    result.id = parseDDPID(buffer);
    result.summary.upc = result.id.upc || undefined;
  }
  
  // Parse DDPMS (required)
  const ddpmsFile = filesByName['DDPMS'];
  if (ddpmsFile && ddpmsFile.size <= MAX_FILE_SIZE) {
    const buffer = await readFileAsArrayBuffer(ddpmsFile);
    result.msEntries = parseDDPMS(buffer);
  }
  
  // Parse DDPPQ
  const pqFile = filesByName['DDPPQ'] || 
                 Object.values(filesByName).find(f => 
                   f.name.toUpperCase().includes('PQ') && f.size <= MAX_FILE_SIZE
                 );
  if (pqFile) {
    const buffer = await readFileAsArrayBuffer(pqFile);
    result.pqEntries = parseDDPPQ(buffer);
    result.summary.hasPq = true;
  }
  
  // Parse CD-TEXT
  const cdtextFile = findCDTextFile(files, result.msEntries);
  if (cdtextFile) {
    const buffer = await readFileAsArrayBuffer(cdtextFile);
    result.cdText = parseCDText(buffer);
    result.summary.hasCdText = true;
    result.summary.albumTitle = result.cdText.albumTitle;
    result.summary.performer = result.cdText.albumPerformer;
  }
  
  // Build combined track list
  result.tracks = buildTracks(result.msEntries, result.pqEntries, result.cdText);
  result.summary.trackCount = result.tracks.length;
  result.summary.totalDuration = calculateTotalDuration(result.pqEntries);
  
  return result;
}

// ============================================================================
// Track Offsets for MusicBrainz Disc ID Calculation
// ============================================================================

export function getTrackOffsets(pqEntries: DDPPqEntry[]): number[] {
  const offsets: number[] = [];
  
  for (const entry of pqEntries) {
    // Only index 01 entries (track starts), excluding lead-in (00) and lead-out (AA)
    if (entry.idx === '01' && entry.trk !== '00' && entry.trk !== 'AA') {
      const frames = timeToFrames(entry.min, entry.sec, entry.frm);
      // Add 150 frames for 2-second lead-in offset per Red Book spec
      offsets.push(frames + 150);
    }
  }
  
  return offsets;
}

export function getLeadoutOffset(pqEntries: DDPPqEntry[]): number {
  // Find lead-out entry (TRK = "AA", IDX = "01")
  const leadout = pqEntries.find(e => e.trk === 'AA' && e.idx === '01');
  
  if (leadout) {
    return timeToFrames(leadout.min, leadout.sec, leadout.frm) + 150;
  }
  
  // Fallback: use last entry
  if (pqEntries.length > 0) {
    const last = pqEntries[pqEntries.length - 1];
    return timeToFrames(last.min, last.sec, last.frm) + 150;
  }
  
  return 0;
}
