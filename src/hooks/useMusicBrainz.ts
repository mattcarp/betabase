/**
 * useMusicBrainz Hook
 * 
 * React hook for fetching MusicBrainz data with SWR caching.
 * Provides "Would you like more information?" workflow.
 */

import useSWR from 'swr';
import { useState, useCallback } from 'react';
import type { MusicBrainzLookupResult } from '@/services/musicBrainz';

// ============================================================================
// Types
// ============================================================================

interface MusicBrainzQuery {
  discId?: string;
  barcode?: string;
  isrc?: string;
  artist?: string;
  title?: string;
}

interface MusicBrainzResponse extends MusicBrainzLookupResult {
  coverArtUrl?: string | null;
}

interface UseMusicBrainzOptions {
  /** Skip initial fetch - useful for "Would you like more info?" flow */
  skipInitialFetch?: boolean;
  /** Include cover art in response */
  includeCoverArt?: boolean;
}

interface UseMusicBrainzReturn {
  /** MusicBrainz lookup result */
  data: MusicBrainzResponse | undefined;
  /** Loading state */
  isLoading: boolean;
  /** Error if any */
  error: Error | undefined;
  /** Whether user has requested the data */
  isRequested: boolean;
  /** Call this when user clicks "Show More Info" */
  requestData: () => void;
  /** Reset the request state */
  reset: () => void;
}

// ============================================================================
// Fetcher
// ============================================================================

const fetcher = async (url: string): Promise<MusicBrainzResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Failed to fetch MusicBrainz data');
  }
  return res.json();
};

// ============================================================================
// Hook
// ============================================================================

export function useMusicBrainz(
  query: MusicBrainzQuery | null,
  options: UseMusicBrainzOptions = {}
): UseMusicBrainzReturn {
  const { skipInitialFetch = false, includeCoverArt = true } = options;
  const [isRequested, setIsRequested] = useState(!skipInitialFetch);

  // Build URL from query
  const buildUrl = useCallback(() => {
    if (!query) return null;
    
    const params = new URLSearchParams();
    if (query.discId) params.set('discId', query.discId);
    if (query.barcode) params.set('barcode', query.barcode);
    if (query.isrc) params.set('isrc', query.isrc);
    if (query.artist) params.set('artist', query.artist);
    if (query.title) params.set('title', query.title);
    if (!includeCoverArt) params.set('coverArt', 'false');
    
    if (params.toString() === '') return null;
    
    return `/api/musicbrainz?${params.toString()}`;
  }, [query, includeCoverArt]);

  const url = buildUrl();
  
  // Only fetch if requested (or skipInitialFetch is false)
  const shouldFetch = url && isRequested;

  const { data, error, isLoading } = useSWR<MusicBrainzResponse>(
    shouldFetch ? url : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  const requestData = useCallback(() => {
    setIsRequested(true);
  }, []);

  const reset = useCallback(() => {
    setIsRequested(!skipInitialFetch);
  }, [skipInitialFetch]);

  return {
    data,
    isLoading,
    error,
    isRequested,
    requestData,
    reset,
  };
}

export default useMusicBrainz;
