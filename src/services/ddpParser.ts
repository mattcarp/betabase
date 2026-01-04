/**
 * DDP Parser Service (Client-Side)
 *
 * Parses DDP (Disc Description Protocol) files entirely in the browser.
 * A DDP folder contains several files defining a CD master for replication.
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

const DDPMS_BLOCK_SIZE = 128;
const DDPPQ_BLOCK_SIZE = 64;
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB - skip audio files
const BYTES_PER_SECTOR = 2352;
const FRAMES_PER_SECOND = 75;

// CD-TEXT pack types
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

async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, 'latin1'); // DDP uses ISO-8859-1
  });
}

function arrayBufferToString(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
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
  const fileNames = files.map(f => f.name.toUpperCase());

  const hasDDPMS = fileNames.some(n => n === 'DDPMS');
  const hasDDPID = fileNames.some(n => n === 'DDPID');
  const hasDDPPQ = fileNames.some(n => n.includes('PQ') || n.includes('PQDESCR'));
  const hasCDText = fileNames.some(n => n.includes('CDTEXT') || n.includes('CD-TEXT'));

  // Audio files are typically .DAT or large binary files
  const audioFiles = files
    .filter(f => f.size > MAX_FILE_SIZE || f.name.toUpperCase().endsWith('.DAT'))
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
// DDPID Parser (128 bytes)
// ============================================================================

function parseDDPID(content: string): DDPId {
  return {
    ddpid: content.substring(0, 8).trim(),
    upc: content.substring(8, 21).trim(),
    mss: content.substring(21, 29).trim(),
    msl: content.substring(29, 37).trim(),
    med: content.charAt(37),
    mid: content.substring(38, 86).trim(),
    bk: content.charAt(86),
    type: content.substring(87, 89).trim(),
    nside: content.charAt(89),
    side: content.charAt(90),
    nlayer: content.charAt(91),
    layer: content.charAt(92),
    txt: content.substring(95, 128).trim(),
  };
}

// ============================================================================
// DDPMS Parser (128-byte blocks)
// ============================================================================

function parseDDPMSBlock(block: string): DDPMsEntry {
  const dsl = parseInt(block.substring(14, 22), 10);
  const cdm = block.substring(38, 40).trim().toUpperCase();

  // Calculate file size based on content type
  let fileSize = dsl;
  if (cdm === 'DA' || cdm === 'DV') {
    fileSize = dsl * BYTES_PER_SECTOR;
  }

  return {
    mpv: block.substring(0, 4).trim(),
    dst: block.substring(4, 6).trim(),
    dsp: block.substring(6, 14).trim(),
    dsl,
    dss: block.substring(22, 30).trim(),
    sub: block.substring(30, 38).trim(),
    cdm,
    ssm: block.substring(40, 41).trim(),
    scr: block.substring(41, 42).trim(),
    pre1: block.substring(42, 46).trim(),
    pre2: block.substring(46, 50).trim(),
    pst: block.substring(50, 54).trim(),
    med: block.substring(54, 55).trim(),
    trk: block.substring(55, 57).trim(),
    idx: block.substring(57, 59).trim(),
    isrc: block.substring(59, 71).trim(),
    siz: block.substring(71, 74).trim(),
    dsi: block.substring(74, 91).trim(),
    new_: block.substring(91, 92).trim(),
    pre1nxt: block.substring(92, 96).trim(),
    pauseadd: block.substring(96, 104).trim(),
    ofs: block.substring(104, 113).trim(),
    pad: block.substring(113).trim(),
    fileSize,
  };
}

function parseDDPMS(content: string): DDPMsEntry[] {
  const entries: DDPMsEntry[] = [];
  const blockCount = Math.floor(content.length / DDPMS_BLOCK_SIZE);

  for (let i = 0; i < blockCount; i++) {
    const block = content.substring(i * DDPMS_BLOCK_SIZE, (i + 1) * DDPMS_BLOCK_SIZE);
    entries.push(parseDDPMSBlock(block));
  }

  return entries;
}

// ============================================================================
// DDPPQ Parser (64-byte blocks)
// ============================================================================

function parseDDPPQBlock(block: string): DDPPqEntry {
  return {
    spv: block.substring(0, 4).trim(),
    trk: block.substring(4, 6).trim(),
    idx: block.substring(6, 8).trim(),
    hrs: block.substring(8, 10).trim(),
    min: block.substring(10, 12).trim(),
    sec: block.substring(12, 14).trim(),
    frm: block.substring(14, 16).trim(),
    cb1: block.substring(16, 18).trim(),
    cb2: block.substring(18, 20).trim(),
    isrc: block.substring(20, 32).trim(),
    upc: block.substring(32, 45).trim(),
    txt: block.substring(45, 64).trim(),
  };
}

function timeToFrames(min: string, sec: string, frm: string): number {
  const mins = parseInt(min, 10) || 0;
  const secs = parseInt(sec, 10) || 0;
  const frames = parseInt(frm, 10) || 0;
  return (mins * 60 * FRAMES_PER_SECOND) + (secs * FRAMES_PER_SECOND) + frames;
}

function framesToTime(frames: number): string {
  const totalSeconds = Math.floor(frames / FRAMES_PER_SECOND);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const frm = frames % FRAMES_PER_SECOND;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frm.toString().padStart(2, '0')}`;
}

function parseDDPPQ(content: string): DDPPqEntry[] {
  const entries: DDPPqEntry[] = [];
  const blockCount = Math.floor(content.length / DDPPQ_BLOCK_SIZE);

  for (let i = 0; i < blockCount; i++) {
    const block = content.substring(i * DDPPQ_BLOCK_SIZE, (i + 1) * DDPPQ_BLOCK_SIZE);
    entries.push(parseDDPPQBlock(block));
  }

  // Calculate gaps and durations
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    // Only process index 01 entries (track starts)
    if (entry.idx.trim() === '01' && entry.trk.trim().toUpperCase() !== 'AA') {
      // Calculate pre-gap from previous entry (index 00)
      if (i > 0) {
        const prevEntry = entries[i - 1];
        const prevFrames = timeToFrames(prevEntry.min, prevEntry.sec, prevEntry.frm);
        const currentFrames = timeToFrames(entry.min, entry.sec, entry.frm);
        entry.preGap = currentFrames - prevFrames;
      }

      // Calculate duration by finding next track's index 00 or leadout
      for (let j = i + 1; j < entries.length; j++) {
        const nextEntry = entries[j];
        const currentTrack = parseInt(entry.trk, 10);
        const isNextPause = nextEntry.idx.trim() === '00' &&
          parseInt(nextEntry.trk, 10) === currentTrack + 1;
        const isLeadout = nextEntry.trk.trim().toUpperCase() === 'AA' &&
          nextEntry.idx.trim() === '01';

        if (isNextPause || isLeadout) {
          const startFrames = timeToFrames(entry.min, entry.sec, entry.frm);
          const endFrames = timeToFrames(nextEntry.min, nextEntry.sec, nextEntry.frm);
          entry.dur = framesToTime(endFrames - startFrames);
          break;
        }
      }
    }
  }

  return entries;
}

// ============================================================================
// CD-TEXT Parser (18-byte packs)
// ============================================================================

function parseCDText(buffer: ArrayBuffer): CDTextData {
  const bytes = new Uint8Array(buffer);
  const packCount = Math.floor(bytes.length / 18);

  // Organize text by track and type
  const trackData: Map<number, Record<string, string[]>> = new Map();

  for (let i = 0; i < packCount; i++) {
    const packStart = i * 18;
    const packType = bytes[packStart];
    const trackNumber = bytes[packStart + 1];

    // Only process known text pack types
    if (!CDTEXT_PACK_TYPES[packType]) continue;

    const typeName = CDTEXT_PACK_TYPES[packType];
    const dataBytes = bytes.slice(packStart + 4, packStart + 16);

    // Decode text (stop at NULL)
    let text = '';
    for (const byte of dataBytes) {
      if (byte === 0) break;
      if (byte >= 0x20 && byte <= 0x7E) {
        text += String.fromCharCode(byte);
      } else if (byte >= 0x80) {
        text += String.fromCharCode(byte); // Extended ASCII
      }
    }

    if (!text) continue;

    if (!trackData.has(trackNumber)) {
      trackData.set(trackNumber, {});
    }
    const track = trackData.get(trackNumber)!;
    if (!track[typeName]) {
      track[typeName] = [];
    }
    track[typeName].push(text);
  }

  // Build result
  const result: CDTextData = {
    tracks: [],
  };

  // Track 0 is album-level
  const albumData = trackData.get(0);
  if (albumData) {
    result.albumTitle = albumData['TITLE']?.join('');
    result.albumPerformer = albumData['PERFORMER']?.join('');
  }

  // Build track list
  const trackNumbers = Array.from(trackData.keys()).filter(n => n > 0).sort((a, b) => a - b);
  for (const num of trackNumbers) {
    const data = trackData.get(num)!;
    result.tracks.push({
      number: num,
      title: data['TITLE']?.join(''),
      performer: data['PERFORMER']?.join(''),
      songwriter: data['SONGWRITER']?.join(''),
      isrc: data['ISRC']?.join(''),
    });
  }

  return result;
}

// ============================================================================
// Combine All Data into Tracks
// ============================================================================

function buildTracks(
  msEntries: DDPMsEntry[],
  pqEntries: DDPPqEntry[],
  cdText?: CDTextData
): DDPTrack[] {
  const tracks: DDPTrack[] = [];
  const trackMap = new Map<number, DDPTrack>();

  // Start with DDPMS audio entries
  for (const entry of msEntries) {
    if (entry.cdm === 'DA') {
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

  // Add PQ data
  for (const entry of pqEntries) {
    if (entry.idx.trim() === '01' && entry.trk.trim().toUpperCase() !== 'AA') {
      const trackNum = parseInt(entry.trk, 10);
      if (!isNaN(trackNum) && trackNum > 0) {
        if (!trackMap.has(trackNum)) {
          trackMap.set(trackNum, { number: trackNum });
        }
        const track = trackMap.get(trackNum)!;
        track.duration = entry.dur;
        track.preGap = entry.preGap;
        track.startTime = `${entry.min}:${entry.sec}:${entry.frm}`;
        if (!track.isrc && entry.isrc.trim()) track.isrc = entry.isrc.trim();
      }
    }
  }

  // Add CD-TEXT data
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

  // Sort and return
  const sortedNums = Array.from(trackMap.keys()).sort((a, b) => a - b);
  for (const num of sortedNums) {
    tracks.push(trackMap.get(num)!);
  }

  return tracks;
}

// ============================================================================
// Calculate Total Duration
// ============================================================================

function calculateTotalDuration(msEntries: DDPMsEntry[]): string | undefined {
  let lastDAEntry: DDPMsEntry | undefined;

  // Find the last DA (Digital Audio) entry
  for (let i = msEntries.length - 1; i >= 0; i--) {
    if (msEntries[i].cdm === 'DA') {
      lastDAEntry = msEntries[i];
      break;
    }
  }

  if (!lastDAEntry) return undefined;

  const dss = parseInt(lastDAEntry.dss, 10) || 0;
  const dsl = lastDAEntry.dsl;
  const totalFrames = dss + dsl;

  return framesToTime(totalFrames);
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

  // Categorize files
  const filesByName: Record<string, File> = {};
  for (const file of files) {
    const upperName = file.name.toUpperCase();
    filesByName[upperName] = file;

    // Track all files (but mark skipped ones)
    if (file.size <= MAX_FILE_SIZE) {
      result.files.push({
        name: file.name,
        size: file.size,
      });
      result.summary.files.push({
        name: file.name,
        size: file.size,
        type: upperName === 'DDPMS' ? 'Map Stream' :
              upperName === 'DDPID' ? 'Disc ID' :
              upperName.includes('PQ') ? 'PQ Descriptor' :
              upperName.includes('CDTEXT') ? 'CD-TEXT' :
              'Other',
      });
    }
  }

  // Parse DDPID
  const ddpidFile = filesByName['DDPID'];
  if (ddpidFile && ddpidFile.size <= MAX_FILE_SIZE) {
    const content = await readFileAsText(ddpidFile);
    result.id = parseDDPID(content);
    result.summary.upc = result.id.upc || undefined;
  }

  // Parse DDPMS (required)
  const ddpmsFile = filesByName['DDPMS'];
  if (ddpmsFile && ddpmsFile.size <= MAX_FILE_SIZE) {
    const content = await readFileAsText(ddpmsFile);
    result.msEntries = parseDDPMS(content);
  }

  // Parse DDPPQ
  const pqFile = Object.values(filesByName).find(f =>
    f.name.toUpperCase().includes('PQ') && f.size <= MAX_FILE_SIZE
  );
  if (pqFile) {
    const content = await readFileAsText(pqFile);
    result.pqEntries = parseDDPPQ(content);
    result.summary.hasPq = true;
  }

  // Parse CD-TEXT
  const cdtextFile = Object.values(filesByName).find(f =>
    (f.name.toUpperCase().includes('CDTEXT') || f.name.toUpperCase().includes('CD-TEXT'))
    && f.size <= MAX_FILE_SIZE
  );
  if (cdtextFile) {
    const buffer = await readFileAsArrayBuffer(cdtextFile);
    result.cdText = parseCDText(buffer);
    result.summary.hasCdText = true;
    result.summary.albumTitle = result.cdText.albumTitle;
    result.summary.performer = result.cdText.albumPerformer;
  }

  // Build combined tracks
  result.tracks = buildTracks(result.msEntries, result.pqEntries, result.cdText);
  result.summary.trackCount = result.tracks.length;
  result.summary.totalDuration = calculateTotalDuration(result.msEntries);

  return result;
}

// ============================================================================
// Track Offsets for MusicBrainz Disc ID
// ============================================================================

export function getTrackOffsets(pqEntries: DDPPqEntry[]): number[] {
  const offsets: number[] = [];

  for (const entry of pqEntries) {
    if (entry.idx.trim() === '01') {
      const frames = timeToFrames(entry.min, entry.sec, entry.frm);
      // Add 150 frames for lead-in (2 seconds)
      offsets.push(frames + 150);
    }
  }

  return offsets;
}

export function getLeadoutOffset(pqEntries: DDPPqEntry[]): number {
  // Find the AA (leadout) entry
  const leadout = pqEntries.find(e =>
    e.trk.trim().toUpperCase() === 'AA' && e.idx.trim() === '01'
  );

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
