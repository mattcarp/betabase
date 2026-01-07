/**
 * DDP Parser API Route
 * 
 * Parses only files listed in DDPMS + CD-TEXT. Ignores audio files.
 * Returns parsing time in SS.MMMM format.
 */

import { NextRequest, NextResponse } from 'next/server';

const DDPID_SIZE = 128;
const DDPMS_BLOCK_SIZE = 128;
const DDPPQ_BLOCK_SIZE = 64;
const PACK_SIZE = 18;

const PACK_TYPES: Record<number, string> = {
  0x80: "TITLE",
  0x81: "PERFORMER",
  0x86: "DISC_ID",
  0x8e: "UPC_EAN",
};

// ============================================================================
// DDPMS Parser - get list of referenced files
// ============================================================================

function parseDDPMS(buffer: Buffer): string[] {
  const files: string[] = [];
  const packetCount = Math.floor(buffer.length / DDPMS_BLOCK_SIZE);
  
  for (let i = 0; i < packetCount; i++) {
    const offset = i * DDPMS_BLOCK_SIZE;
    const str = buffer.toString('ascii', offset, offset + DDPMS_BLOCK_SIZE);
    if (str.substring(0, 4) !== 'VVVM') continue;
    
    const dsi = str.substring(74, 91).trim(); // Data Stream Identifier (filename)
    if (dsi) files.push(dsi);
  }
  
  return files;
}

// ============================================================================
// CD-TEXT Parser - handles text continuation across packs
// ============================================================================

function parseCdText(buffer: Buffer) {
  const titles: string[] = [];
  const isrcs: string[] = [];
  let artist = "";
  let upc = "";
  
  let currentTitle = "";
  let currentTrack = 0;
  let currentIsrc = "";
  let currentIsrcTrack = 0;
  
  for (let offset = 0; offset + PACK_SIZE <= buffer.length; offset += PACK_SIZE) {
    const packType = buffer[offset];
    const trackNum = buffer[offset + 1];
    const payload = buffer.slice(offset + 4, offset + 16);
    
    if (packType === 0x80) { // TITLE
      for (let i = 0; i < 12; i++) {
        const byte = payload[i];
        if (byte === 0) {
          if (currentTitle) {
            titles[currentTrack] = currentTitle;
            currentTitle = "";
          }
          currentTrack++;
        } else if (byte >= 0x20 && byte < 0x7F) {
          currentTitle += String.fromCharCode(byte);
        }
      }
    } else if (packType === 0x81) { // PERFORMER
      if (trackNum === 0) {
        for (let i = 0; i < 12; i++) {
          const byte = payload[i];
          if (byte === 0) break;
          if (byte >= 0x20 && byte < 0x7F) artist += String.fromCharCode(byte);
        }
      }
    } else if (packType === 0x86) { // DISC_ID - contains UPC
      let text = "";
      for (let i = 0; i < 12; i++) {
        const byte = payload[i];
        if (byte === 0) break;
        if (byte >= 0x30 && byte <= 0x39) text += String.fromCharCode(byte);
      }
      if (text && !upc) upc = text;
    } else if (packType === 0x8e) { // UPC_EAN / ISRC
      for (let i = 0; i < 12; i++) {
        const byte = payload[i];
        if (byte === 0) {
          if (currentIsrc) {
            isrcs[currentIsrcTrack] = currentIsrc;
            currentIsrc = "";
          }
          currentIsrcTrack++;
        } else if ((byte >= 0x30 && byte <= 0x39) || (byte >= 0x41 && byte <= 0x5A)) {
          currentIsrc += String.fromCharCode(byte);
        }
      }
    }
  }
  
  if (currentTitle) titles[currentTrack] = currentTitle;
  if (currentIsrc) isrcs[currentIsrcTrack] = currentIsrc;
  
  const tracks: Array<{ track: number; title?: string; isrc?: string }> = [];
  const maxTrack = Math.max(titles.length, isrcs.length);
  for (let i = 1; i < maxTrack; i++) {
    if (titles[i] || isrcs[i]) {
      tracks.push({ track: i, title: titles[i], isrc: isrcs[i] });
    }
  }
  
  return { album: titles[0] || "", artist, upc: upc || isrcs[0] || "", tracks };
}

// ============================================================================
// DDPID Parser
// ============================================================================

function parseDDPID(buffer: Buffer) {
  const str = buffer.toString('ascii', 0, DDPID_SIZE);
  return {
    ddpid: str.substring(0, 8).trim(),
    upc: str.substring(8, 21).trim(),
    mid: str.substring(38, 86).trim(),
  };
}

// ============================================================================
// DDPPQ Parser
// ============================================================================

function parseDDPPQ(buffer: Buffer) {
  const entries: Array<{
    trk: string; idx: string; min: string; sec: string; frm: string; isrc: string; dur?: string;
  }> = [];
  
  const packetCount = Math.floor(buffer.length / DDPPQ_BLOCK_SIZE);
  for (let i = 0; i < packetCount; i++) {
    const offset = i * DDPPQ_BLOCK_SIZE;
    const str = buffer.toString('ascii', offset, offset + DDPPQ_BLOCK_SIZE);
    if (str.substring(0, 4) !== 'VVVS') continue;
    entries.push({
      trk: str.substring(4, 6).trim(),
      idx: str.substring(6, 8).trim(),
      min: str.substring(10, 12).trim(),
      sec: str.substring(12, 14).trim(),
      frm: str.substring(14, 16).trim(),
      isrc: str.substring(20, 32).trim(),
    });
  }

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if (e.idx === '01' && e.trk !== 'AA' && e.trk !== '00') {
      const cur = (parseInt(e.min)||0)*60*75 + (parseInt(e.sec)||0)*75 + (parseInt(e.frm)||0);
      for (let j = i + 1; j < entries.length; j++) {
        const n = entries[j];
        if (n.idx === '01' && (n.trk === 'AA' || parseInt(n.trk) > parseInt(e.trk))) {
          const nxt = (parseInt(n.min)||0)*60*75 + (parseInt(n.sec)||0)*75 + (parseInt(n.frm)||0);
          const secs = Math.floor((nxt - cur) / 75);
          e.dur = `${Math.floor(secs/60)}:${(secs%60).toString().padStart(2,'0')}`;
          break;
        }
      }
    }
  }
  return entries;
}

// ============================================================================
// API Route
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = performance.now();
  
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    if (!files.length) {
      return NextResponse.json({ error: 'No files' }, { status: 400 });
    }

    // Build file lookup
    const fileMap = new Map<string, File>();
    for (const f of files) {
      fileMap.set(f.name.toUpperCase(), f);
    }

    let id: any = null;
    let cdText: any = null;
    let pqEntries: any[] = [];
    let referencedFiles: string[] = [];

    // 1. Parse DDPMS first to get list of referenced files
    const ddpmsFile = fileMap.get('DDPMS');
    if (ddpmsFile) {
      const buf = Buffer.from(await ddpmsFile.arrayBuffer());
      referencedFiles = parseDDPMS(buf);
    }

    // 2. Parse DDPID
    const ddpidFile = fileMap.get('DDPID');
    if (ddpidFile) {
      const buf = Buffer.from(await ddpidFile.arrayBuffer());
      id = parseDDPID(buf);
    }

    // 3. Parse only files referenced in DDPMS + CD-TEXT .BIN files
    for (const [upperName, file] of fileMap) {
      // Skip DDPMS/DDPID (already parsed)
      if (upperName === 'DDPMS' || upperName === 'DDPID') continue;
      
      // Check if referenced in DDPMS or is a CD-TEXT file
      const isReferenced = referencedFiles.some(ref => ref.toUpperCase() === upperName);
      const isCdText = (upperName.endsWith('.BIN') && file.size <= 10240) || upperName.includes('CDTEXT');
      
      if (!isReferenced && !isCdText) continue;
      
      const buf = Buffer.from(await file.arrayBuffer());
      
      if (upperName === 'DDPPQ' || upperName.includes('PQ')) {
        pqEntries = parseDDPPQ(buf);
      } else if (isCdText) {
        cdText = parseCdText(buf);
      }
    }

    // Build tracks
    const trackMap = new Map<number, any>();
    
    for (const pq of pqEntries) {
      if (pq.idx === '01' && pq.trk !== 'AA' && pq.trk !== '00') {
        const n = parseInt(pq.trk);
        trackMap.set(n, { number: n, duration: pq.dur, isrc: pq.isrc || undefined });
      }
      if (pq.idx === '00' && pq.isrc && pq.trk !== 'AA' && pq.trk !== '00') {
        const n = parseInt(pq.trk);
        if (!trackMap.has(n)) trackMap.set(n, { number: n });
        trackMap.get(n).isrc = pq.isrc;
      }
    }

    if (cdText) {
      for (const ct of cdText.tracks) {
        if (!trackMap.has(ct.track)) trackMap.set(ct.track, { number: ct.track });
        const t = trackMap.get(ct.track);
        if (ct.title) t.title = ct.title;
        t.performer = cdText.artist;
        if (ct.isrc && !t.isrc) t.isrc = ct.isrc;
      }
    }

    const tracks = Array.from(trackMap.values()).sort((a,b) => a.number - b.number);
    const leadout = pqEntries.find((e: any) => e.trk === 'AA' && e.idx === '01');
    const totalSecs = leadout ? (parseInt(leadout.min)||0)*60 + (parseInt(leadout.sec)||0) : 0;
    const totalDur = leadout ? `${Math.floor(totalSecs/60)}:${(totalSecs%60).toString().padStart(2,'0')}` : undefined;

    const elapsed = performance.now() - startTime;
    const secs = Math.floor(elapsed / 1000);
    const ms = Math.floor(elapsed % 1000);
    const parseTime = `${secs}.${ms.toString().padStart(4, '0')}`;

    return NextResponse.json({
      parseTime,
      referencedFiles,
      id,
      cdText,
      pqEntries,
      tracks,
      summary: {
        albumTitle: cdText?.album,
        performer: cdText?.artist,
        upc: cdText?.upc || id?.upc,
        trackCount: tracks.length,
        totalDuration: totalDur,
        hasCdText: !!cdText,
        hasPq: pqEntries.length > 0,
      },
    });
  } catch (error) {
    const elapsed = performance.now() - startTime;
    const secs = Math.floor(elapsed / 1000);
    const ms = Math.floor(elapsed % 1000);
    const parseTime = `${secs}.${ms.toString().padStart(4, '0')}`;
    console.error('DDP error:', error);
    return NextResponse.json({ parseTime, error: String(error) }, { status: 500 });
  }
}
