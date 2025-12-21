/**
 * MusicBrainz Lookup Tool
 *
 * Fetches album/release metadata from MusicBrainz API.
 * Used after CD-TEXT parsing to enrich metadata with official database info.
 */

import { tool } from 'ai';
import { z } from 'zod';

const MUSICBRAINZ_API = 'https://musicbrainz.org/ws/2';
const USER_AGENT = 'SIAM/1.0 (https://thebetabase.com)';

interface MusicBrainzRelease {
  id: string;
  score: number;
  title: string;
  status?: string;
  date?: string;
  country?: string;
  barcode?: string;
  'release-group'?: {
    id: string;
    title: string;
    'primary-type'?: string;
  };
  'artist-credit'?: Array<{
    artist: {
      id: string;
      name: string;
      'sort-name': string;
    };
  }>;
  'label-info'?: Array<{
    'catalog-number'?: string;
    label?: {
      id: string;
      name: string;
    };
  }>;
  media?: Array<{
    format?: string;
    'track-count': number;
    tracks?: Array<{
      id: string;
      number: string;
      title: string;
      length?: number;
    }>;
  }>;
}

interface MusicBrainzSearchResult {
  created: string;
  count: number;
  offset: number;
  releases: MusicBrainzRelease[];
}

async function searchMusicBrainz(
  artist: string,
  album: string
): Promise<MusicBrainzSearchResult | null> {
  // URL-encode and format the query
  const query = `release:${encodeURIComponent(album)}+AND+artist:${encodeURIComponent(artist)}`;
  const url = `${MUSICBRAINZ_API}/release/?query=${query}&fmt=json&limit=5`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('MusicBrainz API error:', response.status, response.statusText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('MusicBrainz fetch error:', error);
    return null;
  }
}

async function getReleaseDetails(releaseId: string): Promise<MusicBrainzRelease | null> {
  const url = `${MUSICBRAINZ_API}/release/${releaseId}?inc=artist-credits+labels+recordings+release-groups&fmt=json`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('MusicBrainz release fetch error:', error);
    return null;
  }
}

export const musicbrainzLookupTool = tool({
  description: `Look up an album or release in the MusicBrainz database.
Call this tool when the user wants to verify album metadata, find additional release info,
or when you've just parsed CD-TEXT data and want to enrich it with MusicBrainz metadata.
Returns release details including label, date, country, barcode, and track listing.`,

  parameters: z.object({
    artist: z.string().describe('The artist name to search for'),
    album: z.string().describe('The album/release title to search for'),
    includeTrackList: z.boolean().optional().default(true).describe('Include full track listing'),
  }),

  execute: async ({ artist, album, includeTrackList }) => {
    // Search for the release
    const searchResult = await searchMusicBrainz(artist, album);

    if (!searchResult || searchResult.releases.length === 0) {
      return {
        success: false,
        error: `No releases found for "${album}" by "${artist}"`,
        suggestion: 'Try searching with a slightly different album title or artist name.',
      };
    }

    // Get the best match (highest score)
    const bestMatch = searchResult.releases[0];

    // Fetch detailed info if we want track listing
    let detailedRelease = bestMatch;
    if (includeTrackList && bestMatch.id) {
      const details = await getReleaseDetails(bestMatch.id);
      if (details) {
        detailedRelease = details;
      }
    }

    // Format the response
    const artistCredit = detailedRelease['artist-credit']?.[0]?.artist;
    const labelInfo = detailedRelease['label-info']?.[0];
    const media = detailedRelease.media?.[0];

    const response: Record<string, unknown> = {
      success: true,
      matchScore: bestMatch.score,
      release: {
        id: detailedRelease.id,
        title: detailedRelease.title,
        artist: artistCredit?.name || artist,
        date: detailedRelease.date || 'Unknown',
        country: detailedRelease.country || 'Unknown',
        status: detailedRelease.status || 'Unknown',
        barcode: detailedRelease.barcode || null,
      },
      label: labelInfo ? {
        name: labelInfo.label?.name || 'Unknown',
        catalogNumber: labelInfo['catalog-number'] || null,
      } : null,
      releaseGroup: detailedRelease['release-group'] ? {
        id: detailedRelease['release-group'].id,
        title: detailedRelease['release-group'].title,
        type: detailedRelease['release-group']['primary-type'] || 'Album',
      } : null,
      format: media?.format || 'CD',
      trackCount: media?.['track-count'] || 0,
      musicbrainzUrl: `https://musicbrainz.org/release/${detailedRelease.id}`,
    };

    // Add track listing if available
    if (includeTrackList && media?.tracks) {
      response.tracks = media.tracks.map(track => ({
        number: track.number,
        title: track.title,
        duration: track.length ? formatDuration(track.length) : null,
      }));
    }

    // Add alternative releases if there are more matches
    if (searchResult.releases.length > 1) {
      response.alternativeReleases = searchResult.releases.slice(1, 4).map(r => ({
        id: r.id,
        title: r.title,
        date: r.date,
        country: r.country,
        score: r.score,
      }));
    }

    return response;
  },
});

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export { searchMusicBrainz, getReleaseDetails };
