"use client";

import React from "react";
import { Session } from "@/types/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Play,
  Edit,
  Trash2,
  Share2,
  Download,
  Clock,
  MousePointerClick,
  User,
  Calendar,
} from "lucide-react";
import { formatDuration, formatRelativeTime } from "@/lib/mockSessions";

interface SessionCardProps {
  session: Session;
  onPlay: (session: Session) => void;
  onRename: (session: Session) => void;
  onDelete: (session: Session) => void;
  onShare: (session: Session) => void;
  onExport: (session: Session) => void;
}

const getStatusBadgeVariant = (status: Session["status"]) => {
  switch (status) {
    case "completed":
      return "default";
    case "in-progress":
      return "secondary";
    case "has-issues":
      return "destructive";
    default:
      return "outline";
  }
};

const getStatusLabel = (status: Session["status"]) => {
  switch (status) {
    case "completed":
      return "Completed";
    case "in-progress":
      return "In Progress";
    case "has-issues":
      return "Has Issues";
    default:
      return status;
  }
};

export function SessionCard({
  session,
  onPlay,
  onRename,
  onDelete,
  onShare,
  onExport,
}: SessionCardProps) {
  return (
    <Card cclassName="mac-card group hover:cursor-pointer transition-all duration-300">
      <CardHeader>
        <div cclassName="flex items-start justify-between gap-4">
          <div cclassName="flex-1 min-w-0">
            <CardTitle cclassName="mac-title text-base font-light truncate">
              {session.name}
            </CardTitle>
            <CardDescription cclassName="mac-body text-sm mt-1 flex items-center gap-1">
              <span cclassName="truncate">{session.aut}</span>
            </CardDescription>
          </div>
          <div cclassName="flex items-center gap-2">
            <Badge variant={getStatusBadgeVariant(session.status)}>
              {getStatusLabel(session.status)}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  cclassName="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical cclassName="h-4 w-4" />
                  <span cclassName="sr-only">Session actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" cclassName="bg-[rgba(20,20,20,0.95)] border-white/10">
                <DropdownMenuItem onClick={() => onPlay(session)} cclassName="gap-2">
                  <Play cclassName="h-4 w-4" />
                  Open Playback
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onRename(session)} cclassName="gap-2">
                  <Edit cclassName="h-4 w-4" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuSeparator cclassName="bg-white/10" />
                <DropdownMenuItem onClick={() => onShare(session)} cclassName="gap-2">
                  <Share2 cclassName="h-4 w-4" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport(session)} cclassName="gap-2">
                  <Download cclassName="h-4 w-4" />
                  Export
                </DropdownMenuItem>
                <DropdownMenuSeparator cclassName="bg-white/10" />
                <DropdownMenuItem
                  onClick={() => onDelete(session)}
                  cclassName="gap-2 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                >
                  <Trash2 cclassName="h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent cclassName="space-y-4" onClick={() => onPlay(session)}>
        {/* Thumbnail Placeholder */}
        <div cclassName="aspect-video bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 rounded-lg border border-white/10 flex items-center justify-center group-hover:border-purple-500/30 transition-colors">
          <Play cclassName="h-12 w-12 text-white/20 group-hover:text-purple-400/50 transition-colors" />
        </div>

        {/* Session Metadata */}
        <div cclassName="grid grid-cols-2 gap-3 text-sm">
          <div cclassName="flex items-center gap-2 text-zinc-400">
            <Clock cclassName="h-4 w-4" />
            <span>{formatDuration(session.duration)}</span>
          </div>
          <div cclassName="flex items-center gap-2 text-zinc-400">
            <MousePointerClick cclassName="h-4 w-4" />
            <span>{session.interactionCount} interactions</span>
          </div>
          <div cclassName="flex items-center gap-2 text-zinc-400">
            <User cclassName="h-4 w-4" />
            <span cclassName="truncate">{session.testerName}</span>
          </div>
          <div cclassName="flex items-center gap-2 text-zinc-400">
            <Calendar cclassName="h-4 w-4" />
            <span>{formatRelativeTime(session.date)}</span>
          </div>
        </div>

        {/* Notes (if any) */}
        {session.notes && (
          <p cclassName="text-xs text-zinc-500 line-clamp-2 italic">{session.notes}</p>
        )}

        {/* Tags */}
        {session.tags && session.tags.length > 0 && (
          <div cclassName="flex flex-wrap gap-1.5">
            {session.tags.map((tag: string) => (
              <Badge key={tag} variant="outline" cclassName="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
