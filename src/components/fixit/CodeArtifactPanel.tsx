/**
 * Code Artifact Panel
 *
 * Claude-style artifact display for code snippets, files, and diagrams.
 * Part of the programmer-focused Fixit tab.
 *
 * Features:
 * - Syntax-highlighted code display using Shiki
 * - File path and line number display
 * - Copy to clipboard
 * - Mermaid diagram rendering
 * - Multiple artifact tabs
 */

"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { CodeBlock } from "../ui/code-block";
import {
  Code,
  Copy,
  Check,
  FileCode,
  GitBranch,
  ExternalLink,
  X,
  ChevronRight,
  Workflow,
  FileText,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { cn } from "../../lib/utils";

export interface CodeArtifact {
  id: string;
  type: "code" | "diagram" | "file" | "diff";
  title: string;
  language?: string;
  content: string;
  filePath?: string;
  lineStart?: number;
  lineEnd?: number;
  source?: "git" | "jira" | "knowledge" | "live";
  metadata?: {
    author?: string;
    commitHash?: string;
    jiraTicket?: string;
    lastModified?: string;
  };
}

interface CodeArtifactPanelProps {
  artifacts: CodeArtifact[];
  onClose?: (artifactId: string) => void;
  onOpenInEditor?: (artifact: CodeArtifact) => void;
  className?: string;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export function CodeArtifactPanel({
  artifacts,
  onClose,
  onOpenInEditor,
  className,
  isExpanded = false,
  onToggleExpand,
}: CodeArtifactPanelProps) {
  const [activeArtifact, setActiveArtifact] = useState<string>(
    artifacts[0]?.id || ""
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (artifact: CodeArtifact) => {
    await navigator.clipboard.writeText(artifact.content);
    setCopiedId(artifact.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getSourceIcon = (source?: string) => {
    switch (source) {
      case "git":
        return <GitBranch className="h-3 w-3" />;
      case "jira":
        return <FileText className="h-3 w-3" />;
      case "knowledge":
        return <FileCode className="h-3 w-3" />;
      default:
        return <Code className="h-3 w-3" />;
    }
  };

  const getSourceColor = (source?: string) => {
    switch (source) {
      case "git":
        return "text-orange-400 border-orange-400/30";
      case "jira":
        return "text-blue-400 border-blue-400/30";
      case "knowledge":
        return "text-green-400 border-green-400/30";
      default:
        return "text-muted-foreground border-border";
    }
  };

  if (artifacts.length === 0) {
    return (
      <Card className={cn("mac-card h-full flex flex-col bg-card/30 border-border", className)}>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm font-light">No code artifacts yet</p>
            <p className="text-xs mt-1 opacity-70">
              Ask about your codebase to see code here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentArtifact = artifacts.find((a) => a.id === activeArtifact) || artifacts[0];

  return (
    <Card className={cn("mac-card h-full flex flex-col bg-card/30 border-border", className)}>
      {/* Header with artifact tabs */}
      <CardHeader className="pb-2 pt-3 px-3 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="h-4 w-4 text-primary" />
            <span className="text-sm font-light text-foreground">Artifacts</span>
            <Badge variant="outline" className="text-xs h-5 px-1.5">
              {artifacts.length}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            {onToggleExpand && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onToggleExpand}
              >
                {isExpanded ? (
                  <Minimize2 className="h-3 w-3" />
                ) : (
                  <Maximize2 className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Artifact tabs */}
        {artifacts.length > 1 && (
          <ScrollArea className="w-full mt-2" orientation="horizontal">
            <div className="flex gap-1 pb-1">
              {artifacts.map((artifact) => (
                <button
                  key={artifact.id}
                  onClick={() => setActiveArtifact(artifact.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors whitespace-nowrap",
                    activeArtifact === artifact.id
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {artifact.type === "diagram" ? (
                    <Workflow className="h-3 w-3" />
                  ) : (
                    <FileCode className="h-3 w-3" />
                  )}
                  <span className="max-w-[120px] truncate">{artifact.title}</span>
                  {onClose && (
                    <X
                      className="h-3 w-3 opacity-50 hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClose(artifact.id);
                      }}
                    />
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardHeader>

      {/* Artifact content */}
      <CardContent className="flex-1 p-0 min-h-0 flex flex-col">
        {/* File info bar */}
        {currentArtifact.filePath && (
          <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b border-border text-xs">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn("h-5 px-1.5 gap-1", getSourceColor(currentArtifact.source))}
              >
                {getSourceIcon(currentArtifact.source)}
                {currentArtifact.source || "code"}
              </Badge>
              <code className="text-muted-foreground font-mono">
                {currentArtifact.filePath}
                {currentArtifact.lineStart && (
                  <span className="text-primary">
                    :{currentArtifact.lineStart}
                    {currentArtifact.lineEnd && `-${currentArtifact.lineEnd}`}
                  </span>
                )}
              </code>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleCopy(currentArtifact)}
              >
                {copiedId === currentArtifact.id ? (
                  <Check className="h-3 w-3 text-green-400" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
              {onOpenInEditor && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onOpenInEditor(currentArtifact)}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Metadata bar */}
        {currentArtifact.metadata && (
          <div className="flex items-center gap-3 px-3 py-1.5 bg-muted/20 border-b border-border/50 text-xs text-muted-foreground">
            {currentArtifact.metadata.author && (
              <span>By {currentArtifact.metadata.author}</span>
            )}
            {currentArtifact.metadata.commitHash && (
              <span className="font-mono">
                {currentArtifact.metadata.commitHash.slice(0, 7)}
              </span>
            )}
            {currentArtifact.metadata.jiraTicket && (
              <Badge variant="outline" className="h-4 px-1 text-blue-400 border-blue-400/30">
                {currentArtifact.metadata.jiraTicket}
              </Badge>
            )}
            {currentArtifact.metadata.lastModified && (
              <span>{currentArtifact.metadata.lastModified}</span>
            )}
          </div>
        )}

        {/* Code content */}
        <ScrollArea className="flex-1">
          <div className="p-3">
            {currentArtifact.type === "diagram" ? (
              <CodeBlock
                code={currentArtifact.content}
                language="mermaid"
                className="text-xs"
              />
            ) : (
              <CodeBlock
                code={currentArtifact.content}
                language={currentArtifact.language || "typescript"}
                showLineNumbers
                className="text-xs"
              />
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default CodeArtifactPanel;
