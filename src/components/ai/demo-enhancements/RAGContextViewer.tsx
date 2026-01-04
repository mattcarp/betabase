"use client";

import { useState } from "react";
import { cn } from "../../../lib/utils";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../ui/collapsible";
import {
  ChevronDown,
  ChevronRight,
  Database,
  Clock,
  Layers,
  Zap,
  Search,
  FileText,
} from "lucide-react";

interface RAGDocument {
  id?: string;
  title?: string;
  content?: string;
  score?: number;
  source_type?: string;
  metadata?: Record<string, any>;
}

interface RAGContextViewerProps {
  strategy?: "standard" | "context-aware" | "agentic";
  documents?: RAGDocument[];
  totalVectors?: number;
  searchTimeMs?: number;
  reranked?: boolean;
  initialDocs?: number;
  finalDocs?: number;
  agentSteps?: number;
  className?: string;
  defaultOpen?: boolean;
}

/**
 * RAG Context Viewer - lets technical folks see under the hood
 * Shows retrieval strategy, documents used, timing, and vector stats
 */
export function RAGContextViewer({
  strategy = "context-aware",
  documents = [],
  totalVectors = 45399,
  searchTimeMs,
  reranked,
  initialDocs,
  finalDocs,
  agentSteps,
  className,
  defaultOpen = false,
}: RAGContextViewerProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  const strategyConfig = {
    standard: {
      label: "Standard RAG",
      description: "Two-stage retrieval with Gemini re-ranking",
      color: "text-muted-foreground",
      bgColor: "bg-muted/10",
      borderColor: "border-border",
    },
    "context-aware": {
      label: "Context-Aware RAG",
      description: "Session history + RLHF boosts + query transformation",
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
    },
    agentic: {
      label: "Agentic RAG",
      description: "Self-correcting multi-step reasoning with confidence checks",
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/30",
    },
  };

  const config = strategyConfig[strategy];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-full justify-between px-3 py-2 h-auto",
            "bg-card/50 border border-border rounded-lg",
            "hover:bg-muted/50 transition-all duration-200",
            isOpen && "rounded-b-none border-b-0"
          )}
        >
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground">RAG Context</span>
            <Badge
              variant="outline"
              className={cn("text-xs", config.bgColor, config.borderColor, config.color)}
            >
              {config.label}
            </Badge>
          </div>
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent
        className={cn(
          "bg-card/50 border border-t-0 border-border rounded-b-lg",
          "overflow-hidden"
        )}
      >
        <div className="p-4 space-y-4">
          {/* Strategy Description */}
          <p className="text-xs text-muted-foreground">{config.description}</p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Total Vectors */}
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
              <Database className="h-4 w-4 text-emerald-400" />
              <div>
                <div className="text-xs text-muted-foreground">Vector Database</div>
                <div className="text-sm font-medium text-foreground">
                  {totalVectors.toLocaleString()} vectors
                </div>
              </div>
            </div>

            {/* Search Time */}
            {searchTimeMs !== undefined && (
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                <Clock className="h-4 w-4 text-yellow-400" />
                <div>
                  <div className="text-xs text-muted-foreground">Search Time</div>
                  <div className="text-sm font-medium text-foreground">{searchTimeMs}ms</div>
                </div>
              </div>
            )}

            {/* Re-ranking */}
            {reranked && initialDocs !== undefined && finalDocs !== undefined && (
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                <Layers className="h-4 w-4 text-blue-400" />
                <div>
                  <div className="text-xs text-muted-foreground">Re-ranked</div>
                  <div className="text-sm font-medium text-foreground">
                    {initialDocs} → {finalDocs} docs
                  </div>
                </div>
              </div>
            )}

            {/* Agent Steps (for agentic RAG) */}
            {agentSteps !== undefined && agentSteps > 0 && (
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                <Zap className="h-4 w-4 text-purple-400" />
                <div>
                  <div className="text-xs text-muted-foreground">Agent Steps</div>
                  <div className="text-sm font-medium text-foreground">
                    {agentSteps} iteration{agentSteps !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Retrieved Documents */}
          {documents.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground font-medium">
                Retrieved Documents ({documents.length})
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {documents.map((doc, idx) => (
                  <div
                    key={doc.id || idx}
                    className={cn(
                      "p-2 rounded-md cursor-pointer transition-all duration-200",
                      "bg-muted/30 hover:bg-muted/50 border border-border",
                      expandedDoc === (doc.id || String(idx)) && "bg-muted/50"
                    )}
                    onClick={() =>
                      setExpandedDoc(
                        expandedDoc === (doc.id || String(idx)) ? null : doc.id || String(idx)
                      )
                    }
                  >
                    <div className="flex items-start gap-2">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-foreground truncate">
                            {doc.title || `Document ${idx + 1}`}
                          </span>
                          {doc.score !== undefined && (
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] px-1 py-0 shrink-0",
                                doc.score >= 0.8
                                  ? "border-green-500/30 text-green-400"
                                  : doc.score >= 0.6
                                    ? "border-yellow-500/30 text-yellow-400"
                                    : "border-border text-muted-foreground"
                              )}
                            >
                              {Math.round(doc.score * 100)}%
                            </Badge>
                          )}
                        </div>
                        {expandedDoc === (doc.id || String(idx)) && doc.content && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-4">{doc.content}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default RAGContextViewer;
