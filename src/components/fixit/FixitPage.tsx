/**
 * Fixit Page - Main Layout
 *
 * Split-pane layout combining:
 * - Left: FixitChatPanel (programmer-focused chat)
 * - Right: CodeArtifactPanel (Claude-style code artifacts)
 *
 * This provides a Claude-like experience for debugging and understanding codebases.
 */

"use client";

import React, { useState, useCallback } from "react";
import { cn } from "../../lib/utils";
import { FixitChatPanel } from "./FixitChatPanel";
import { CodeArtifactPanel, CodeArtifact } from "./CodeArtifactPanel";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "../ui/resizable";

interface FixitPageProps {
  className?: string;
  initialQuestion?: string;
}

export function FixitPage({ className, initialQuestion }: FixitPageProps) {
  const [artifacts, setArtifacts] = useState<CodeArtifact[]>([]);
  const [isArtifactExpanded, setIsArtifactExpanded] = useState(false);

  // Handle new artifacts generated from chat
  const handleArtifactGenerated = useCallback((artifact: CodeArtifact) => {
    setArtifacts((prev) => {
      // Check if artifact with same ID exists
      const existing = prev.findIndex((a) => a.id === artifact.id);
      if (existing >= 0) {
        // Update existing
        const updated = [...prev];
        updated[existing] = artifact;
        return updated;
      }
      // Add new artifact to the beginning
      return [artifact, ...prev];
    });
  }, []);

  // Handle artifact close
  const handleArtifactClose = useCallback((artifactId: string) => {
    setArtifacts((prev) => prev.filter((a) => a.id !== artifactId));
  }, []);

  // Handle open in editor (future feature)
  const handleOpenInEditor = useCallback((artifact: CodeArtifact) => {
    // TODO: Implement VS Code deep link or similar
    console.log("Open in editor:", artifact.filePath);
    if (artifact.filePath) {
      // For now, just log - could implement vscode:// protocol handler
      navigator.clipboard.writeText(artifact.filePath);
    }
  }, []);

  // Toggle artifact panel expansion
  const handleToggleExpand = useCallback(() => {
    setIsArtifactExpanded((prev) => !prev);
  }, []);

  return (
    <div className={cn("h-full w-full", className)}>
      <ResizablePanelGroup
        orientation="horizontal"
        className="h-full"
      >
        {/* Chat Panel - Left Side */}
        <ResizablePanel
          defaultSize={artifacts.length > 0 ? 50 : 100}
          minSize={30}
          maxSize={artifacts.length > 0 ? 70 : 100}
          className="p-3"
        >
          <FixitChatPanel
            onArtifactGenerated={handleArtifactGenerated}
            initialQuestion={initialQuestion}
            className="h-full"
          />
        </ResizablePanel>

        {/* Resizable Handle - Only show when artifacts exist */}
        {artifacts.length > 0 && (
          <>
            <ResizableHandle withHandle className="mx-1" />

            {/* Artifact Panel - Right Side */}
            <ResizablePanel
              defaultSize={50}
              minSize={isArtifactExpanded ? 60 : 30}
              maxSize={70}
              className="p-3"
            >
              <CodeArtifactPanel
                artifacts={artifacts}
                onClose={handleArtifactClose}
                onOpenInEditor={handleOpenInEditor}
                isExpanded={isArtifactExpanded}
                onToggleExpand={handleToggleExpand}
                className="h-full"
              />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}

export default FixitPage;
