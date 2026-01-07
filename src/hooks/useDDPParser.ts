"use client";

/**
 * useDDPParser Hook
 *
 * Handles DDP file detection and parsing via server-side API.
 * MusicBrainz lookup happens after parsing.
 */

import { useState, useCallback } from 'react';
import {
  lookupFromDDP,
  type MusicBrainzLookupResult,
} from '@/services/musicBrainz';

// ============================================================================
// Types
// ============================================================================

interface ParsedDDPResponse {
  parseTime: string;
  referencedFiles: string[];
  id?: {
    ddpid: string;
    upc: string;
    mid: string;
  };
  cdText?: {
    album: string;
    artist: string;
    upc: string;
    tracks: Array<{ track: number; title?: string; isrc?: string }>;
  };
  pqEntries: Array<{
    trk: string;
    idx: string;
    min: string;
    sec: string;
    frm: string;
    isrc: string;
    dur?: string;
  }>;
  tracks: Array<{
    number: number;
    title?: string;
    performer?: string;
    duration?: string;
    isrc?: string;
  }>;
  summary: {
    albumTitle?: string;
    performer?: string;
    upc?: string;
    trackCount: number;
    totalDuration?: string;
    hasCdText: boolean;
    hasPq: boolean;
  };
}

export interface DDPParseResult {
  parseTime?: string;
  parsed?: ParsedDDPResponse;
  musicBrainz?: MusicBrainzLookupResult;
  error?: string;
}

export interface UseDDPParserReturn {
  isDetecting: boolean;
  isParsing: boolean;
  isLookingUp: boolean;
  result: DDPParseResult | null;
  error: string | null;
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
      setIsDetecting(true);

      // Check for DDPMS
      const hasDDPMS = files.some(f => f.name.toUpperCase() === 'DDPMS');
      if (!hasDDPMS) {
        setIsDetecting(false);
        const partialResult: DDPParseResult = {
          error: 'No DDPMS file found. This does not appear to be a DDP folder.',
        };
        setResult(partialResult);
        return partialResult;
      }

      setIsDetecting(false);
      setIsParsing(true);

      // Filter to small files only (DDPMS, DDPID, DDPPQ, .BIN < 10KB)
      const smallFiles = files.filter(f => {
        const upper = f.name.toUpperCase();
        if (upper === 'DDPMS' || upper === 'DDPID' || upper === 'DDPPQ') return true;
        if (upper.includes('PQ')) return true;
        if (upper.endsWith('.BIN') && f.size <= 10240) return true;
        if (upper.includes('CDTEXT')) return true;
        return false;
      });

      // Send to API
      const formData = new FormData();
      for (const file of smallFiles) {
        formData.append('files', file);
      }

      const response = await fetch('/api/ddp', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const parsed: ParsedDDPResponse = await response.json();
      setIsParsing(false);

      // Initial result
      const intermediateResult: DDPParseResult = {
        parseTime: parsed.parseTime,
        parsed,
      };
      setResult(intermediateResult);

      // MusicBrainz lookup
      setIsLookingUp(true);

      const isrcs = parsed.tracks
        .map(t => t.isrc)
        .filter((isrc): isrc is string => !!isrc);

      const musicBrainz = await lookupFromDDP({
        barcode: parsed.summary.upc,
        isrcs,
        artist: parsed.summary.performer,
        title: parsed.summary.albumTitle,
      });

      setIsLookingUp(false);

      const finalResult: DDPParseResult = {
        parseTime: parsed.parseTime,
        parsed,
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
