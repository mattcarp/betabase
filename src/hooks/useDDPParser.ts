"use client";

/**
 * useDDPParser Hook
 *
 * Handles DDP file detection, parsing, and MusicBrainz lookup.
 * All processing happens client-side - no server upload.
 */

import { useState, useCallback } from 'react';
import {
  detectDDP,
  parseDDP,
  getTrackOffsets,
  getLeadoutOffset,
} from '@/services/ddpParser';
import {
  calculateDiscId,
  lookupFromDDP,
  type MusicBrainzLookupResult,
} from '@/services/musicBrainz';
import type { ParsedDDP, DDPDetectionResult } from '@/types/ddp';

// ============================================================================
// Types
// ============================================================================

export interface DDPParseResult {
  detection: DDPDetectionResult;
  parsed?: ParsedDDP;
  discId?: string;
  musicBrainz?: MusicBrainzLookupResult;
  error?: string;
}

export interface UseDDPParserReturn {
  // State
  isDetecting: boolean;
  isParsing: boolean;
  isLookingUp: boolean;
  result: DDPParseResult | null;
  error: string | null;

  // Actions
  processFiles: (files: File[]) => Promise<DDPParseResult | null>;
  reset: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useDDPParser(): UseDDPParserReturn {
  const [isDetecting, setIsDetecting] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [result, setResult] = useState<DDPParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setIsDetecting(false);
    setIsParsing(false);
    setIsLookingUp(false);
    setResult(null);
    setError(null);
  }, []);

  const processFiles = useCallback(async (files: File[]): Promise<DDPParseResult | null> => {
    try {
      setError(null);

      // Step 1: Detect if this is a DDP
      setIsDetecting(true);
      const detection = detectDDP(files);

      if (!detection.isDDP) {
        setIsDetecting(false);
        const partialResult: DDPParseResult = {
          detection,
          error: 'No DDPMS file found. This does not appear to be a DDP folder.',
        };
        setResult(partialResult);
        return partialResult;
      }

      // Notify about skipped files
      if (detection.skippedFiles.length > 0) {
        console.log('Skipped large files (likely audio):', detection.skippedFiles);
      }

      setIsDetecting(false);

      // Step 2: Parse DDP files
      setIsParsing(true);
      const parsed = await parseDDP(files);
      setIsParsing(false);

      // Step 3: Calculate Disc ID if we have PQ data
      let discId: string | undefined;
      if (parsed.pqEntries.length > 0) {
        try {
          const offsets = getTrackOffsets(parsed.pqEntries);
          const leadout = getLeadoutOffset(parsed.pqEntries);

          if (offsets.length > 0 && leadout > 0) {
            discId = await calculateDiscId(1, offsets.length, leadout, offsets);
          }
        } catch (e) {
          console.warn('Failed to calculate disc ID:', e);
        }
      }

      // Initial result without MusicBrainz
      const intermediateResult: DDPParseResult = {
        detection,
        parsed,
        discId,
      };
      setResult(intermediateResult);

      // Step 4: Look up MusicBrainz (async, non-blocking)
      setIsLookingUp(true);

      // Collect ISRCs from tracks
      const isrcs = parsed.tracks
        .map(t => t.isrc)
        .filter((isrc): isrc is string => !!isrc);

      const musicBrainz = await lookupFromDDP({
        discId,
        barcode: parsed.summary.upc,
        isrcs,
        artist: parsed.cdText?.albumPerformer,
        title: parsed.cdText?.albumTitle,
      });

      setIsLookingUp(false);

      // Final result with MusicBrainz
      const finalResult: DDPParseResult = {
        detection,
        parsed,
        discId,
        musicBrainz,
      };
      setResult(finalResult);

      return finalResult;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error parsing DDP';
      setError(errorMessage);
      setIsDetecting(false);
      setIsParsing(false);
      setIsLookingUp(false);

      const errorResult: DDPParseResult = {
        detection: detectDDP(files),
        error: errorMessage,
      };
      setResult(errorResult);
      return errorResult;
    }
  }, []);

  return {
    isDetecting,
    isParsing,
    isLookingUp,
    result,
    error,
    processFiles,
    reset,
  };
}

export default useDDPParser;
