/**
 * DDP Parsing Tool
 *
 * Parses DDP (Disc Description Protocol) files and enriches with MusicBrainz metadata.
 * Handles DDPMS (Map Stream), DDPID (Disc ID), DDPPQ (PQ descriptor), and CD-TEXT.
 */

import { tool } from 'ai';
import { z } from 'zod';

export const ddpParseTool = tool({
  description: `Parse DDP (Disc Description Protocol) files to extract CD metadata and track information.

Call this tool when:
- User uploads or mentions a DDP folder/files
- User wants to analyze a CD master
- User asks about track listings, ISRCs, or disc metadata
- You need to prepare data for MusicBrainz lookup

The tool returns:
- Album title and performer (from CD-TEXT if available)
- Track listing with titles, performers, ISRCs, and durations
- UPC/barcode for the disc
- MusicBrainz Disc ID for database lookups
- Track offsets and timing information

After parsing, you can use lookupMusicbrainz tool to get additional metadata from MusicBrainz database.`,

  parameters: z.object({
    fileList: z.array(z.string()).describe('List of DDP file names (DDPMS, DDPID, DDPPQ, CDTEXT, etc.)'),
    hasCdText: z.boolean().optional().describe('Whether CD-TEXT file is present'),
    hasMs: z.boolean().optional().describe('Whether DDPMS file is present'),
    hasPq: z.boolean().optional().describe('Whether DDPPQ file is present'),
    context: z.string().optional().describe('Additional context about the DDP files'),
  }),

  execute: async ({ fileList, hasCdText, hasMs, hasPq, context }) => {
    // Validate required files
    if (!hasMs && !fileList.some(f => f.toUpperCase() === 'DDPMS')) {
      return {
        success: false,
        error: 'DDPMS file is required for DDP parsing',
        suggestion: 'Please ensure the DDP folder contains a DDPMS file (the main map stream file).',
      };
    }

    // This tool provides metadata about what the DDP contains
    // Actual parsing happens client-side in the browser
    const response = {
      success: true,
      message: 'DDP structure detected. Ready for client-side parsing.',
      files: {
        ddpms: hasMs || fileList.some(f => f.toUpperCase() === 'DDPMS'),
        ddpid: fileList.some(f => f.toUpperCase() === 'DDPID'),
        ddppq: hasPq || fileList.some(f => f.toUpperCase().includes('PQ')),
        cdtext: hasCdText || fileList.some(f => f.toUpperCase().includes('CDTEXT') || f.toUpperCase().includes('CD-TEXT')),
      },
      canCalculateDiscId: (hasMs || fileList.some(f => f.toUpperCase() === 'DDPMS')) &&
                          (hasPq || fileList.some(f => f.toUpperCase().includes('PQ'))),
      nextSteps: [
        'Parse DDP files in browser to extract metadata',
        hasCdText ? 'CD-TEXT available - album and track titles will be extracted' : 'No CD-TEXT - only technical metadata available',
        'Calculate MusicBrainz Disc ID from track offsets',
        'Query MusicBrainz for additional release information',
      ],
    };

    if (context) {
      response.message += ` Context: ${context}`;
    }

    return response;
  },
});

export const ddpMusicBrainzLookupTool = tool({
  description: `Perform MusicBrainz lookup using DDP-derived data.

Call this tool after parsing a DDP to get official release metadata from MusicBrainz.
Works with:
- MusicBrainz Disc ID (calculated from track offsets)
- UPC/Barcode (from DDPID)
- ISRC codes (from tracks)
- Artist + Album name (from CD-TEXT)

Returns comprehensive release information including:
- Official album title and artist
- Release date, country, and label
- Catalog number and barcode
- Complete track listing with accurate durations
- Alternative releases (different countries, reissues, etc.)`,

  parameters: z.object({
    discId: z.string().optional().describe('MusicBrainz Disc ID (calculated from track offsets)'),
    barcode: z.string().optional().describe('UPC/EAN barcode from DDPID'),
    isrcs: z.array(z.string()).optional().describe('Array of ISRC codes from tracks'),
    artist: z.string().optional().describe('Artist name from CD-TEXT'),
    album: z.string().optional().describe('Album title from CD-TEXT'),
  }),

  execute: async ({ discId, barcode, isrcs, artist, album }) => {
    // This is a server-side tool, so we'll call the MusicBrainz service directly
    // Import at function level to avoid server-side bundling issues
    const { lookupFromDDP } = await import('../services/musicBrainz');

    try {
      const result = await lookupFromDDP({
        discId,
        barcode,
        isrcs,
        artist,
        title: album,
      });

      if (!result.success || result.releases.length === 0) {
        return {
          success: false,
          error: result.error || 'No matching releases found',
          suggestion: artist && album
            ? `Try verifying the artist name "${artist}" and album title "${album}" are correct.`
            : 'Try extracting artist and album from CD-TEXT first.',
          attemptedMethods: [
            discId ? `Disc ID: ${discId}` : null,
            barcode ? `Barcode: ${barcode}` : null,
            isrcs?.length ? `ISRCs: ${isrcs.length} codes` : null,
            artist && album ? `Search: "${artist}" - "${album}"` : null,
          ].filter(Boolean),
        };
      }

      // Format the best match
      const release = result.releases[0];
      const artistNames = release.artistCredit?.map(ac => ac.name).join(', ') || 'Unknown Artist';
      const labelInfo = release.labelInfo?.[0];

      return {
        success: true,
        source: result.source,
        matchMethod:
          result.source === 'discid' ? 'Disc ID (most accurate)' :
          result.source === 'barcode' ? 'UPC/Barcode' :
          result.source === 'isrc' ? 'ISRC code' :
          'Text search',
        release: {
          id: release.id,
          title: release.title,
          artist: artistNames,
          date: release.date || 'Unknown',
          country: release.country || 'Unknown',
          status: release.status || 'Official',
          barcode: release.barcode || null,
        },
        label: labelInfo ? {
          name: labelInfo.label?.name || 'Unknown',
          catalogNumber: labelInfo.catalogNumber || null,
        } : null,
        releaseGroup: release.releaseGroup ? {
          id: release.releaseGroup.id,
          title: release.releaseGroup.title,
          type: release.releaseGroup.primaryType || 'Album',
        } : null,
        media: release.media?.[0] ? {
          format: release.media[0].format || 'CD',
          trackCount: release.media[0].trackCount || 0,
        } : null,
        tracks: release.media?.[0]?.tracks?.map(track => ({
          position: track.position,
          number: track.number,
          title: track.title,
          duration: track.length ? formatDuration(track.length) : null,
          recording: track.recording ? {
            title: track.recording.title,
            isrc: track.recording.isrc,
          } : null,
        })),
        alternativeReleases: result.releases.slice(1, 4).map(r => ({
          id: r.id,
          title: r.title,
          date: r.date,
          country: r.country,
        })),
        musicbrainzUrl: `https://musicbrainz.org/release/${release.id}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'MusicBrainz lookup failed',
        suggestion: 'Check your internet connection and try again.',
      };
    }
  },
});

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
