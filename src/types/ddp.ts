/**
 * DDP (Disc Description Protocol) Types
 *
 * DDP is an industry standard format for delivering CD masters to replication plants.
 * A DDP folder contains several files:
 * - DDPMS: Map Stream - defines what files are in the DDP
 * - DDPID: ID file - contains UPC, Master ID, etc.
 * - DDPPQ: PQ descriptor - track timing info (subcode)
 * - CD-TEXT: Binary metadata - album/track titles, performers
 * - Image files: Audio data (usually .DAT files)
 */

// DDPID - Disc Identification (128 bytes)
export interface DDPId {
  ddpid: string;         // 0-8: "DDP ID" identifier
  upc: string;           // 8-21: UPC/EAN barcode
  mss: string;           // 21-29: Map Stream Start
  msl: string;           // 29-37: Map Stream Length
  med: string;           // 37: Media type
  mid: string;           // 38-86: Master ID
  bk: string;            // 86: Book type
  type: string;          // 87-89: Type
  nside: string;         // 89: Number of sides
  side: string;          // 90: Side number
  nlayer: string;        // 91: Number of layers
  layer: string;         // 92: Layer number
  txt: string;           // 95-128: Text description
}

// DDPMS Entry - Map Stream entry (128 bytes each)
export interface DDPMsEntry {
  mpv: string;           // 0-4: Map Protocol Version
  dst: string;           // 4-6: Data Stream Type
  dsp: string;           // 6-14: Data Stream Pointer
  dsl: number;           // 14-22: Data Stream Length (in sectors for audio)
  dss: string;           // 22-30: Data Stream Start
  sub: string;           // 30-38: Subcode type (e.g., "PQ DESCR", "CDTEXT")
  cdm: string;           // 38-40: CD Mode (DA = Digital Audio, DV = DVD)
  ssm: string;           // 40-41: Session Mode
  scr: string;           // 41-42: Scramble
  pre1: string;          // 42-46: Pregap 1
  pre2: string;          // 46-50: Pregap 2
  pst: string;           // 50-54: Postgap
  med: string;           // 54-55: Media
  trk: string;           // 55-57: Track number
  idx: string;           // 57-59: Index
  isrc: string;          // 59-71: ISRC code
  siz: string;           // 71-74: Size
  dsi: string;           // 74-91: Data Stream Identifier (filename)
  new_: string;          // 91-92: New flag
  pre1nxt: string;       // 92-96: Pregap 1 next
  pauseadd: string;      // 96-104: Pause add
  ofs: string;           // 104-113: Offset
  pad: string;           // 113+: Padding
  fileSize?: number;     // Calculated file size
}

// DDPPQ Entry - PQ Subcode entry (64 bytes each)
export interface DDPPqEntry {
  spv: string;           // 0-4: Subcode Protocol Version
  trk: string;           // 4-6: Track number
  idx: string;           // 6-8: Index
  hrs: string;           // 8-10: Hours (reserved)
  min: string;           // 10-12: Minutes
  sec: string;           // 12-14: Seconds
  frm: string;           // 14-16: Frames
  cb1: string;           // 16-18: Control byte 1
  cb2: string;           // 18-20: Control byte 2
  isrc: string;          // 20-32: ISRC code
  upc: string;           // 32-45: UPC code
  txt: string;           // 45-64: Text
  preGap?: number;       // Calculated pre-gap in frames
  dur?: string;          // Calculated duration
}

// CD-TEXT Pack (18 bytes each)
export interface CDTextPack {
  packType: string;      // Pack type code (80=title, 81=performer, etc.)
  trackNum: number;      // Track number (0 = album)
  seqNum: number;        // Sequence number
  charPos: number;       // Character position
  data: string;          // Text data
}

// Parsed CD-TEXT data
export interface CDTextData {
  albumTitle?: string;
  albumPerformer?: string;
  tracks: {
    number: number;
    title?: string;
    performer?: string;
    songwriter?: string;
    isrc?: string;
  }[];
}

// Track info combining data from all sources
export interface DDPTrack {
  number: number;
  title?: string;
  performer?: string;
  songwriter?: string;
  isrc?: string;
  duration?: string;
  preGap?: number;
  startTime?: string;
  dsi?: string;          // Data Stream Identifier (audio file)
}

// Complete parsed DDP
export interface ParsedDDP {
  // Identification
  id?: DDPId;

  // Map Stream entries
  msEntries: DDPMsEntry[];

  // PQ entries
  pqEntries: DDPPqEntry[];

  // CD-TEXT data
  cdText?: CDTextData;

  // Combined track info
  tracks: DDPTrack[];

  // Summary info
  summary: {
    albumTitle?: string;
    performer?: string;
    upc?: string;
    trackCount: number;
    totalDuration?: string;
    hasCdText: boolean;
    hasPq: boolean;
    files: {
      name: string;
      size: number;
      type: string;
    }[];
  };

  // Raw file info
  files: {
    name: string;
    size: number;
    content?: ArrayBuffer;
  }[];
}

// DDP detection result
export interface DDPDetectionResult {
  isDDP: boolean;
  hasDDPMS: boolean;
  hasDDPID: boolean;
  hasDDPPQ: boolean;
  hasCDText: boolean;
  audioFiles: string[];
  skippedFiles: string[];  // Files > 20MB
}
