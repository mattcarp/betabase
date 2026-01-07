/**
 * MusicBrainz API Route
 * 
 * Server-side API for MusicBrainz lookups with caching.
 * Supports lookup by disc ID, barcode, ISRC, or artist/title search.
 * 
 * Usage:
 *   GET /api/musicbrainz?discId=xxx
 *   GET /api/musicbrainz?barcode=82796942772
 *   GET /api/musicbrainz?isrc=USSM19916946
 *   GET /api/musicbrainz?artist=Electric%20Light%20Orchestra&title=ELO%20II
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  lookupFromDDP,
  lookupWithCoverArt,
  getFullReleaseDetails,
  checkCoverArt,
  type DDPMusicBrainzQuery,
} from '@/services/musicBrainz';

// Cache results for 1 hour (MusicBrainz data rarely changes)
const CACHE_DURATION = 3600;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const discId = searchParams.get('discId');
    const barcode = searchParams.get('barcode');
    const isrc = searchParams.get('isrc');
    const artist = searchParams.get('artist');
    const title = searchParams.get('title');
    const releaseId = searchParams.get('releaseId');
    const includeCoverArt = searchParams.get('coverArt') !== 'false';
    
    // If releaseId is provided, get full details for that specific release
    if (releaseId) {
      const [release, coverArtUrl] = await Promise.all([
        getFullReleaseDetails(releaseId),
        includeCoverArt ? checkCoverArt(releaseId) : null,
      ]);
      
      if (!release) {
        return NextResponse.json(
          { error: 'Release not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { release, coverArtUrl },
        {
          headers: {
            'Cache-Control': `public, max-age=${CACHE_DURATION}, stale-while-revalidate=${CACHE_DURATION * 2}`,
          },
        }
      );
    }
    
    // Build query from params
    const query: DDPMusicBrainzQuery = {};
    
    if (discId) query.discId = discId;
    if (barcode) query.barcode = barcode;
    if (isrc) query.isrcs = [isrc];
    if (artist) query.artist = artist;
    if (title) query.title = title;
    
    // Check if we have any search criteria
    if (Object.keys(query).length === 0) {
      return NextResponse.json(
        { error: 'No search criteria provided. Use discId, barcode, isrc, or artist+title.' },
        { status: 400 }
      );
    }
    
    // Perform lookup with optional cover art
    if (includeCoverArt) {
      const { result, coverArtUrl } = await lookupWithCoverArt(query);
      
      return NextResponse.json(
        { ...result, coverArtUrl },
        {
          headers: {
            'Cache-Control': `public, max-age=${CACHE_DURATION}, stale-while-revalidate=${CACHE_DURATION * 2}`,
          },
        }
      );
    }
    
    const result = await lookupFromDDP(query);
    
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': `public, max-age=${CACHE_DURATION}, stale-while-revalidate=${CACHE_DURATION * 2}`,
      },
    });
    
  } catch (error) {
    console.error('MusicBrainz API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
