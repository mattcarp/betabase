/**
 * CDTEXT Parsing Tool
 * 
 * A deterministic tool for parsing CD-TEXT binary data from DDP masters.
 * The LLM calls this tool when it detects hex data that looks like CDTEXT,
 * and receives structured, accurate data back for beautiful formatting.
 * 
 * This is the ideal LLM + Tool pattern:
 * - LLM: Recognizes the format, decides to call tool, formats output with flair
 * - Tool: Does the precise binary parsing that LLMs hallucinate on
 */

import { tool } from 'ai';
import { z } from 'zod';

// ============================================================================
// CDTEXT Constants
// ============================================================================

const PACK_TYPES: Record<number, string> = {
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
// Types
// ============================================================================

interface CdtextPack {
  packType: number;
  packTypeName: string;
  trackNumber: number;
  sequenceNumber: number;
  blockNumber: number;
  rawData: string;
  decodedText: string;
  crc: string;
  crcValid: boolean | null; // null = not validated
}

interface CdtextTrack {
  trackNumber: number;
  trackLabel: string; // "Album" or "Track 1", etc.
  fields: Record<string, string>;
}

interface CdtextParseResult {
  success: boolean;
  albumTitle?: string;
  albumArtist?: string;
  trackCount: number;
  tracks: CdtextTrack[];
  packs: CdtextPack[];
  warnings: string[];
  rawPackCount: number;
  encoding: string;
}

// ============================================================================
// Parser Implementation
// ============================================================================

function hexToBytes(hex: string): number[] {
  const cleanHex = hex.replace(/[\s\n\r]/g, '').toUpperCase();
  const bytes: number[] = [];
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes.push(parseInt(cleanHex.substring(i, i + 2), 16));
  }
  return bytes;
}

function bytesToAscii(bytes: number[]): string {
  let result = '';
  for (const byte of bytes) {
    if (byte === 0) break; // NULL terminator
    if (byte >= 0x20 && byte <= 0x7E) {
      result += String.fromCharCode(byte);
    } else if (byte >= 0x80) {
      // Extended ASCII (ISO-8859-1 / Latin-1)
      result += String.fromCharCode(byte);
    }
  }
  return result;
}

function parsePack(packBytes: number[], index: number): CdtextPack {
  const packType = packBytes[0];
  const trackNumber = packBytes[1];
  const sequenceNumber = packBytes[2];
  const blockCharPos = packBytes[3]; // Block number in upper 4 bits, char position in lower 4
  const blockNumber = (blockCharPos >> 4) & 0x0F;
  
  const dataBytes = packBytes.slice(4, 16);
  const crcBytes = packBytes.slice(16, 18);
  
  const rawData = dataBytes.map(b => b.toString(16).padStart(2, '0')).join(' ');
  const decodedText = bytesToAscii(dataBytes);
  const crc = crcBytes.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return {
    packType,
    packTypeName: PACK_TYPES[packType] || `UNKNOWN_0x${packType.toString(16).toUpperCase()}`,
    trackNumber,
    sequenceNumber,
    blockNumber,
    rawData,
    decodedText,
    crc,
    crcValid: null, // CRC validation is complex, skip for now
  };
}

function parseCdtext(hexInput: string): CdtextParseResult {
  const warnings: string[] = [];
  
  // Clean input
  const cleanHex = hexInput.replace(/[\s\n\r]/g, '').toUpperCase();
  
  // Validate length (must be multiple of 36 chars = 18 bytes per pack)
  if (cleanHex.length % 36 !== 0) {
    warnings.push(`Input length (${cleanHex.length} chars) is not a multiple of 36. Some packs may be incomplete.`);
  }
  
  // Validate hex characters
  if (!/^[0-9A-F]*$/.test(cleanHex)) {
    return {
      success: false,
      trackCount: 0,
      tracks: [],
      packs: [],
      warnings: ['Invalid characters in input. Expected hexadecimal only.'],
      rawPackCount: 0,
      encoding: 'unknown',
    };
  }
  
  const bytes = hexToBytes(cleanHex);
  const packCount = Math.floor(bytes.length / 18);
  const packs: CdtextPack[] = [];
  
  // Parse each 18-byte pack
  for (let i = 0; i < packCount; i++) {
    const packBytes = bytes.slice(i * 18, (i + 1) * 18);
    const pack = parsePack(packBytes, i);
    packs.push(pack);
  }
  
  // Organize by track
  const trackMap = new Map<number, Record<string, string[]>>();
  
  for (const pack of packs) {
    if (!trackMap.has(pack.trackNumber)) {
      trackMap.set(pack.trackNumber, {});
    }
    const trackFields = trackMap.get(pack.trackNumber)!;
    
    if (!trackFields[pack.packTypeName]) {
      trackFields[pack.packTypeName] = [];
    }
    
    if (pack.decodedText) {
      trackFields[pack.packTypeName].push(pack.decodedText);
    }
  }
  
  // Build track array
  const tracks: CdtextTrack[] = [];
  const sortedTrackNumbers = Array.from(trackMap.keys()).sort((a, b) => a - b);
  
  for (const trackNum of sortedTrackNumbers) {
    const rawFields = trackMap.get(trackNum)!;
    const fields: Record<string, string> = {};
    
    // Concatenate multi-pack fields
    for (const [fieldName, values] of Object.entries(rawFields)) {
      fields[fieldName] = values.join('');
    }
    
    tracks.push({
      trackNumber: trackNum,
      trackLabel: trackNum === 0 ? 'Album' : `Track ${trackNum}`,
      fields,
    });
  }
  
  // Extract album info
  const albumTrack = tracks.find(t => t.trackNumber === 0);
  const albumTitle = albumTrack?.fields['TITLE'];
  const albumArtist = albumTrack?.fields['PERFORMER'];
  
  // Count actual tracks (excluding album-level track 0)
  const trackCount = tracks.filter(t => t.trackNumber > 0).length;
  
  return {
    success: true,
    albumTitle,
    albumArtist,
    trackCount,
    tracks,
    packs,
    warnings,
    rawPackCount: packCount,
    encoding: 'ISO-8859-1 (Latin-1)', // Most common for CD-TEXT
  };
}

// ============================================================================
// AI SDK Tool Definition
// ============================================================================

export const cdtextTool = tool({
  description: `Parse CD-TEXT binary data from DDP masters or disc images. 
Call this tool when you see hexadecimal data that appears to be CD-TEXT format 
(starts with bytes like 80, 81, 82 which are pack type identifiers).
The tool returns structured metadata including album title, artist, and track listings.
After receiving the results, format them beautifully with cultural context and translations if needed.`,
  
  parameters: z.object({
    hexData: z.string().describe('The hexadecimal string containing CD-TEXT data. Can include spaces and newlines.'),
    includeRawPacks: z.boolean().optional().default(false).describe('Include raw pack data for debugging'),
  }),
  
  execute: async ({ hexData, includeRawPacks }) => {
    const result = parseCdtext(hexData);
    
    // Return a clean structure for the LLM
    if (!result.success) {
      return {
        success: false,
        error: result.warnings.join('; '),
      };
    }
    
    const response: any = {
      success: true,
      album: {
        title: result.albumTitle || 'Unknown Album',
        artist: result.albumArtist || 'Unknown Artist',
      },
      trackCount: result.trackCount,
      tracks: result.tracks.map(t => ({
        number: t.trackNumber === 0 ? 'Album' : t.trackNumber,
        title: t.fields['TITLE'] || null,
        performer: t.fields['PERFORMER'] || null,
        songwriter: t.fields['SONGWRITER'] || null,
        composer: t.fields['COMPOSER'] || null,
        isrc: t.fields['ISRC'] || null,
        message: t.fields['MESSAGE'] || null,
      })).filter(t => t.title || t.performer || t.isrc), // Only include tracks with data
      encoding: result.encoding,
      warnings: result.warnings,
    };
    
    if (includeRawPacks) {
      response.rawPacks = result.packs;
    }
    
    return response;
  },
});

// ============================================================================
// Export standalone parser for testing
// ============================================================================

export { parseCdtext, type CdtextParseResult, type CdtextTrack, type CdtextPack };
