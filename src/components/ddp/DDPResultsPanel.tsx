"use client";

/**
 * DDP Results Panel
 * 
 * Beautiful display panel for parsed DDP data using shadcn/ui components.
 * Features:
 * - Album header with cover art placeholder
 * - Track list with separators between items
 * - MusicBrainz integration cards
 * - Clean, professional design
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Disc3,
  Clock,
  Hash,
  Music,
  User,
  Barcode,
  FileAudio,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import type { ParsedDDP, DDPTrack } from '@/types/ddp';

// ============================================================================
// Types
// ============================================================================

interface DDPResultsPanelProps {
  data: ParsedDDP;
  onLookupMusicBrainz?: () => void;
  isLoadingMusicBrainz?: boolean;
  className?: string;
}

interface TrackListItemProps {
  track: DDPTrack;
  showSeparator?: boolean;
}

interface MetadataRowProps {
  icon: React.ReactNode;
  label: string;
  value: string | undefined;
  className?: string;
}

// ============================================================================
// Metadata Row Component
// ============================================================================

function MetadataRow({ icon, label, value, className }: MetadataRowProps) {
  if (!value) return null;
  return (
    <div className={cn("flex items-center gap-3 py-2", className)}>
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-sm text-muted-foreground min-w-[100px]">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

// ============================================================================
// Track List Item with Separator
// ============================================================================

function TrackListItem({ track, showSeparator = true }: TrackListItemProps) {
  return (
    <>
      <div className="flex items-center gap-4 py-3 px-1">
        {/* Track Number */}
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
          <span className="text-sm font-medium text-muted-foreground">
            {track.number}
          </span>
        </div>
        
        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">
            {track.title || `Track ${track.number}`}
          </p>
          {track.performer && (
            <p className="text-sm text-muted-foreground truncate">
              {track.performer}
            </p>
          )}
        </div>
        
        {/* Duration */}
        {track.duration && (
          <span className="text-sm text-muted-foreground tabular-nums shrink-0">
            {track.duration}
          </span>
        )}
        
        {/* ISRC Badge */}
        {track.isrc && (
          <Badge variant="outline" className="text-xs shrink-0 hidden sm:inline-flex">
            {track.isrc}
          </Badge>
        )}
      </div>
      {showSeparator && <Separator />}
    </>
  );
}

// ============================================================================
// Album Header
// ============================================================================

function AlbumHeader({ data }: { data: ParsedDDP }) {
  const albumTitle = data.cdText?.albumTitle || data.summary.albumTitle || 'Unknown Album';
  const artist = data.cdText?.albumPerformer || data.summary.performer || 'Unknown Artist';
  const trackCount = data.summary.trackCount;
  const duration = data.summary.totalDuration;
  
  return (
    <div className="flex gap-5">
      {/* Album Art Placeholder */}
      <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 border border-border/50">
        <Disc3 className="h-10 w-10 text-primary/50" />
      </div>
      
      {/* Album Info */}
      <div className="flex-1 min-w-0 space-y-1">
        <h2 className="text-xl font-semibold text-foreground truncate">
          {albumTitle}
        </h2>
        <p className="text-muted-foreground truncate">{artist}</p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground pt-1">
          <span className="flex items-center gap-1.5">
            <Music className="h-4 w-4" />
            {trackCount} tracks
          </span>
          {duration && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {duration}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Detection Badges
// ============================================================================

function DetectionBadges({ data }: { data: ParsedDDP }) {
  return (
    <div className="flex flex-wrap gap-2">
      {data.summary.hasCdText && (
        <Badge variant="secondary" className="gap-1.5 bg-green-500/10 text-green-600 border-green-500/20">
          <CheckCircle2 className="h-3 w-3" />
          CD-TEXT
        </Badge>
      )}
      {data.summary.hasPq && (
        <Badge variant="secondary" className="gap-1.5 bg-blue-500/10 text-blue-600 border-blue-500/20">
          <CheckCircle2 className="h-3 w-3" />
          PQ Cue
        </Badge>
      )}
      {data.id?.ddpid && (
        <Badge variant="outline" className="gap-1.5">
          <Hash className="h-3 w-3" />
          {data.id.ddpid}
        </Badge>
      )}
      {data.summary.upc && (
        <Badge variant="outline" className="gap-1.5">
          <Barcode className="h-3 w-3" />
          {data.summary.upc}
        </Badge>
      )}
    </div>
  );
}

// ============================================================================
// MusicBrainz Lookup Card
// ============================================================================

function MusicBrainzLookupCard({
  data,
  onLookup,
  isLoading,
}: {
  data: ParsedDDP;
  onLookup?: () => void;
  isLoading?: boolean;
}) {
  if (!onLookup) return null;
  
  const hasBarcode = !!data.summary.upc;
  const hasDiscId = data.pqEntries.length > 0;
  
  if (!hasBarcode && !hasDiscId) {
    return (
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
            <p className="text-sm text-muted-foreground">
              No barcode or disc ID available for MusicBrainz lookup
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              Enhance with MusicBrainz
            </p>
            <p className="text-xs text-muted-foreground">
              {hasBarcode ? `Barcode: ${data.summary.upc}` : 'Using disc ID fingerprint'}
            </p>
          </div>
          <Button
            onClick={onLookup}
            disabled={isLoading}
            size="sm"
            className="shrink-0 gap-2"
          >
            {isLoading ? (
              <>Looking up...</>
            ) : (
              <>
                Lookup
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Files Summary
// ============================================================================

function FilesSummary({ data }: { data: ParsedDDP }) {
  const ddpFiles = data.summary.files.filter(f => 
    ['Map Stream', 'Disc ID', 'PQ Descriptor', 'CD-TEXT'].includes(f.type)
  );
  
  if (ddpFiles.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">DDP Files</h4>
      <div className="space-y-0">
        {ddpFiles.map((file, index) => (
          <React.Fragment key={file.name}>
            <div className="flex items-center gap-3 py-2">
              <FileAudio className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-foreground flex-1 truncate">{file.name}</span>
              <Badge variant="secondary" className="text-xs shrink-0">
                {file.type}
              </Badge>
            </div>
            {index < ddpFiles.length - 1 && <Separator />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Main Panel
// ============================================================================

export function DDPResultsPanel({
  data,
  onLookupMusicBrainz,
  isLoadingMusicBrainz,
  className,
}: DDPResultsPanelProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="space-y-4 pb-4">
        <AlbumHeader data={data} />
        <DetectionBadges data={data} />
      </CardHeader>

      <CardContent className="space-y-6">
        {/* MusicBrainz Lookup */}
        <MusicBrainzLookupCard
          data={data}
          onLookup={onLookupMusicBrainz}
          isLoading={isLoadingMusicBrainz}
        />

        {/* Track List */}
        {data.tracks.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Tracks</h3>
            <div className="rounded-lg border bg-card">
              {data.tracks.map((track, index) => (
                <TrackListItem
                  key={track.number}
                  track={track}
                  showSeparator={index < data.tracks.length - 1}
                />
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        {(data.summary.upc || data.id?.mid) && (
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-muted-foreground">Metadata</h4>
            <div className="rounded-lg border bg-card px-4">
              <MetadataRow
                icon={<Barcode className="h-4 w-4" />}
                label="UPC/EAN"
                value={data.summary.upc}
              />
              {data.summary.upc && data.id?.mid && <Separator />}
              <MetadataRow
                icon={<Hash className="h-4 w-4" />}
                label="Master ID"
                value={data.id?.mid}
              />
            </div>
          </div>
        )}

        {/* Files */}
        <FilesSummary data={data} />
      </CardContent>
    </Card>
  );
}

export default DDPResultsPanel;
