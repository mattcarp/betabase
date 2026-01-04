"use client";

/**
 * DDP Display Component
 *
 * Displays parsed DDP (Disc Description Protocol) data in beautiful shadcn tables.
 * Shows album info, track listing, file components, and MusicBrainz metadata.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Disc3, Music2, FileText, Database, Loader2, AlertCircle, X } from 'lucide-react';
import type { ParsedDDP, DDPTrack } from '@/types/ddp';
import type { MusicBrainzLookupResult, MusicBrainzRelease } from '@/services/musicBrainz';

// ============================================================================
// Types
// ============================================================================

interface DDPDisplayProps {
  ddp: ParsedDDP;
  musicBrainz?: MusicBrainzLookupResult | null;
  isLoadingMusicBrainz?: boolean;
  className?: string;
  onDismiss?: () => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(duration?: string): string {
  if (!duration) return '-';
  // Duration is in mm:ss:ff format, convert to mm:ss
  const parts = duration.split(':');
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`;
  }
  return duration;
}

function formatPreGap(frames?: number): string {
  if (!frames) return '-';
  const seconds = frames / 75;
  return `${seconds.toFixed(2)}s`;
}

// ============================================================================
// Album Header
// ============================================================================

function AlbumHeader({ ddp }: { ddp: ParsedDDP }) {
  const { summary, id } = ddp;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Disc3 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            {summary.albumTitle || 'Untitled Album'}
          </h2>
          {summary.performer && (
            <p className="text-muted-foreground">{summary.performer}</p>
          )}
        </div>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">
        This DDP (Disc Description Protocol) master contains{' '}
        <span className="font-medium text-foreground">{summary.trackCount} tracks</span>
        {summary.totalDuration && (
          <>
            {' '}with a total duration of{' '}
            <span className="font-medium text-foreground">{formatDuration(summary.totalDuration)}</span>
          </>
        )}
        .{' '}
        {summary.hasCdText && (
          <Badge variant="secondary" className="ml-1 text-xs">CD-TEXT</Badge>
        )}{' '}
        {summary.hasPq && (
          <Badge variant="secondary" className="ml-1 text-xs">PQ Subcode</Badge>
        )}
      </p>

      {(summary.upc || id?.mid) && (
        <div className="flex flex-wrap gap-4 text-sm">
          {summary.upc && (
            <div>
              <span className="text-muted-foreground">UPC: </span>
              <span className="font-mono text-foreground">{summary.upc}</span>
            </div>
          )}
          {id?.mid && (
            <div>
              <span className="text-muted-foreground">Master ID: </span>
              <span className="font-mono text-foreground">{id.mid}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Track Listing
// ============================================================================

function TrackListing({ tracks }: { tracks: DDPTrack[] }) {
  if (tracks.length === 0) return null;

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Music2 className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Track Listing</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="w-12">#</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Performer</TableHead>
                <TableHead className="w-24 text-right">Duration</TableHead>
                <TableHead className="w-32">ISRC</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tracks.map((track) => (
                <TableRow key={track.number} className="border-border">
                  <TableCell className="font-mono text-muted-foreground">
                    {track.number.toString().padStart(2, '0')}
                  </TableCell>
                  <TableCell className="font-medium">
                    {track.title || <span className="text-muted-foreground italic">Untitled</span>}
                  </TableCell>
                  <TableCell>
                    {track.performer || <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatDuration(track.duration)}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {track.isrc || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// DDP Files Table
// ============================================================================

function DDPFilesTable({ files }: { files: ParsedDDP['summary']['files'] }) {
  if (files.length === 0) return null;

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">DDP Files</CardTitle>
        </div>
        <CardDescription>Components of this DDP master</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Filename</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Size</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file, idx) => (
                <TableRow key={idx} className="border-border">
                  <TableCell className="font-mono">{file.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {file.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">
                    {formatBytes(file.size)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MusicBrainz Results
// ============================================================================

function MusicBrainzResults({
  result,
  isLoading,
}: {
  result?: MusicBrainzLookupResult;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">From MusicBrainz</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Looking up metadata...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!result) return null;

  if (!result.success || result.releases.length === 0) {
    return (
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">From MusicBrainz</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>No data available from MusicBrainz</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const release = result.releases[0];
  const artists = release.artistCredit?.map(a => a.name).join(', ') || 'Unknown Artist';

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">From MusicBrainz</CardTitle>
          <Badge variant="secondary" className="text-xs ml-auto">
            via {result.source}
          </Badge>
        </div>
        <CardDescription>
          Additional metadata from the MusicBrainz database
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* Release Info */}
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold">{release.title}</span>
            {release.date && (
              <span className="text-muted-foreground">({release.date.substring(0, 4)})</span>
            )}
          </div>
          <p className="text-muted-foreground">{artists}</p>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {release.country && (
            <div>
              <span className="text-muted-foreground">Country: </span>
              <span>{release.country}</span>
            </div>
          )}
          {release.status && (
            <div>
              <span className="text-muted-foreground">Status: </span>
              <span>{release.status}</span>
            </div>
          )}
          {release.barcode && (
            <div>
              <span className="text-muted-foreground">Barcode: </span>
              <span className="font-mono">{release.barcode}</span>
            </div>
          )}
          {release.releaseGroup?.primaryType && (
            <div>
              <span className="text-muted-foreground">Type: </span>
              <span>{release.releaseGroup.primaryType}</span>
            </div>
          )}
          {release.labelInfo?.[0]?.label?.name && (
            <div className="col-span-2">
              <span className="text-muted-foreground">Label: </span>
              <span>{release.labelInfo[0].label.name}</span>
              {release.labelInfo[0].catalogNumber && (
                <span className="ml-2 font-mono text-muted-foreground">
                  ({release.labelInfo[0].catalogNumber})
                </span>
              )}
            </div>
          )}
        </div>

        {/* MusicBrainz Link */}
        <div className="pt-2">
          <a
            href={`https://musicbrainz.org/release/${release.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline"
          >
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
  return (
    <div className={cn('space-y-6', className)}>
      {/* Album Header with dismiss button */}
      <div className="flex items-start justify-between gap-4">
        <AlbumHeader ddp={ddp} />
        {onDismiss && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={onDismiss}
            title="Dismiss"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Separator className="bg-border" />

      {/* Track Listing */}
      <TrackListing tracks={ddp.tracks} />

      {/* DDP Files */}
      <DDPFilesTable files={ddp.summary.files} />

      {/* MusicBrainz Results */}
      <MusicBrainzResults result={musicBrainz} isLoading={isLoadingMusicBrainz} />
    </div>
  );
}

export default DDPDisplay;
