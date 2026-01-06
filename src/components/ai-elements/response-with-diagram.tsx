"use client";

import { useState, useEffect, useCallback } from "react";
import { Response, type ResponseProps } from "./response";
import { cn } from "../../lib/utils";
import {
  ChevronDown,
  ChevronUp,
  Sparkles,
  GitBranch,
  Presentation,
  Loader2,
  Download,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "../ui/button";

type DiagramType = "explainer" | "workflow";

interface DiagramState {
  status: "idle" | "generating" | "ready" | "error";
  imageBase64?: string;
  imageMimeType?: string;
  error?: string;
}

/**
 * ResponseWithDiagram - Nano Banana Pro diagram generation
 *
 * 1. Text streams/renders immediately (non-blocking)
 * 2. Offers diagram generation after response
 * 3. User clicks to request Nano Banana Pro diagram
 * 4. Diagram generates in background, shown when ready
 * 5. Supports zoom, pan, download
 */
export function ResponseWithDiagram({ children, className, ...props }: ResponseProps) {
  const [showDiagramOffer, setShowDiagramOffer] = useState(false);
  const [showDiagram, setShowDiagram] = useState(false);
  const [diagramType, setDiagramType] = useState<DiagramType>("explainer");
  const [diagramState, setDiagramState] = useState<DiagramState>({ status: "idle" });
  const [zoom, setZoom] = useState(1);

  // Extract the text content for context
  const textContent = typeof children === "string" ? children : "";

  // Show diagram offer after a short delay (simulates reading time)
  useEffect(() => {
    if (textContent.length > 100) {
      const timer = setTimeout(() => {
        setShowDiagramOffer(true);
      }, 1500); // Give user time to start reading
      return () => clearTimeout(timer);
    }
  }, [textContent.length]);

  // Generate diagram using Nano Banana Pro API
  const generateDiagram = useCallback(
    async (type: DiagramType) => {
      setDiagramType(type);
      setDiagramState({ status: "generating" });
      setShowDiagram(true);

      try {
        const response = await fetch("/api/diagram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: `Create a ${type} diagram based on this content`,
            context: textContent.substring(0, 2000), // Limit context size
            type,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to generate diagram");
        }

        const result = await response.json();

        if (result.success && result.image) {
          setDiagramState({
            status: "ready",
            imageBase64: result.image.base64,
            imageMimeType: result.image.mimeType,
          });
        } else {
          throw new Error("No image in response");
        }
      } catch (error) {
        console.error("Diagram generation failed:", error);
        setDiagramState({
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [textContent]
  );

  // Download the diagram
  const downloadDiagram = useCallback(() => {
    if (diagramState.imageBase64 && diagramState.imageMimeType) {
      const link = document.createElement("a");
      link.href = `data:${diagramState.imageMimeType};base64,${diagramState.imageBase64}`;
      link.download = `diagram-${diagramType}-${Date.now()}.png`;
      link.click();
    }
  }, [diagramState, diagramType]);

  // Zoom controls
  const zoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Text content - always visible immediately */}
      <Response {...props}>{children}</Response>

      {/* Diagram offer - appears after reading delay */}
      {showDiagramOffer && diagramState.status === "idle" && (
        <div className="flex flex-col gap-3 animate-in fade-in duration-500">
          <p className="text-sm text-muted-foreground">Would you like me to generate a diagram?</p>
          <div className="flex gap-2">
            <Button variant="outline" className="mac-button mac-button-outline"
              size="sm"
              onClick={() => generateDiagram("explainer")}
              className={cn(
                "group flex items-center gap-2 transition-all duration-300",
                "border-amber-500/30 hover:border-amber-500/60",
                "bg-gradient-to-r from-amber-500/5 to-orange-500/5",
                "hover:from-amber-500/10 hover:to-orange-500/10"
              )}
            >
              <Presentation className="h-4 w-4 text-amber-400" />
              <span className="text-sm">Explainer</span>
            </Button>
            <Button variant="outline" className="mac-button mac-button-outline"
              size="sm"
              onClick={() => generateDiagram("workflow")}
              className={cn(
                "group flex items-center gap-2 transition-all duration-300",
                "border-blue-500/30 hover:border-blue-500/60",
                "bg-gradient-to-r from-blue-500/5 to-cyan-500/5",
                "hover:from-blue-500/10 hover:to-cyan-500/10"
              )}
            >
              <GitBranch className="h-4 w-4 text-blue-400" />
              <span className="text-sm">Workflow</span>
            </Button>
          </div>
        </div>
      )}

      {/* Diagram container */}
      {showDiagram && (
        <div
          className={cn(
            "overflow-hidden transition-all duration-500 ease-out rounded-lg border",
            "border-primary-500/30 bg-[#1e1e2e]"
          )}
        >
          {/* Diagram header with controls */}
          <div className="flex items-center justify-between p-3 border-b border-primary-500/20">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary-400" />
              <span className="text-sm font-normal text-primary-300">Nano Banana Pro Diagram</span>
              <span
                className={cn(
                  "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full",
                  diagramType === "workflow"
                    ? "bg-blue-500/20 text-blue-400"
                    : "bg-amber-500/20 text-amber-400"
                )}
              >
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
            </div>
            <div className="flex items-center gap-1">
              {diagramState.status === "ready" && (
                <>
                  <Button variant="ghost" size="icon" onClick={zoomOut} className="mac-button h-7 w-7">
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground min-w-[3rem] text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <Button variant="ghost" size="icon" onClick={zoomIn} className="mac-button h-7 w-7">
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={downloadDiagram} className="mac-button h-7 w-7">
                    <Download className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button variant="ghost" className="mac-button mac-button-outline"
                size="icon"
                onClick={() => setShowDiagram(false)}
                className="h-7 w-7"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Diagram content */}
          <div className="p-4 min-h-[300px] flex items-center justify-center">
            {diagramState.status === "generating" && (
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
                <p className="text-sm">Generating diagram with Nano Banana Pro...</p>
              </div>
            )}

            {diagramState.status === "error" && (
              <div className="flex flex-col items-center gap-3 text-red-400">
                <p className="text-sm">Failed to generate diagram</p>
                <p className="text-xs text-muted-foreground">{diagramState.error}</p>
                <Button
                  className="mac-button mac-button-outline"
                  variant="outline"
                  size="sm"
                  onClick={() => generateDiagram(diagramType)}
                >
                  Try Again
                </Button>
              </div>
            )}

            {diagramState.status === "ready" && diagramState.imageBase64 && (
              <div
                className="overflow-auto max-w-full max-h-[600px] cursor-grab active:cursor-grabbing"
                style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
              >
                <img
                  src={`data:${diagramState.imageMimeType};base64,${diagramState.imageBase64}`}
                  alt={`${diagramType} diagram`}
                  className="max-w-full h-auto rounded"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Collapsed diagram indicator */}
      {!showDiagram && diagramState.status === "ready" && (
        <Button variant="outline" className="mac-button mac-button-outline"
          size="sm"
          onClick={() => setShowDiagram(true)}
          className={cn(
            "group flex items-center gap-2 self-start transition-all duration-300",
            "border-primary-500/30 hover:border-primary-500/60",
            "bg-gradient-to-r from-primary-500/5 to-pink-500/5",
            "hover:from-primary-500/10 hover:to-pink-500/10"
          )}
        >
          <Sparkles className="h-4 w-4 text-primary-400 group-hover:animate-pulse" />
          <span className="text-sm">Show diagram</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      )}
    </div>
  );
}

/**
 * DiagramStyleGuide - Aesthetic standards for SIAM diagrams
 *
 * Using Nano Banana Pro (Gemini 3 Pro Image):
 * - Studio-quality image generation
 * - Accurate text rendering
 * - Web search grounding for factual accuracy
 * - High-resolution output (1K, 2K, 4K)
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
 * - Primary: Yellow (#FACC15) - Nano Banana Yellow, attention, highlights
 * - Secondary: Teal (#26c6da) - connections, relationships
 * - Tertiary: Cyan (#22D3EE) - accents, secondary paths
 * - Text: White (#FFFFFF) for maximum contrast
 */
export const DIAGRAM_STYLE_GUIDE = {
  model: "gemini-3-pro-image-preview", // Nano Banana Pro
  colors: {
    primary: "#FACC15", // Nano Banana Yellow
    secondary: "#26c6da", // Teal
    tertiary: "#22D3EE", // Cyan
    background: "#1e1e2e", // Dark Surface
    text: "#FFFFFF", // White
    muted: "#E2E8F0", // Slate
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
  features: {
    zoomPan: true, // Interactive zoom and pan
    download: true, // Export as image
    highRes: true, // 1K, 2K, 4K output
    textAccuracy: true, // Nano Banana Pro accurate text rendering
  },
} as const;
