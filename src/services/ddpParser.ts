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
// Constants
// ============================================================================

const DDPID_SIZE = 128;
const DDPMS_BLOCK_SIZE = 128;
const DDPPQ_BLOCK_SIZE = 64;
const CDTEXT_PACK_SIZE = 18;
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB - skip audio files
const FRAMES_PER_SECOND = 75;

// CD-TEXT pack types (from libcdio / Red Book specification)
const CDTEXT_PACK_TYPES: Record<number, string> = {
  0x80: 'TITLE',
  0x81: 'PERFORMER',
  0x82: 'SONGWRITER',
  0x83: 'COMPOSER',
  0x84: 'ARRANGER',
  0x85: 'MESSAGE',
  0x86: 'DISC_ID',
  0x87: 'GENRE',
  0x8e: 'UPC_EAN',
  0x8f: 'SIZE_INFO',
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
  const hasDDPPQ = files.some(f => {
    const upper = f.name.toUpperCase();
    return upper === 'DDPPQ' || upper.includes('PQ');
  });
  const hasCDText = files.some(f => {
    const upper = f.name.toUpperCase();
    if (upper.includes('CDTEXT') || upper.includes('CD-TEXT')) return true;
    if (upper.endsWith('.BIN') && f.size > 0 && f.size <= 10 * 1024) return true;
    return false;
  });

  const audioFiles = files
    .filter(f => {
      const upper = f.name.toUpperCase();
      return f.size > MAX_FILE_SIZE || upper.endsWith('.TRK') || upper.endsWith('.DAT');
    })
    .map(f => f.name);

  const skippedFiles = files.filter(f => f.size > MAX_FILE_SIZE).map(f => f.name);

  return {
    isDDP: hasDDPMS,
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
    txt: isDDP2 ? str.substring(95, 128).trim() : str.substring(88, 128).trim(),
  };
}

// ============================================================================
// DDPMS Parser (128-byte packets) - DDP 2.00 Format
// ============================================================================

function parseDDPMSPacket(buffer: ArrayBuffer, offset: number): DDPMsEntry | null {
  const str = arrayBufferToString(buffer, offset, DDPMS_BLOCK_SIZE);
  const mpv = str.substring(0, 4);
  if (mpv !== 'VVVM') return null;

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
    fileSize: dsl,
  };
}

function parseDDPMS(buffer: ArrayBuffer): DDPMsEntry[] {
  const entries: DDPMsEntry[] = [];
  const packetCount = Math.floor(buffer.byteLength / DDPMS_BLOCK_SIZE);
  for (let i = 0; i < packetCount; i++) {
    const entry = parseDDPMSPacket(buffer, i * DDPMS_BLOCK_SIZE);
    if (entry) entries.push(entry);
  }
  return entries;
}

// ============================================================================
// DDPPQ Parser (64-byte packets) - PQ Descriptor Format
// ============================================================================

function parseDDPPQPacket(buffer: ArrayBuffer, offset: number): DDPPqEntry | null {
  const str = arrayBufferToString(buffer, offset, DDPPQ_BLOCK_SIZE);
  const spv = str.substring(0, 4);
  if (spv !== 'VVVS') return null;

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
    if (entry) entries.push(entry);
  }

  // Calculate durations
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (entry.idx === '01' && entry.trk !== 'AA' && entry.trk !== '00') {
      const currentFrames = timeToFrames(entry.min, entry.sec, entry.frm);
      for (let j = i + 1; j < entries.length; j++) {
        const nextEntry = entries[j];
        if (nextEntry.idx === '01' &&
            (nextEntry.trk === 'AA' || parseInt(nextEntry.trk, 10) > parseInt(entry.trk, 10))) {
          const nextFrames = timeToFrames(nextEntry.min, nextEntry.sec, nextEntry.frm);
          entry.dur = framesToDuration(nextFrames - currentFrames);
          break;
        }
      }
    }
  }

  return entries;
}

// ============================================================================
// CD-TEXT Parser (18-byte packs) - Simple & Correct Approach
// Based on libcdio specification and ChatGPT's correct implementation
// ============================================================================

interface CdTextPack {
  packType: number;
  trackNumber: number;
  sequenceNumber: number;
  data: Uint8Array;
}

function parseCdTextPack(buffer: Uint8Array, offset: number): CdTextPack {
  return {
    packType: buffer[offset],
    trackNumber: buffer[offset + 1],
    sequenceNumber: buffer[offset + 2],
    // Bytes 4-15 contain the 12-byte text payload
    data: buffer.slice(offset + 4, offset + 16),
  };
}

function parseCDText(buffer: ArrayBuffer): CDTextData {
  const bytes = new Uint8Array(buffer);
  const packCount = Math.floor(bytes.length / CDTEXT_PACK_SIZE);

  // Accumulate text for each track/type combination
  const textAccumulators: Map<string, string> = new Map();

  for (let i = 0; i < packCount; i++) {
    const offset = i * CDTEXT_PACK_SIZE;
    const pack = parseCdTextPack(bytes, offset);
    const typeName = CDTEXT_PACK_TYPES[pack.packType];
    
    if (!typeName) continue;

    // Extract text from payload, stopping at NUL
    let text = '';
    for (const byte of pack.data) {
      if (byte === 0) break;
      // Handle ASCII and extended ASCII (ISO-8859-1)
      if (byte >= 0x20) {
        text += String.fromCharCode(byte);
      }
    }
    
    if (!text) continue;

    const key = `${pack.trackNumber}:${typeName}`;
    const existing = textAccumulators.get(key) ?? '';
    textAccumulators.set(key, existing + text);
  }

  // Build result structure
  const result: CDTextData = {
    tracks: [],
    albumTitle: textAccumulators.get('0:TITLE'),
    albumPerformer: textAccumulators.get('0:PERFORMER'),
  };

  // Find all track numbers
  const trackNumbers = new Set<number>();
  for (const key of textAccumulators.keys()) {
    const trackNum = parseInt(key.split(':')[0], 10);
    if (trackNum > 0) trackNumbers.add(trackNum);
  }

  // Build track list
  for (const trackNum of Array.from(trackNumbers).sort((a, b) => a - b)) {
    result.tracks.push({
      number: trackNum,
      title: textAccumulators.get(`${trackNum}:TITLE`),
      performer: textAccumulators.get(`${trackNum}:PERFORMER`),
      songwriter: textAccumulators.get(`${trackNum}:SONGWRITER`),
      isrc: textAccumulators.get(`${trackNum}:UPC_EAN`), // ISRC is in UPC_EAN for tracks
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

// ============================================================================
// Build Combined Track List
// ============================================================================

function buildTracks(
  msEntries: DDPMsEntry[],
  pqEntries: DDPPqEntry[],
  cdText?: CDTextData
): DDPTrack[] {
  const trackMap = new Map<number, DDPTrack>();

  // From DDPMS (D0 entries with CDM=DA)
  for (const entry of msEntries) {
    if (entry.dst === 'D0' && entry.cdm === 'DA') {
      const trackNum = parseInt(entry.trk, 10);
      if (!isNaN(trackNum) && trackNum > 0) {
        if (!trackMap.has(trackNum)) {
          trackMap.set(trackNum, { number: trackNum, isrc: entry.isrc || undefined, dsi: entry.dsi || undefined });
        } else {
          const track = trackMap.get(trackNum)!;
          if (!track.isrc && entry.isrc) track.isrc = entry.isrc;
          if (!track.dsi && entry.dsi) track.dsi = entry.dsi;
        }
      }
    }
  }

  // From DDPPQ
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
        if (entry.isrc) track.isrc = entry.isrc;
      }
    }
  }

  // From CD-TEXT
  if (cdText) {
    for (const textTrack of cdText.tracks) {
      if (trackMap.has(textTrack.number)) {
        const track = trackMap.get(textTrack.number)!;
        track.title = textTrack.title;
        track.performer = textTrack.performer;
        track.songwriter = textTrack.songwriter;
        if (!track.isrc && textTrack.isrc) track.isrc = textTrack.isrc;
      } else {
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

  return Array.from(trackMap.values()).sort((a, b) => a.number - b.number);
}

// ============================================================================
// Calculate Total Duration
// ============================================================================

function calculateTotalDuration(pqEntries: DDPPqEntry[]): string | undefined {
  const leadout = pqEntries.find(e => e.trk === 'AA' && e.idx === '01');
  if (leadout) {
    return framesToDuration(timeToFrames(leadout.min, leadout.sec, leadout.frm));
  }
  if (pqEntries.length > 0) {
    const last = pqEntries[pqEntries.length - 1];
    return framesToDuration(timeToFrames(last.min, last.sec, last.frm));
  }
  return undefined;
}

// ============================================================================
// Find CD-TEXT File
// ============================================================================

function findCDTextFile(files: File[], msEntries: DDPMsEntry[]): File | undefined {
  // Check DDPMS for CD-TEXT reference
  const cdtextEntry = msEntries.find(e =>
    e.sub.toUpperCase().includes('CDTEXT') || e.sub.toUpperCase().includes('CD TEXT')
  );
  if (cdtextEntry?.dsi) {
    const dsiName = cdtextEntry.dsi.trim().toUpperCase();
    const file = files.find(f => f.name.toUpperCase() === dsiName);
    if (file) return file;
  }

  // Check for files with CDTEXT in name
  const cdtextNamedFile = files.find(f => {
    const upper = f.name.toUpperCase();
    return (upper.includes('CDTEXT') || upper.includes('CD-TEXT')) && f.size <= MAX_FILE_SIZE;
  });
  if (cdtextNamedFile) return cdtextNamedFile;

  // Check for small .BIN files (typical CD-TEXT size)
  return files.find(f => {
    const upper = f.name.toUpperCase();
    return upper.endsWith('.BIN') && f.size > 0 && f.size <= 10 * 1024;
  });
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

  const filesByName: Record<string, File> = {};
  for (const file of files) {
    filesByName[file.name.toUpperCase()] = file;
    if (file.size <= MAX_FILE_SIZE) {
      const upperName = file.name.toUpperCase();
      result.files.push({ name: file.name, size: file.size });

      let fileType = 'Other';
      if (upperName === 'DDPMS') fileType = 'Map Stream';
      else if (upperName === 'DDPID') fileType = 'Disc ID';
      else if (upperName.includes('PQ')) fileType = 'PQ Descriptor';
      else if (upperName.includes('CDTEXT') || upperName.includes('CD-TEXT')) fileType = 'CD-TEXT';
      else if (upperName.endsWith('.BIN') && file.size <= 10 * 1024) fileType = 'CD-TEXT';

      result.summary.files.push({ name: file.name, size: file.size, type: fileType });
    }
  }

  // Parse DDPID
  const ddpidFile = filesByName['DDPID'];
  if (ddpidFile && ddpidFile.size <= MAX_FILE_SIZE) {
    const buffer = await readFileAsArrayBuffer(ddpidFile);
    result.id = parseDDPID(buffer);
    result.summary.upc = result.id.upc || undefined;
  }

  // Parse DDPMS
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
    if (entry.idx === '01' && entry.trk !== '00' && entry.trk !== 'AA') {
      const frames = timeToFrames(entry.min, entry.sec, entry.frm);
      offsets.push(frames + 150); // Add 150 frames for lead-in
    }
  }
  return offsets;
}

export function getLeadoutOffset(pqEntries: DDPPqEntry[]): number {
  const leadout = pqEntries.find(e => e.trk === 'AA' && e.idx === '01');
  if (leadout) {
    return timeToFrames(leadout.min, leadout.sec, leadout.frm) + 150;
  }
  if (pqEntries.length > 0) {
    const last = pqEntries[pqEntries.length - 1];
    return timeToFrames(last.min, last.sec, last.frm) + 150;
  }
  return 0;
}
