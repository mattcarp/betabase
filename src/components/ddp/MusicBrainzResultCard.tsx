"use client";

import * as React from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { Card } from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import {
  Disc3,
  Calendar,
  MapPin,
  Building2,
  Hash,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Music,
} from "lucide-react";
import type { MusicBrainzLookupResult } from "@/services/musicBrainz";
import { formatDuration, getArtistNames } from "@/services/musicBrainz";

interface MusicBrainzResultCardProps {
  result: MusicBrainzLookupResult;
  defaultOpen?: boolean;
}

export function MusicBrainzResultCard({
  result,
  defaultOpen = false,
}: MusicBrainzResultCardProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  if (!result.success || result.releases.length === 0) {
    return (
      <Card className="p-4 bg-muted/30 border-border">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-yellow-500/10">
            <Music className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">
              MusicBrainz Lookup
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {result.error || "No matching releases found"}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const release = result.releases[0];
  const artistNames = getArtistNames(release.artistCredit);
  const labelInfo = release.labelInfo?.[0];
  const media = release.media?.[0];

  return (
    <Card className="overflow-hidden border-border bg-card">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3 text-left">
              <div className="p-2 rounded-lg bg-primary/10">
                <Disc3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  {release.title}
                  {result.source === "discid" && (
                    <Badge
                      variant="secondary"
                      className="bg-green-500/10 text-green-400 border-green-500/20 text-xs"
                    >
                      Disc ID Match
                    </Badge>
                  )}
                </h3>
                <p className="text-sm text-muted-foreground">{artistNames}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {isOpen ? "Hide details" : "Show more information"}
              </span>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t border-border p-4 space-y-4">
            {/* Release Info Grid */}
            <div className="grid grid-cols-2 gap-3">
              {release.date && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Released:</span>
                  <span className="text-foreground">{release.date}</span>
                </div>
              )}
              {release.country && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Country:</span>
                  <span className="text-foreground">{release.country}</span>
                </div>
              )}
              {labelInfo?.label?.name && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Label:</span>
                  <span className="text-foreground">{labelInfo.label.name}</span>
                </div>
              )}
              {labelInfo?.catalogNumber && (
                <div className="flex items-center gap-2 text-sm">
                  <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Catalog:</span>
                  <span className="text-foreground font-mono">
                    {labelInfo.catalogNumber}
                  </span>
                </div>
              )}
              {release.barcode && (
                <div className="flex items-center gap-2 text-sm col-span-2">
                  <span className="text-muted-foreground">Barcode:</span>
                  <span className="text-foreground font-mono">
                    {release.barcode}
                  </span>
                </div>
              )}
            </div>

            {/* Track Listing */}
            {media?.tracks && media.tracks.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">
                  Track Listing
                </h4>
                <div className="rounded-md border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="w-12 text-muted-foreground">
                          #
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Title
                        </TableHead>
                        <TableHead className="w-20 text-right text-muted-foreground">
                          Duration
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {media.tracks.map((track) => (
                        <TableRow key={track.position} className="border-border">
                          <TableCell className="text-muted-foreground font-mono">
                            {track.number}
                          </TableCell>
                          <TableCell className="text-foreground">
                            {track.title}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground font-mono">
                            {track.length
                              ? formatDuration(track.length)
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Alternative Releases */}
            {result.releases.length > 1 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">
                  Other Releases
                </h4>
                <div className="flex flex-wrap gap-2">
                  {result.releases.slice(1, 4).map((alt) => (
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
            <div className="pt-3 border-t border-border">
              <a
                href={`https://musicbrainz.org/release/${release.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                View on MusicBrainz
              </a>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
