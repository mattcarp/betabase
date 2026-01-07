"use client";

/**
 * MusicBrainz Results Card
 * 
 * Beautiful inline display of MusicBrainz release data.
 * Shows cover art, release info, and track list in a clean card format.
 * Designed to be embedded directly in the conversation flow.
 */

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
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
  Globe,
  User,
  CheckCircle2,
} from 'lucide-react';
import type { MusicBrainzRelease, MusicBrainzLookupResult } from '@/services/musicBrainz';

// ============================================================================
// Types
// ============================================================================

interface MusicBrainzResultsCardProps {
  result: MusicBrainzLookupResult;
  showTracks?: boolean;
  className?: string;
}

interface ReleaseCardProps {
  release: MusicBrainzRelease;
  isTopMatch?: boolean;
  showTracks?: boolean;
}

// ============================================================================
// Cover Art Archive URL Builder
// ============================================================================

function getCoverArtUrl(releaseId: string, size: '250' | '500' | '1200' = '500'): string {
  return `https://coverartarchive.org/release/${releaseId}/front-${size}`;
}

// ============================================================================
// Format Helpers
// ============================================================================

function getArtistNames(artistCredit?: MusicBrainzRelease['artistCredit']): string {
  if (!artistCredit || artistCredit.length === 0) return 'Unknown Artist';
  return artistCredit.map(ac => ac.artist?.name || ac.name).join(', ');
}

function formatDuration(ms?: number): string {
  if (!ms) return '';
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  // Handle YYYY, YYYY-MM, or YYYY-MM-DD
  const parts = dateStr.split('-');
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
  }
  return new Date(dateStr).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

// ============================================================================
// Metadata Item
// ============================================================================

function MetadataItem({ 
  icon, 
  label, 
  value 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value?: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

// ============================================================================
// Single Release Card
// ============================================================================

function ReleaseCard({ release, isTopMatch, showTracks = true }: ReleaseCardProps) {
  const [imageError, setImageError] = React.useState(false);
  const artistNames = getArtistNames(release.artistCredit);
  const coverArtUrl = getCoverArtUrl(release.id);
  const labelInfo = release.labelInfo?.[0];
  const media = release.media?.[0];
  const tracks = media?.tracks || [];

  return (
    <Card className="overflow-hidden">
      {/* Header with Cover Art */}
      <CardHeader className="p-0">
        <div className="flex gap-4 p-4 bg-gradient-to-br from-muted/50 to-transparent">
          {/* Cover Art */}
          <div className="shrink-0">
            {!imageError ? (
              <div className="relative w-24 h-24 rounded-lg overflow-hidden shadow-md bg-muted">
                <Image
                  src={coverArtUrl}
                  alt={`${release.title} cover`}
                  fill
                  className="object-cover"
                  onError={() => setImageError(true)}
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center">
                <Disc3 className="h-10 w-10 text-muted-foreground/50" />
              </div>
            )}
          </div>

          {/* Release Info */}
          <div className="flex-1 min-w-0 space-y-2">
            <div>
              {isTopMatch && (
                <Badge variant="secondary" className="mb-1.5 gap-1 bg-green-500/10 text-green-600 border-green-500/20 text-xs">
                  <CheckCircle2 className="h-3 w-3" />
                  Best Match
                </Badge>
              )}
              <h3 className="text-lg font-semibold text-foreground truncate">
                {release.title}
              </h3>
              <p className="text-muted-foreground truncate">{artistNames}</p>
            </div>
            
            {/* Quick Stats */}
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              {release.date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(release.date)}
                </span>
              )}
              {media?.trackCount && (
                <span className="flex items-center gap-1">
                  <Music className="h-3.5 w-3.5" />
                  {media.trackCount} tracks
                </span>
              )}
              {release.country && (
                <span className="flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5" />
                  {release.country}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <MetadataItem 
            icon={<Building2 className="h-4 w-4" />} 
            label="Label" 
            value={labelInfo?.label?.name} 
          />
          <MetadataItem 
            icon={<Hash className="h-4 w-4" />} 
            label="Catalog" 
            value={labelInfo?.catalogNumber} 
          />
          <MetadataItem 
            icon={<Barcode className="h-4 w-4" />} 
            label="Barcode" 
            value={release.barcode} 
          />
          <MetadataItem 
            icon={<Disc3 className="h-4 w-4" />} 
            label="Format" 
            value={media?.format} 
          />
        </div>

        {/* Track List */}
        {showTracks && tracks.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Music className="h-4 w-4" />
              Track Listing
            </h4>
            <div className="rounded-lg border bg-card">
              {tracks.slice(0, 10).map((track, index) => (
                <React.Fragment key={track.id || index}>
                  <div className="flex items-center gap-3 py-2.5 px-3">
                    <span className="w-6 text-sm text-muted-foreground text-right tabular-nums">
                      {track.position || index + 1}
                    </span>
                    <span className="flex-1 text-sm truncate">{track.title}</span>
                    {track.length && (
                      <span className="text-sm text-muted-foreground tabular-nums">
                        {formatDuration(track.length)}
                      </span>
                    )}
                  </div>
                  {index < Math.min(tracks.length - 1, 9) && <Separator />}
                </React.Fragment>
              ))}
              {tracks.length > 10 && (
                <div className="py-2 px-3 text-sm text-muted-foreground text-center border-t">
                  + {tracks.length - 10} more tracks
                </div>
              )}
            </div>
          </div>
        )}

        {/* External Link */}
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2"
            asChild
          >
            <a
              href={`https://musicbrainz.org/release/${release.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on MusicBrainz
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================

export function MusicBrainzResultsSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-0">
        <div className="flex gap-4 p-4 bg-gradient-to-br from-muted/50 to-transparent">
          <Skeleton className="w-24 h-24 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Results Card
// ============================================================================

export function MusicBrainzResultsCard({
  result,
  showTracks = true,
  className,
}: MusicBrainzResultsCardProps) {
  if (!result.success || result.releases.length === 0) {
    return (
      <Card className={cn("border-amber-500/20 bg-amber-500/5", className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-amber-600">
            <Disc3 className="h-5 w-5" />
            <p className="text-sm">
              No matching releases found in MusicBrainz
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show best match prominently
  const topRelease = result.releases[0];
  const otherReleases = result.releases.slice(1, 3); // Show up to 2 alternatives

  return (
    <div className={cn("space-y-4", className)}>
      {/* Match Type Badge */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="gap-1.5">
          <CheckCircle2 className="h-3 w-3" />
          {result.source === 'discid' ? 'Disc ID Match' : 'Barcode Match'}
        </Badge>
        <span className="text-sm text-muted-foreground">
          {result.releases.length} release{result.releases.length !== 1 ? 's' : ''} found
        </span>
      </div>

      {/* Top Match */}
      <ReleaseCard 
        release={topRelease} 
        isTopMatch={result.releases.length > 1}
        showTracks={showTracks}
      />

      {/* Alternative Releases */}
      {otherReleases.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Other Releases
          </h4>
          {otherReleases.map(release => (
            <Card key={release.id} className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded bg-muted flex items-center justify-center shrink-0">
                  <Disc3 className="h-5 w-5 text-muted-foreground/50" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{release.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {getArtistNames(release.artistCredit)}
                    {release.date && ` • ${formatDate(release.date)}`}
                    {release.country && ` • ${release.country}`}
                  </p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <a
                    href={`https://musicbrainz.org/release/${release.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default MusicBrainzResultsCard;
