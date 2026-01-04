"use client";

import { cn } from "../../../lib/utils";
import { Badge } from "../../ui/badge";
import { FileText, ExternalLink, Database, BookOpen } from "lucide-react";

interface Source {
  title?: string;
  url?: string;
  type?: string;
  score?: number;
  snippet?: string;
}

interface SourceCardProps {
  sources: Source[];
  isStreaming?: boolean;
  className?: string;
}

/**
 * Prominent source attribution cards that appear while AI responds
 * Shows sources being used in real-time during response generation
 */
export function SourceCard({ sources, isStreaming, className }: SourceCardProps) {
  if (!sources || sources.length === 0) return null;

  const getSourceIcon = (type?: string) => {
    switch (type?.toLowerCase()) {
      case "documentation":
      case "docs":
        return <BookOpen className="h-3.5 w-3.5" />;
      case "api":
      case "endpoint":
        return <Database className="h-3.5 w-3.5" />;
      default:
        return <FileText className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card/50 backdrop-blur-sm p-3",
        isStreaming && "animate-pulse",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Badge
          variant="outline"
          className="bg-blue-500/10 border-blue-500/30 text-blue-300 text-xs"
        >
          {sources.length} source{sources.length !== 1 ? "s" : ""}
        </Badge>
        {isStreaming && <span className="text-xs text-muted-foreground">Retrieving context...</span>}
      </div>

      {/* Source List */}
      <div className="space-y-2">
        {sources.slice(0, 3).map((source, idx) => (
          <div
            key={idx}
            className={cn(
              "flex items-start gap-2 p-2 rounded-md",
              "bg-muted/50 border border-border",
              "transition-all duration-200 hover:bg-muted/70"
            )}
          >
            <div className="text-muted-foreground mt-0.5">{getSourceIcon(source.type)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground truncate">
                  {source.title || `Source ${idx + 1}`}
                </span>
                {source.score && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] px-1.5 py-0",
                      source.score >= 0.8
                        ? "border-green-500/30 text-green-400"
                        : source.score >= 0.6
                          ? "border-yellow-500/30 text-yellow-400"
                          : "border-border text-muted-foreground"
                    )}
                  >
                    {Math.round(source.score * 100)}%
                  </Badge>
                )}
              </div>
              {source.snippet && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{source.snippet}</p>
              )}
              {source.url && (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  View source
                </a>
              )}
            </div>
          </div>
        ))}
        {sources.length > 3 && (
          <div className="text-xs text-muted-foreground text-center pt-1">
            +{sources.length - 3} more sources
          </div>
        )}
      </div>
    </div>
  );
}

export default SourceCard;
