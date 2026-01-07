"use client";

/**
 * DDP Display Component
 *
 * Beautiful display panel for parsed DDP data.
 * Uses shadcn/ui components with separator lines between items.
 */

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Disc3,
  Music2,
  FileText,
  Database,
  AlertCircle,
  X,
  Clock,
  Hash,
  Barcode,
  Building2,
  Calendar,
  MapPin,
  ExternalLink,
  CheckCircle2,
  Timer,
} from 'lucide-react';
import type { MusicBrainzLookupResult } from '@/services/musicBrainz';

// ============================================================================
// Types (matches API response)
// ============================================================================

interface ParsedDDPResponse {
  parseTime?: string;
  referencedFiles?: string[];
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
  pqEntries?: Array<{
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

interface DDPDisplayProps {
  ddp: ParsedDDPResponse;
  musicBrainz?: MusicBrainzLookupResult | null;
  isLoadingMusicBrainz?: boolean;
  className?: string;
  onDismiss?: () => void;
}

// ============================================================================
// Album Header
// ============================================================================

function AlbumHeader({ ddp, coverArtUrl, onDismiss }: { 
  ddp: ParsedDDPResponse; 
  coverArtUrl?: string | null;
  onDismiss?: () => void;
}) {
  const { summary, parseTime } = ddp;
  const [imageError, setImageError] = React.useState(false);

  return (
    <div className="flex gap-4">
      {/* Cover Art or Disc Icon */}
      <div className="shrink-0">
        {coverArtUrl && !imageError ? (
          <div className="relative w-20 h-20 rounded-lg overflow-hidden shadow-md bg-muted">
            <Image
              src={coverArtUrl}
              alt={summary.albumTitle || 'Album cover'}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
              unoptimized
            />
          </div>
        ) : (
          <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shadow-sm border border-border">
            <Disc3 className="h-10 w-10 text-primary/60" />
          </div>
        )}
      </div>

      {/* Album Info */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-foreground truncate">
              {summary.albumTitle || 'Untitled Album'}
            </h2>
            {summary.performer && (
              <p className="text-sm text-muted-foreground truncate">{summary.performer}</p>
            )}
          </div>
          {onDismiss && (
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 -mt-1 -mr-2" onClick={onDismiss}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5">
          {parseTime && (
            <Badge variant="outline" className="text-xs gap-1 bg-blue-500/10 text-blue-600 border-blue-500/20">
              <Timer className="h-3 w-3" />
              {parseTime}s
            </Badge>
          )}
          <Badge variant="secondary" className="text-xs gap-1">
            <Music2 className="h-3 w-3" />
            {summary.trackCount} tracks
          </Badge>
          {summary.totalDuration && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Clock className="h-3 w-3" />
              {summary.totalDuration}
            </Badge>
          )}
          {summary.hasCdText && (
            <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
              CD-TEXT
            </Badge>
          )}
          {summary.hasPq && (
            <Badge variant="outline" className="text-xs">
              PQ
            </Badge>
          )}
        </div>

        {/* UPC */}
        {summary.upc && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Barcode className="h-3 w-3" />
            <span className="font-mono">{summary.upc}</span>
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Track List
// ============================================================================

function TrackItem({ track, isLast }: { 
  track: ParsedDDPResponse['tracks'][0]; 
  isLast: boolean;
}) {
  return (
    <>
      <div className="flex items-center gap-3 py-3 px-1">
        <span className="w-6 text-sm font-mono text-muted-foreground text-right shrink-0">
          {track.number.toString().padStart(2, '0')}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {track.title || <span className="italic text-muted-foreground">Untitled</span>}
          </p>
          {track.performer && (
            <p className="text-xs text-muted-foreground truncate">{track.performer}</p>
          )}
        </div>
        <span className="text-sm font-mono text-muted-foreground shrink-0">
          {track.duration || '—'}
        </span>
        {track.isrc && (
          <Badge variant="outline" className="text-xs font-mono shrink-0 hidden sm:inline-flex">
            {track.isrc}
          </Badge>
        )}
      </div>
      {!isLast && <Separator className="bg-border/50" />}
    </>
  );
}

function TrackListing({ tracks }: { tracks: ParsedDDPResponse['tracks'] }) {
  if (tracks.length === 0) return null;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center gap-2">
          <Music2 className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">Track Listing</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="rounded-md border border-border">
          {tracks.map((track, idx) => (
            <TrackItem key={track.number} track={track} isLast={idx === tracks.length - 1} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MusicBrainz Card
// ============================================================================

function MusicBrainzCard({ result, isLoading }: { 
  result?: MusicBrainzLookupResult | null; 
  isLoading?: boolean;
}) {
  const [imageError, setImageError] = React.useState(false);

  if (isLoading) {
    return (
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-16 w-16 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!result) return null;

  if (!result.success || result.releases.length === 0) {
    return (
      <Card className="border-border bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="p-2 rounded-lg bg-muted">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">No MusicBrainz match</p>
              <p className="text-xs">This release isn't in the database yet.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const release = result.releases[0];
  const artists = release.artistCredit?.map(a => a.name).join(', ') || 'Unknown Artist';
  const labelInfo = release.labelInfo?.[0];
  const coverArtUrl = `https://coverartarchive.org/release/${release.id}/front-250`;

  return (
    <Card className="border-border overflow-hidden">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">MusicBrainz</CardTitle>
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs ml-auto",
              result.source === 'discid' && "bg-green-500/10 text-green-600 border-green-500/20"
            )}
          >
            {result.source === 'discid' ? (
              <><CheckCircle2 className="h-3 w-3 mr-1" />Disc ID</>
            ) : (
              `via ${result.source}`
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="flex gap-4">
          <div className="shrink-0">
            {!imageError ? (
              <div className="relative w-16 h-16 rounded-md overflow-hidden bg-muted">
                <Image
                  src={coverArtUrl}
                  alt={release.title}
                  fill
                  className="object-cover"
                  onError={() => setImageError(true)}
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center">
                <Disc3 className="h-8 w-8 text-muted-foreground/50" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <h3 className="text-sm font-semibold text-foreground truncate">{release.title}</h3>
              <p className="text-xs text-muted-foreground truncate">{artists}</p>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {release.date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {release.date.substring(0, 4)}
                </span>
              )}
              {release.country && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {release.country}
                </span>
              )}
              {labelInfo?.label?.name && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {labelInfo.label.name}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-border">
          <a
            href={`https://musicbrainz.org/release/${release.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            View on MusicBrainz
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function DDPDisplay({
  ddp,
  musicBrainz,
  isLoadingMusicBrainz,
  className,
  onDismiss,
}: DDPDisplayProps) {
  const coverArtUrl = musicBrainz?.releases?.[0]?.id 
    ? `https://coverartarchive.org/release/${musicBrainz.releases[0].id}/front-250`
    : null;

  return (
    <div className={cn('space-y-4', className)}>
      <AlbumHeader ddp={ddp} coverArtUrl={coverArtUrl} onDismiss={onDismiss} />
      <Separator className="bg-border" />
      <TrackListing tracks={ddp.tracks} />
      <MusicBrainzCard result={musicBrainz} isLoading={isLoadingMusicBrainz} />
    </div>
  );
}

export default DDPDisplay;
