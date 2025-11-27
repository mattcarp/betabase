"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Response, type ResponseProps } from "./response";
import { MermaidDiagram } from "./mermaid-diagram";
import { cn } from "../../lib/utils";
import { ChevronDown, ChevronUp, Sparkles, GitBranch, Presentation } from "lucide-react";
import { Button } from "../ui/button";

interface DiagramInfo {
  code: string;
  type: "explainer" | "workflow";
}

/**
 * ResponseWithDiagram - Implements buffered diagram pattern
 *
 * 1. Text streams/renders immediately (non-blocking)
 * 2. Mermaid diagrams are extracted and pre-rendered in background
 * 3. User sees "Diagram available" button when ready
 * 4. Click to reveal already-rendered diagram (instant)
 * 5. Navigate away = diagram discarded (no waste)
 */
export function ResponseWithDiagram({
  children,
  className,
  ...props
}: ResponseProps) {
  const [showDiagram, setShowDiagram] = useState(false);
  const [diagramReady, setDiagramReady] = useState(false);

  // Extract mermaid code blocks from the response
  const { textContent, diagrams } = useMemo(() => {
    if (typeof children !== "string") {
      return { textContent: children, diagrams: [] as DiagramInfo[] };
    }

    const mermaidRegex = /```mermaid\n([\s\S]*?)```/g;
    const diagrams: DiagramInfo[] = [];
    let match;

    while ((match = mermaidRegex.exec(children)) !== null) {
      const code = match[1].trim();
      // Detect diagram type based on content
      const isWorkflow =
        code.includes("flowchart") ||
        code.includes("graph") ||
        code.includes("sequenceDiagram") ||
        code.includes("-->") ||
        code.includes("->>");

      diagrams.push({
        code,
        type: isWorkflow ? "workflow" : "explainer",
      });
    }

    // Remove mermaid blocks from text content
    const textContent = children.replace(mermaidRegex, "").trim();

    return { textContent, diagrams };
  }, [children]);

  // Mark diagram as ready after a short delay (simulates background render)
  useEffect(() => {
    if (diagrams.length > 0) {
      const timer = setTimeout(() => {
        setDiagramReady(true);
      }, 500); // Small delay to ensure text is visible first
      return () => clearTimeout(timer);
    }
  }, [diagrams.length]);

  const toggleDiagram = useCallback(() => {
    setShowDiagram(prev => !prev);
  }, []);

  const hasDiagrams = diagrams.length > 0;
  const diagramType = diagrams[0]?.type || "explainer";

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Text content - always visible immediately */}
      <Response {...props}>{textContent}</Response>

      {/* Diagram offer button - appears when diagram is ready */}
      {hasDiagrams && diagramReady && (
        <div className="flex flex-col gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleDiagram}
            className={cn(
              "group flex items-center gap-2 self-start transition-all duration-300",
              "border-purple-500/30 hover:border-purple-500/60",
              "bg-gradient-to-r from-purple-500/5 to-pink-500/5",
              "hover:from-purple-500/10 hover:to-pink-500/10",
              showDiagram && "border-purple-500/60 from-purple-500/10 to-pink-500/10"
            )}
          >
            <Sparkles className="h-4 w-4 text-purple-400 group-hover:animate-pulse" />
            <span className="text-sm">
              {showDiagram ? "Hide diagram" : "View diagram"}
            </span>
            <span className={cn(
              "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full",
              diagramType === "workflow"
                ? "bg-blue-500/20 text-blue-400"
                : "bg-amber-500/20 text-amber-400"
            )}>
              {diagramType === "workflow" ? (
                <>
                  <GitBranch className="h-3 w-3" />
                  Workflow
                </>
              ) : (
                <>
                  <Presentation className="h-3 w-3" />
                  Explainer
                </>
              )}
            </span>
            {showDiagram ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>

          {/* Diagram container - pre-rendered, shown on demand */}
          <div
            className={cn(
              "overflow-hidden transition-all duration-500 ease-out",
              showDiagram
                ? "max-h-[800px] opacity-100"
                : "max-h-0 opacity-0"
            )}
          >
            {diagrams.map((diagram, index) => (
              <MermaidDiagram
                key={index}
                code={diagram.code}
                className={cn(
                  "transform transition-transform duration-300",
                  showDiagram ? "translate-y-0" : "-translate-y-4"
                )}
              />
            ))}
          </div>

          {/* Hidden pre-render container - renders diagram immediately but invisibly */}
          {!showDiagram && (
            <div className="hidden" aria-hidden="true">
              {diagrams.map((diagram, index) => (
                <MermaidDiagram key={`prerender-${index}`} code={diagram.code} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * DiagramStyleGuide - Aesthetic standards for SIAM diagrams
 *
 * EXPLAINER DIAGRAMS:
 * - Purpose: Visualize concepts, architectures, relationships
 * - Style: Clean, minimal, focus on clarity
 * - Colors: Soft gradients, muted tones
 * - Layout: Centered, balanced, spacious
 *
 * WORKFLOW DIAGRAMS:
 * - Purpose: Show step-by-step processes, decision trees
 * - Style: Linear flow, clear progression
 * - Colors: Distinct stages, action-oriented
 * - Layout: Left-to-right or top-to-bottom flow
 *
 * COMMON ELEMENTS:
 * - Background: Dark (#1e1e2e) for reduced eye strain
 * - Primary: Yellow (#FACC15) - attention, highlights
 * - Secondary: Purple (#A855F7) - connections, relationships
 * - Tertiary: Cyan (#22D3EE) - accents, secondary paths
 * - Text: White (#FFFFFF) for maximum contrast
 * - Animations: Subtle flow animation on edges
 * - Interactivity: Zoom, pan, download, copy code
 */
export const DIAGRAM_STYLE_GUIDE = {
  colors: {
    primary: "#FACC15",      // Nano Banana Yellow
    secondary: "#A855F7",    // Purple
    tertiary: "#22D3EE",     // Cyan
    background: "#1e1e2e",   // Dark Surface
    text: "#FFFFFF",         // White
    muted: "#E2E8F0",        // Slate
  },
  types: {
    explainer: {
      description: "Conceptual visualization - architectures, relationships, mental models",
      icon: "Presentation",
      accent: "amber",
    },
    workflow: {
      description: "Process flow - step-by-step, decision trees, state machines",
      icon: "GitBranch",
      accent: "blue",
    },
  },
  animations: {
    edgeFlow: true,          // Animated dashed lines
    nodeGlow: true,          // Hover glow effect
    revealTransition: 500,   // ms for diagram reveal
  },
} as const;
