"use client";

/**
 * MusicBrainz Enhanced Panel
 * 
 * Beautiful SSR-ready display panel for MusicBrainz metadata.
 * Features:
 * - Cover art from Cover Art Archive
 * - Pre-cached data for instant display
 * - "Would you like more information?" prompt
 * - Clean tabular + prose layout following MAC Design System
 */

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Disc3,
  Calendar,
  MapPin,
  Building2,
  Hash,
  ExternalLink,
  Music,
  Clock,
  Barcode,
  Tag,
  Users,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import type { MusicBrainzLookupResult, MusicBrainzRelease } from '@/services/musicBrainz';
import { formatDuration, getArtistNames } from '@/services/musicBrainz';

// ============================================================================
// Types
// ============================================================================

interface MusicBrainzEnhancedPanelProps {
  result: MusicBrainzLookupResult;
  coverArtUrl?: string | null;
  onRequestMoreInfo?: () => void;
  isExpanded?: boolean;
  className?: string;
}

interface PromptCardProps {
  albumTitle: string;
  artistName: string;
  onRequestMoreInfo: () => void;
  isLoading?: boolean;
}

// ============================================================================
// Cover Art Archive URL Builder
// ============================================================================

export function getCoverArtUrl(releaseId: string, size: 'small' | 'large' | '250' | '500' | '1200' = '500'): string {
  // Cover Art Archive: https://coverartarchive.org/
  return `https://coverartarchive.org/release/${releaseId}/front-${size}`;
}

// ============================================================================
// Prompt Card - "Would you like more information?"
// ============================================================================

export function MusicBrainzPromptCard({
  albumTitle,
  artistName,
  onRequestMoreInfo,
  isLoading = false,
}: PromptCardProps) {
  return (
    <Card className="mac-card border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 shrink-0">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">
              We found additional information about this title
            </p>
            <p className="font-medium text-foreground truncate">
              {albumTitle} <span className="text-muted-foreground font-normal">by</span> {artistName}
            </p>
          </div>
          <Button
            onClick={onRequestMoreInfo}
            disabled={isLoading}
            className="shrink-0 gap-2"
          >
            {isLoading ? (
              <>Loading...</>
            ) : (
              <>
                Show Details
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
// Main Enhanced Panel
// ============================================================================

export function MusicBrainzEnhancedPanel({
  result,
  coverArtUrl,
  onRequestMoreInfo,
  isExpanded = true,
  className,
}: MusicBrainzEnhancedPanelProps) {
  const [imageError, setImageError] = React.useState(false);
  
  if (!result.success || result.releases.length === 0) {
    return null;
  }

  const release = result.releases[0];
  const artistNames = getArtistNames(release.artistCredit);
  const labelInfo = release.labelInfo?.[0];
  const media = release.media?.[0];
  
  // Build cover art URL if not provided
  const artUrl = coverArtUrl || getCoverArtUrl(release.id);

  // If not expanded, show prompt card
  if (!isExpanded && onRequestMoreInfo) {
    return (
      <MusicBrainzPromptCard
        albumTitle={release.title}
        artistName={artistNames}
        onRequestMoreInfo={onRequestMoreInfo}
      />
    );
  }

  return (
    <Card className={cn("mac-card overflow-hidden", className)}>
      {/* Header with Cover Art */}
      <div className="flex gap-6 p-6 bg-gradient-to-br from-muted/50 to-transparent">
        {/* Cover Art */}
        <div className="shrink-0">
          {!imageError ? (
            <div className="relative w-32 h-32 rounded-lg overflow-hidden shadow-lg bg-muted">
              <Image
                src={artUrl}
                alt={`${release.title} cover art`}
                fill
                className="object-cover"
                onError={() => setImageError(true)}
                unoptimized // External URL
              />
            </div>
          ) : (
            <div className="w-32 h-32 rounded-lg bg-muted flex items-center justify-center">
              <Disc3 className="h-12 w-12 text-muted-foreground/50" />
            </div>
          )}
        </div>

        {/* Album Info */}
        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {result.source === 'discid' && (
                <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">
                  Disc ID Match
                </Badge>
              )}
              {release.releaseGroup?.primaryType && (
                <Badge variant="outline" className="text-xs">
                  {release.releaseGroup.primaryType}
                </Badge>
              )}
            </div>
            <h2 className="text-xl font-semibold text-foreground truncate">
              {release.title}
            </h2>
            <p className="text-muted-foreground">{artistNames}</p>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {release.date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {release.date}
              </span>
            )}
            {release.country && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {release.country}
              </span>
            )}
            {labelInfo?.label?.name && (
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                {labelInfo.label.name}
              </span>
            )}
            {media?.trackCount && (
              <span className="flex items-center gap-1">
                <Music className="h-3.5 w-3.5" />
                {media.trackCount} tracks
              </span>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Details Section */}
      <CardContent className="p-6 space-y-6">
        {/* Metadata Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {labelInfo?.catalogNumber && (
            <MetadataItem
              icon={Hash}
              label="Catalog #"
              value={labelInfo.catalogNumber}
              mono
            />
          )}
          {release.barcode && (
            <MetadataItem
              icon={Barcode}
              label="Barcode"
              value={release.barcode}
              mono
            />
          )}
          {release.status && (
            <MetadataItem
              icon={Tag}
              label="Status"
              value={release.status}
            />
          )}
          {media?.format && (
            <MetadataItem
              icon={Disc3}
              label="Format"
              value={media.format}
            />
          )}
        </div>

        {/* Track Listing */}
        {media?.tracks && media.tracks.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Music className="h-4 w-4 text-muted-foreground" />
              Track Listing
            </h3>
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="w-12 text-center">#</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="w-24 text-right">Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {media.tracks.map((track) => (
                    <TableRow key={track.position} className="border-border">
                      <TableCell className="text-center font-mono text-muted-foreground text-sm">
                        {track.number}
                      </TableCell>
                      <TableCell className="font-medium">
                        {track.title}
                        {track.recording?.artistCredit && 
                         track.recording.artistCredit.length > 0 &&
                         getArtistNames(track.recording.artistCredit) !== artistNames && (
                          <span className="text-muted-foreground font-normal ml-2">
                            — {getArtistNames(track.recording.artistCredit)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground">
                        {track.length ? formatDuration(track.length) : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Credits & Notes (Prose) */}
        {release.releaseGroup && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">About This Release</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This is {release.releaseGroup.primaryType === 'Album' ? 'an album' : `a ${release.releaseGroup.primaryType?.toLowerCase()}`} by {artistNames}
              {release.date && `, released ${formatReleaseDate(release.date)}`}
              {labelInfo?.label?.name && ` on ${labelInfo.label.name}`}
              {release.country && ` in ${getCountryName(release.country)}`}.
              {release.releaseGroup.secondaryTypes && release.releaseGroup.secondaryTypes.length > 0 && (
                <> This release is categorized as {release.releaseGroup.secondaryTypes.join(', ').toLowerCase()}.</>
              )}
            </p>
          </div>
        )}

        {/* External Link */}
        <div className="pt-2 flex items-center justify-between">
          <a
            href={`https://musicbrainz.org/release/${release.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            View full details on MusicBrainz
          </a>
          
          {result.discId && (
            <span className="text-xs text-muted-foreground font-mono">
              Disc ID: {result.discId}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Helper Components
// ============================================================================

function MetadataItem({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className={cn("text-sm text-foreground", mono && "font-mono")}>
        {value}
      </p>
    </div>
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

function formatReleaseDate(date: string): string {
  // Date can be YYYY, YYYY-MM, or YYYY-MM-DD
  const parts = date.split('-');
  if (parts.length === 1) return parts[0];
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const year = parts[0];
  const month = months[parseInt(parts[1], 10) - 1];
  
  if (parts.length === 2) return `${month} ${year}`;
  
  const day = parseInt(parts[2], 10);
  return `${month} ${day}, ${year}`;
}

function getCountryName(code: string): string {
  // Common country codes
  const countries: Record<string, string> = {
    US: 'the United States',
    GB: 'the United Kingdom',
    UK: 'the United Kingdom',
    DE: 'Germany',
    FR: 'France',
    JP: 'Japan',
    CA: 'Canada',
    AU: 'Australia',
    XW: 'Worldwide',
    XE: 'Europe',
  };
  return countries[code] || code;
}

export default MusicBrainzEnhancedPanel;
