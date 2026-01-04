/**
 * MusicBrainz Service
 *
 * Calculates MusicBrainz Disc IDs from DDP track offsets and
 * queries the MusicBrainz API for release metadata.
 *
 * References:
 * - https://musicbrainz.org/doc/Disc_ID_Calculation
 * - https://musicbrainz.org/doc/MusicBrainz_API
 * - https://musicbrainz.org/doc/MusicBrainz_API/Search
 */

// ============================================================================
// Types
// ============================================================================

export interface MusicBrainzArtist {
  id: string;
  name: string;
  sortName?: string;
}

export interface MusicBrainzRecording {
  id: string;
  title: string;
  length?: number; // milliseconds
  isrc?: string;
  artistCredit?: MusicBrainzArtist[];
}

export interface MusicBrainzMedium {
  position: number;
  format?: string;
  trackCount: number;
  tracks?: {
    position: number;
    number: string;
    title: string;
    length?: number;
    recording?: MusicBrainzRecording;
  }[];
}

export interface MusicBrainzRelease {
  id: string;
  title: string;
  status?: string;
  date?: string;
  country?: string;
  barcode?: string;
  artistCredit?: MusicBrainzArtist[];
  releaseGroup?: {
    id: string;
    title: string;
    primaryType?: string;
    secondaryTypes?: string[];
  };
  media?: MusicBrainzMedium[];
  labelInfo?: {
    catalogNumber?: string;
    label?: {
      id: string;
      name: string;
    };
  }[];
}

export interface MusicBrainzLookupResult {
  success: boolean;
  source: 'discid' | 'barcode' | 'isrc' | 'search';
  discId?: string;
  releases: MusicBrainzRelease[];
  error?: string;
}

// ============================================================================
// MusicBrainz Disc ID Calculation
// ============================================================================

/**
 * Calculates a MusicBrainz Disc ID from track offsets.
 *
 * Algorithm:
 * 1. Create a TOC string with first track, last track, leadout offset, and all track offsets
 * 2. Hash with SHA-1
 * 3. Encode with MusicBrainz's modified Base64
 *
 * @param firstTrack - First track number (usually 1)
 * @param lastTrack - Last track number
 * @param leadoutOffset - Leadout offset in frames (+ 150 for lead-in)
 * @param trackOffsets - Array of track start offsets in frames (+ 150 for lead-in)
 */
export async function calculateDiscId(
  firstTrack: number,
  lastTrack: number,
  leadoutOffset: number,
  trackOffsets: number[]
): Promise<string> {
  // Build the TOC data to hash
  // Format: First track (1 byte) + Last track (1 byte) + Leadout (4 bytes) + 99 track offsets (4 bytes each)

  // Convert to hex string for hashing
  let tocHex = '';

  // First track number (1 byte -> 2 hex chars)
  tocHex += firstTrack.toString(16).padStart(2, '0').toUpperCase();

  // Last track number (1 byte -> 2 hex chars)
  tocHex += lastTrack.toString(16).padStart(2, '0').toUpperCase();

  // Leadout offset (4 bytes -> 8 hex chars)
  tocHex += leadoutOffset.toString(16).padStart(8, '0').toUpperCase();

  // 99 track offsets (4 bytes each -> 8 hex chars each)
  for (let i = 0; i < 99; i++) {
    const offset = trackOffsets[i] || 0;
    tocHex += offset.toString(16).padStart(8, '0').toUpperCase();
  }

  // Hash with SHA-1
  const encoder = new TextEncoder();
  const data = hexToBytes(tocHex);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = new Uint8Array(hashBuffer);

  // Convert to MusicBrainz Base64
  // MusicBrainz uses a modified Base64 alphabet: . _ - instead of + / =
  const base64 = arrayBufferToBase64(hashArray);
  const mbBase64 = base64
    .replace(/\+/g, '.')
    .replace(/\//g, '_')
    .replace(/=/g, '-');

  return mbBase64;
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function arrayBufferToBase64(buffer: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary);
}

// ============================================================================
// MusicBrainz API Queries
// ============================================================================

const MUSICBRAINZ_API = 'https://musicbrainz.org/ws/2';
const USER_AGENT = 'SIAM-DDP-Parser/1.0.0 (https://thebetabase.com)';

async function mbFetch(endpoint: string, params: Record<string, string> = {}): Promise<any> {
  const url = new URL(`${MUSICBRAINZ_API}/${endpoint}`);
  url.searchParams.set('fmt', 'json');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`MusicBrainz API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Look up a release by MusicBrainz Disc ID
 */
export async function lookupByDiscId(discId: string): Promise<MusicBrainzLookupResult> {
  try {
    const data = await mbFetch(`discid/${discId}`, {
      inc: 'artist-credits+labels+recordings',
    });

    return {
      success: true,
      source: 'discid',
      discId,
      releases: data.releases || [],
    };
  } catch (error) {
    return {
      success: false,
      source: 'discid',
      discId,
      releases: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Search releases by barcode (UPC/EAN)
 */
export async function searchByBarcode(barcode: string): Promise<MusicBrainzLookupResult> {
  try {
    // Clean barcode - remove non-digits
    const cleanBarcode = barcode.replace(/\D/g, '');
    if (!cleanBarcode) {
      return {
        success: false,
        source: 'barcode',
        releases: [],
        error: 'Invalid barcode',
      };
    }

    const data = await mbFetch('release', {
      query: `barcode:${cleanBarcode}`,
    });

    return {
      success: true,
      source: 'barcode',
      releases: data.releases || [],
    };
  } catch (error) {
    return {
      success: false,
      source: 'barcode',
      releases: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Search recordings by ISRC
 */
export async function searchByIsrc(isrc: string): Promise<MusicBrainzLookupResult> {
  try {
    // Clean ISRC - remove non-alphanumeric
    const cleanIsrc = isrc.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (cleanIsrc.length !== 12) {
      return {
        success: false,
        source: 'isrc',
        releases: [],
        error: 'Invalid ISRC format',
      };
    }

    const data = await mbFetch('recording', {
      query: `isrc:${cleanIsrc}`,
      inc: 'releases+artist-credits',
    });

    // Extract releases from recordings
    const releaseMap = new Map<string, MusicBrainzRelease>();
    for (const recording of data.recordings || []) {
      for (const release of recording.releases || []) {
        if (!releaseMap.has(release.id)) {
          releaseMap.set(release.id, release);
        }
      }
    }

    return {
      success: true,
      source: 'isrc',
      releases: Array.from(releaseMap.values()),
    };
  } catch (error) {
    return {
      success: false,
      source: 'isrc',
      releases: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Search releases by artist and title
 */
export async function searchByArtistTitle(
  artist: string,
  title: string
): Promise<MusicBrainzLookupResult> {
  try {
    const query = `artist:"${artist}" AND release:"${title}"`;

    const data = await mbFetch('release', {
      query,
      limit: '10',
    });

    return {
      success: true,
      source: 'search',
      releases: data.releases || [],
    };
  } catch (error) {
    return {
      success: false,
      source: 'search',
      releases: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// Combined Lookup - Try Multiple Methods
// ============================================================================

export interface DDPMusicBrainzQuery {
  discId?: string;
  barcode?: string;
  isrcs?: string[];
  artist?: string;
  title?: string;
}

/**
 * Attempt to find MusicBrainz metadata using multiple methods.
 * Tries in order: Disc ID, Barcode, ISRCs, then text search.
 */
export async function lookupFromDDP(query: DDPMusicBrainzQuery): Promise<MusicBrainzLookupResult> {
  // Try Disc ID first (most accurate)
  if (query.discId) {
    const result = await lookupByDiscId(query.discId);
    if (result.success && result.releases.length > 0) {
      return result;
    }
  }

  // Try barcode (UPC/EAN)
  if (query.barcode) {
    const result = await searchByBarcode(query.barcode);
    if (result.success && result.releases.length > 0) {
      return result;
    }
  }

  // Try first ISRC
  if (query.isrcs && query.isrcs.length > 0) {
    for (const isrc of query.isrcs.slice(0, 3)) { // Try first 3
      const result = await searchByIsrc(isrc);
      if (result.success && result.releases.length > 0) {
        return result;
      }
    }
  }

  // Try artist + title search
  if (query.artist && query.title) {
    const result = await searchByArtistTitle(query.artist, query.title);
    if (result.success && result.releases.length > 0) {
      return result;
    }
  }

  return {
    success: false,
    source: 'search',
    releases: [],
    error: 'No matching releases found in MusicBrainz',
  };
}

// ============================================================================
// Format Helpers
// ============================================================================

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function getArtistNames(artistCredit?: MusicBrainzArtist[]): string {
  if (!artistCredit || artistCredit.length === 0) return 'Unknown Artist';
  return artistCredit.map(a => a.name).join(', ');
}
