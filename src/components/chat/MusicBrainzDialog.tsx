"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { ExternalLink, Disc3, Calendar, MapPin, Building2, Hash } from "lucide-react";

interface MusicBrainzRelease {
  id: string;
  title: string;
  artist: string;
  date: string;
  country: string;
  status: string;
  barcode: string | null;
}

interface MusicBrainzLabel {
  name: string;
  catalogNumber: string | null;
}

interface MusicBrainzReleaseGroup {
  id: string;
  title: string;
  type: string;
}

interface MusicBrainzTrack {
  number: string;
  title: string;
  duration: string | null;
}

interface MusicBrainzAlternative {
  id: string;
  title: string;
  date?: string;
  country?: string;
  score: number;
}

export interface MusicBrainzResult {
  success: boolean;
  matchScore?: number;
  release?: MusicBrainzRelease;
  label?: MusicBrainzLabel | null;
  releaseGroup?: MusicBrainzReleaseGroup | null;
  format?: string;
  trackCount?: number;
  musicbrainzUrl?: string;
  tracks?: MusicBrainzTrack[];
  alternativeReleases?: MusicBrainzAlternative[];
  error?: string;
  suggestion?: string;
}

interface MusicBrainzDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: MusicBrainzResult | null;
}

export function MusicBrainzDialog({ open, onOpenChange, data }: MusicBrainzDialogProps) {
  if (!data) return null;

  if (!data.success) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">MusicBrainz Lookup</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {data.error}
            </DialogDescription>
          </DialogHeader>
          {data.suggestion && (
            <p className="text-sm text-muted-foreground">{data.suggestion}</p>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  const { release, label, releaseGroup, tracks, musicbrainzUrl, matchScore, alternativeReleases } = data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-background border-border">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl text-foreground flex items-center gap-2">
                <Disc3 className="h-5 w-5 text-muted-foreground" />
                {release?.title}
              </DialogTitle>
              <DialogDescription className="text-base text-muted-foreground mt-1">
                {release?.artist}
              </DialogDescription>
            </div>
            {matchScore && (
              <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/20">
                {matchScore}% match
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Release Info Grid */}
        <div className="grid grid-cols-2 gap-4 py-4">
          {release?.date && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Released:</span>
              <span className="text-foreground">{release.date}</span>
            </div>
          )}
          {release?.country && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Country:</span>
              <span className="text-foreground">{release.country}</span>
            </div>
          )}
          {label?.name && (
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Label:</span>
              <span className="text-foreground">{label.name}</span>
            </div>
          )}
          {label?.catalogNumber && (
            <div className="flex items-center gap-2 text-sm">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Catalog:</span>
              <span className="text-foreground font-mono">{label.catalogNumber}</span>
            </div>
          )}
          {release?.barcode && (
            <div className="flex items-center gap-2 text-sm col-span-2">
              <span className="text-muted-foreground">Barcode:</span>
              <span className="text-foreground font-mono">{release.barcode}</span>
            </div>
          )}
        </div>

        {/* Track Listing */}
        {tracks && tracks.length > 0 && (
          <div className="space-y-2">
            <h3 className="mac-title">Track Listing</h3>
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="w-12 text-muted-foreground">#</TableHead>
                    <TableHead className="text-muted-foreground">Title</TableHead>
                    <TableHead className="w-20 text-right text-muted-foreground">Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tracks.map((track) => (
                    <TableRow key={track.number} className="border-border">
                      <TableCell className="text-muted-foreground font-mono">{track.number}</TableCell>
                      <TableCell className="text-foreground">{track.title}</TableCell>
                      <TableCell className="text-right text-muted-foreground font-mono">
                        {track.duration || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Alternative Releases */}
        {alternativeReleases && alternativeReleases.length > 0 && (
          <div className="space-y-2 pt-2">
            <h3 className="mac-title">Other Releases</h3>
            <div className="flex flex-wrap gap-2">
              {alternativeReleases.map((alt) => (
                <a
                  key={alt.id}
                  href={`https://musicbrainz.org/release/${alt.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                >
                  {alt.country && <span>{alt.country}</span>}
                  {alt.date && <span>({alt.date})</span>}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* MusicBrainz Link */}
        {musicbrainzUrl && (
          <div className="pt-4 border-t border-border">
            <a
              href={musicbrainzUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              View on MusicBrainz
            </a>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
