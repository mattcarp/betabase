/**
 * DDP (Disc Description Protocol) Types
 *
 * DDP is an industry standard format for delivering CD masters to replication plants.
 * Based on DDP 2.00 specification by Doug Carson & Associates (DCA).
 * 
 * A DDP folder contains several files:
 * - DDPMS: Map Stream - defines what files are in the DDP (128-byte packets)
 * - DDPID: ID file - contains UPC, Master ID, etc. (128 bytes)
 * - DDPPQ: PQ descriptor - track timing info (64-byte packets)
 * - CD-TEXT: Binary metadata - album/track titles, performers (18-byte packs)
 * - Image files: Audio data (usually .TRK or .DAT files)
 */

// ============================================================================
// DDPID - Disc Identification (128 bytes)
// ============================================================================

export interface DDPId {
  ddpid: string;         // 0-7: "DDP 2.00" or "DDP 1.01"
  upc: string;           // 8-20: UPC/EAN barcode (13 chars)
  mss: string;           // 21-28: Map Stream Start
  msl: string;           // 29-36: Map Stream Length (reserved in 2.00)
  med: string;           // 37: Media number (0-9)
  mid: string;           // 38-85: Master ID (48 chars)
  bk?: string;           // 86: Book type (DDP 2.00 only)
  type?: string;         // 87-88: Type of disc (DDP 2.00 only)
  nside?: string;        // 89: Number of sides (DDP 2.00 only)
  side?: string;         // 90: Side number (DDP 2.00 only)
  nlayer?: string;       // 91: Number of layers (DDP 2.00 only)
  layer?: string;        // 92: Layer number (DDP 2.00 only)
  txt: string;           // 93/95-127: User text
}

// ============================================================================
// DDPMS Entry - Map Stream entry (128 bytes each)
// ============================================================================

export interface DDPMsEntry {
  mpv: string;           // 0-3: "VVVM" marker
  dst: string;           // 4-5: Data Stream Type (D0=main, S0=subcode, T0-T2=text)
  dsp: string;           // 6-13: Data Stream Pointer (sector address)
  dsl: number;           // 14-21: Data Stream Length (sectors for DA, bytes for subcode)
  dss: string;           // 22-29: Data Stream Start (CD sector location)
  sub: string;           // 30-37: Subcode descriptor ("PQ DESCR", "CDTEXT", etc.)
  cdm: string;           // 38-39: CD Mode (DA=Digital Audio, 10=Mode1, etc.)
  ssm: string;           // 40: Source Storage Mode (0-7)
  scr: string;           // 41: Source Scrambled (0/1)
  pre1: string;          // 42-45: Pregap 1 sectors
  pre2: string;          // 46-49: Pregap 2/pause sectors
  pst: string;           // 50-53: Postgap sectors
  med: string;           // 54: Media number
  trk: string;           // 55-56: Track number (00-99, AA=lead-out)
  idx: string;           // 57-58: Index number
  isrc: string;          // 59-70: ISRC code (12 chars)
  siz: string;           // 71-73: Size of DSI ("017")
  dsi: string;           // 74-90: Data Stream Identifier (filename, 17 chars)
  new_: string;          // 91: NEW field (DDP 2.00)
  pre1nxt: string;       // 92-95: Pregap 1 next (DDP 2.00)
  pauseadd: string;      // 96-103: Pause add (DDP 2.00)
  ofs: string;           // 104-112: Offset (DDP 2.00)
  pad: string;           // 113-127: Padding
  fileSize?: number;     // Calculated file size
}

// ============================================================================
// DDPPQ Entry - PQ Subcode Descriptor (64 bytes each)
// ============================================================================

export interface DDPPqEntry {
  spv: string;           // 0-3: "VVVS" marker
  trk: string;           // 4-5: Track number (00=lead-in, 01-99, AA=lead-out)
  idx: string;           // 6-7: Index number (00=pregap, 01=start, 02+=indexes)
  hrs: string;           // 8-9: Hours (reserved, usually spaces)
  min: string;           // 10-11: Minutes (00-99)
  sec: string;           // 12-13: Seconds (00-59)
  frm: string;           // 14-15: Frames (00-74)
  cb1: string;           // 16-17: Control byte 1 (ADR/Control)
  cb2: string;           // 18-19: Control byte 2 (reserved)
  isrc: string;          // 20-31: ISRC code (12 chars)
  upc: string;           // 32-44: UPC/EAN code (13 chars)
  txt: string;           // 45-63: User text (19 chars)
  // Calculated fields
  preGap?: number;       // Pre-gap duration in frames
  dur?: string;          // Duration as mm:ss string
}

// ============================================================================
// CD-TEXT Types (Sony format - 18-byte packs)
// Based on: https://www.gnu.org/software/libcdio/cd-text-format.html
// ============================================================================

// Raw CD-TEXT Pack (18 bytes)
export interface CDTextPack {
  packType: number;      // 0x80=Title, 0x81=Performer, 0x82=Songwriter, etc.
  trackNum: number;      // 0=album, 1-99=tracks
  seqNum: number;        // Sequence number
  charPos: number;       // Character position info
  blockNum: number;      // Block/language number (0-7)
  isDoubleWidth: boolean;// Double-byte characters
  data: Uint8Array;      // 12 bytes of text data
  crc: number;           // CRC-16
}

// Parsed CD-TEXT data
export interface CDTextData {
  // Album-level info (track 0)
  albumTitle?: string;
  albumPerformer?: string;
  discId?: string;       // 0x86: Disc ID/Catalog number
  genreCode?: number;    // 0x87: Genre code
  genreText?: string;    // 0x87: Genre description
  upcEan?: string;       // 0x8e: UPC/EAN for album
  
  // Track-level info
  tracks: {
    number: number;
    title?: string;
    performer?: string;
    songwriter?: string;
    composer?: string;
    arranger?: string;
    message?: string;
    isrc?: string;       // 0x8e: ISRC for track
  }[];
  
  // Language info (from 0x8f SIZE_INFO)
  languageCode?: number;
  characterCode?: number; // 0x00=ISO-8859-1, 0x01=ASCII, 0x80=MS-JIS
}

// ============================================================================
// Combined Track Info
// ============================================================================

export interface DDPTrack {
  number: number;
  title?: string;
  performer?: string;
  songwriter?: string;
  composer?: string;
  arranger?: string;
  message?: string;
  isrc?: string;
  duration?: string;     // mm:ss format
  preGap?: number;       // Pre-gap in frames
  startTime?: string;    // Start time in mm:ss:ff format
  dsi?: string;          // Data Stream Identifier (audio filename)
}

// ============================================================================
// Complete Parsed DDP
// ============================================================================

export interface ParsedDDP {
  // Identification
  id?: DDPId;

  // Map Stream entries
  msEntries: DDPMsEntry[];

  // PQ entries
  pqEntries: DDPPqEntry[];

  // CD-TEXT data
  cdText?: CDTextData;

  // Combined track info (from all sources)
  tracks: DDPTrack[];

  // Summary info for display
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

// ============================================================================
// DDP Detection Result
// ============================================================================

export interface DDPDetectionResult {
  isDDP: boolean;
  hasDDPMS: boolean;
  hasDDPID: boolean;
  hasDDPPQ: boolean;
  hasCDText: boolean;
  audioFiles: string[];
  skippedFiles: string[];  // Files > 20MB (audio data)
}
