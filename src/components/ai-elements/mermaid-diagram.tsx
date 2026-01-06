"use client";

import { useEffect, useRef, useState, useId, useCallback } from "react";
import { cn } from "../../lib/utils";
import {
  AlertCircle,
  Sparkles,
  Loader2,
  ZoomIn,
  ZoomOut,
  Download,
  X,
  RefreshCw,
} from "lucide-react";
import { Button } from "../ui/button";
import DOMPurify from "dompurify";

interface ProDiagramState {
  status: "idle" | "generating" | "ready" | "error";
  imageBase64?: string;
  imageMimeType?: string;
  error?: string;
}

interface MermaidDiagramProps {
  code: string;
  className?: string;
  onUpgrade?: (code: string) => void;
  /** If true, the component will handle Nano Banana Pro upgrade internally */
  enableProUpgrade?: boolean;
}

// Dark theme matching MAC Design System
const MERMAID_CONFIG = {
  theme: "dark" as const,
  themeVariables: {
    // Primary colors - teal accent
    primaryColor: "#26c6da",
    primaryTextColor: "#f5f5f5",
    primaryBorderColor: "rgba(255,255,255,0.12)",

    // Line and relationship colors - purple
    lineColor: "#26c6da",

    // Background colors - dark surfaces
    secondaryColor: "#1e1e2e",
    tertiaryColor: "#0d0d0d",
    background: "#0a0a0a",
    mainBkg: "#1e1e2e",

    // Node styling
    nodeBorder: "rgba(255,255,255,0.12)",
    clusterBkg: "#1a1a2e",
    clusterBorder: "rgba(255,255,255,0.08)",

    // Text colors
    titleColor: "#f5f5f5",
    textColor: "#e5e5e5",

    // Edge labels
    edgeLabelBackground: "#1e1e2e",

    // Sequence diagram specific
    actorTextColor: "#f5f5f5",
    actorBkg: "#1e1e2e",
    actorBorder: "#26c6da",
    signalColor: "#26c6da",
    signalTextColor: "#f5f5f5",

    // Flowchart specific
    nodeTextColor: "#f5f5f5",

    // State diagram
    labelColor: "#f5f5f5",

    // Git graph
    git0: "#26c6da",
    git1: "#26c6da",
    git2: "#22d3ee",
    git3: "#facc15",
    gitBranchLabel0: "#f5f5f5",
    gitBranchLabel1: "#f5f5f5",
    gitBranchLabel2: "#f5f5f5",
    gitBranchLabel3: "#f5f5f5",
  },
  flowchart: {
    curve: "basis",
    padding: 20,
    nodeSpacing: 50,
    rankSpacing: 50,
    htmlLabels: true,
  },
  sequence: {
    diagramMarginX: 50,
    diagramMarginY: 10,
    actorMargin: 50,
    boxMargin: 10,
    boxTextMargin: 5,
    noteMargin: 10,
    messageMargin: 35,
    mirrorActors: true,
  },
  startOnLoad: false,
  securityLevel: "loose" as const,
};

// Configure DOMPurify to allow SVG elements
const DOMPURIFY_CONFIG = {
  USE_PROFILES: { svg: true, svgFilters: true },
  ADD_TAGS: ["foreignObject"],
  ADD_ATTR: ["target", "xlink:href", "requiredExtensions"],
};

/**
 * Safely set sanitized SVG content to a container element
 * Uses DOMPurify to sanitize and DOM APIs to insert
 */
function setSanitizedSvgContent(container: HTMLElement, svgContent: string): void {
  // First, sanitize the SVG content with DOMPurify
  const sanitized = DOMPurify.sanitize(svgContent, DOMPURIFY_CONFIG);

  // Clear existing content
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  // Parse sanitized SVG using DOMParser (safe after sanitization)
  const parser = new DOMParser();
  const doc = parser.parseFromString(sanitized, "image/svg+xml");
  const svgElement = doc.documentElement;

  // Check for parse errors
  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    console.error("[MermaidDiagram] SVG parse error:", parseError.textContent);
    return;
  }

  // Import and append the sanitized SVG node
  const importedNode = document.importNode(svgElement, true);
  container.appendChild(importedNode);
}

/**
 * MermaidDiagram - Renders mermaid syntax as SVG with MAC Design System dark theme
 *
 * Features:
 * - Dynamic import to reduce bundle size
 * - Error boundary with fallback to raw code
 * - Dark theme matching MAC Design System
 * - DOMPurify sanitization for XSS protection
 * - Optional "Improve this diagram" upgrade button with Nano Banana Pro integration
 */
export function MermaidDiagram({
  code,
  className,
  onUpgrade,
  enableProUpgrade = true,
}: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [proDiagram, setProDiagram] = useState<ProDiagramState>({ status: "idle" });
  const [zoom, setZoom] = useState(1);
  const [mermaidRendered, setMermaidRendered] = useState(false);
  const [showProPanel, setShowProPanel] = useState(false); // User clicked to view enhanced diagram
  const backgroundGenerationStarted = useRef(false);
  const uniqueId = useId().replace(/:/g, "-");

  useEffect(() => {
    let isMounted = true;

    async function renderDiagram() {
      if (!code.trim() || !containerRef.current) {
        setIsLoading(false);
        return;
      }

      try {
        // Dynamic import to keep bundle size small
        const mermaid = (await import("mermaid")).default;

        // Initialize with dark theme config
        mermaid.initialize(MERMAID_CONFIG);

        // Render the diagram
        const { svg: renderedSvg } = await mermaid.render(
          `mermaid-${uniqueId}`,
          code.trim()
        );

        if (isMounted && containerRef.current) {
          // Safely set sanitized SVG content
          setSanitizedSvgContent(containerRef.current, renderedSvg);
          setError(null);
          setIsLoading(false);
          setMermaidRendered(true);
        }
      } catch (err) {
        console.error("[MermaidDiagram] Render error:", err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to render diagram");
          setIsLoading(false);
        }
      }
    }

    renderDiagram();

    return () => {
      isMounted = false;
    };
  }, [code, uniqueId]);

  // Generate pro diagram using Nano Banana Pro API
  const generateProDiagramInternal = useCallback(async () => {
    if (proDiagram.status === "generating" || proDiagram.status === "ready") {
      return; // Already generating or ready
    }
    setProDiagram({ status: "generating" });

    try {
      const diagramType = detectDiagramType(code);
      const response = await fetch("/api/diagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "Create a polished, professional version of this diagram",
          context: code,
          type: diagramType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate diagram");
      }

      const result = await response.json();

      if (result.success && result.image) {
        setProDiagram({
          status: "ready",
          imageBase64: result.image.base64,
          imageMimeType: result.image.mimeType,
        });
      } else {
        throw new Error("No image in response");
      }
    } catch (err) {
      console.error("[MermaidDiagram] Pro upgrade error:", err);
      setProDiagram({
        status: "error",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }, [code, proDiagram.status]);

  // Background generation: Start generating pro diagram as soon as mermaid renders
  useEffect(() => {
    if (
      mermaidRendered &&
      enableProUpgrade &&
      !onUpgrade && // Only if using internal handler
      !backgroundGenerationStarted.current &&
      proDiagram.status === "idle"
    ) {
      backgroundGenerationStarted.current = true;
      // Start background generation silently
      generateProDiagramInternal();
    }
  }, [mermaidRendered, enableProUpgrade, onUpgrade, proDiagram.status, generateProDiagramInternal]);

  const handleUpgrade = () => {
    if (onUpgrade) {
      // External handler provided
      onUpgrade(code);
    } else if (enableProUpgrade) {
      // Show the panel - it will display generating/ready status
      setShowProPanel(true);
      // If somehow idle (background gen failed to start), start it now
      if (proDiagram.status === "idle") {
        generateProDiagramInternal();
      }
    }
  };

  // Download the pro diagram
  const downloadDiagram = useCallback(() => {
    if (proDiagram.imageBase64 && proDiagram.imageMimeType) {
      const link = document.createElement("a");
      link.href = `data:${proDiagram.imageMimeType};base64,${proDiagram.imageBase64}`;
      link.download = `diagram-pro-${Date.now()}.png`;
      link.click();
    }
  }, [proDiagram]);

  // Zoom controls
  const zoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const closeProPanel = () => setShowProPanel(false);

  // Loading state
  if (isLoading) {
    return (
      <div
        className={cn(
          "flex items-center justify-center p-8",
          "rounded-lg border border-border bg-[#0a0a0a]",
          className
        )}
      >
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Rendering diagram...</span>
      </div>
    );
  }

  // Error state - show raw code as fallback
  if (error) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center gap-2 text-sm text-amber-400">
          <AlertCircle className="h-4 w-4" />
          <span>Could not render diagram</span>
        </div>
        <pre className="overflow-x-auto rounded-lg border border-border bg-[#0a0a0a] p-4 text-sm">
          <code className="text-muted-foreground">{code}</code>
        </pre>
      </div>
    );
  }

  // Success - render SVG via ref (content set safely in useEffect)
  return (
    <div className={cn("space-y-3", className)}>
      {/* Mermaid diagram container - content set via sanitized DOM manipulation in useEffect */}
      <div
        ref={containerRef}
        className={cn(
          "overflow-x-auto rounded-lg border border-border",
          "bg-[#0a0a0a] p-4",
          "[&_svg]:max-w-full [&_svg]:h-auto"
        )}
      />

      {/* Upgrade button - shows status of background generation, hidden when panel is open */}
      {(onUpgrade || enableProUpgrade) && !showProPanel && proDiagram.status !== "error" && (
        <button
          onClick={handleUpgrade}
          disabled={proDiagram.status === "generating"}
          className={cn("mac-button",
            "flex items-center gap-1.5 text-xs italic",
            "text-muted-foreground hover:text-foreground",
            "transition-colors",
            proDiagram.status === "generating" ? "cursor-wait opacity-70" : "cursor-pointer"
          )}
        >
          {proDiagram.status === "idle" && (
            <>
              <Sparkles className="h-3 w-3" />
              <span>Improve this diagram</span>
            </>
          )}
          {proDiagram.status === "generating" && (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Preparing enhanced version...</span>
            </>
          )}
          {proDiagram.status === "ready" && (
            <>
              <Sparkles className="h-3 w-3 text-primary" />
              <span className="text-primary">View enhanced diagram</span>
            </>
          )}
        </button>
      )}

      {/* Pro Diagram Panel - only shows when user clicks to view */}
      {showProPanel && (
        <div
          className={cn(
            "overflow-hidden rounded-lg border transition-all duration-500 ease-out",
            "border-primary-500/30 bg-[#1e1e2e]"
          )}
        >
          {/* Header with controls */}
          <div className="flex items-center justify-between p-3 border-b border-primary-500/20">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary-400" />
              <span className="text-sm font-normal text-primary-300">
                Nano Banana Pro Diagram
              </span>
            </div>
            <div className="flex items-center gap-1">
              {proDiagram.status === "ready" && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={zoomOut}
                    className="mac-button h-7 w-7"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground min-w-[3rem] text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={zoomIn}
                    className="mac-button h-7 w-7"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={downloadDiagram}
                    className="mac-button h-7 w-7"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={closeProPanel}
                className="mac-button h-7 w-7"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 min-h-[200px] flex items-center justify-center">
            {proDiagram.status === "generating" && (
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
                <p className="text-sm">Generating professional diagram...</p>
              </div>
            )}

            {proDiagram.status === "error" && (
              <div className="flex flex-col items-center gap-3 text-red-400">
                <AlertCircle className="h-6 w-6" />
                <p className="text-sm">Failed to generate diagram</p>
                <p className="text-xs text-muted-foreground">{proDiagram.error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setProDiagram({ status: "idle" });
                    backgroundGenerationStarted.current = false;
                    generateProDiagramInternal();
                  }}
                  className="mac-button gap-1.5"
                >
                  <RefreshCw className="h-3 w-3" />
                  Try Again
                </Button>
              </div>
            )}

            {proDiagram.status === "ready" && proDiagram.imageBase64 && (
              <div
                className="overflow-auto max-w-full max-h-[500px]"
                style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
              >
                <img
                  src={`data:${proDiagram.imageMimeType};base64,${proDiagram.imageBase64}`}
                  alt="Professional diagram"
                  className="max-w-full h-auto rounded"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Detect diagram type from mermaid code for better Nano Banana Pro prompts
 */
export function detectDiagramType(code: string): "workflow" | "explainer" {
  const lowerCode = code.toLowerCase();

  if (lowerCode.includes("sequencediagram")) return "workflow";
  if (lowerCode.includes("flowchart")) return "workflow";
  if (lowerCode.includes("graph td") || lowerCode.includes("graph tb")) return "workflow";
  if (lowerCode.includes("graph lr") || lowerCode.includes("graph rl")) return "workflow";
  if (lowerCode.includes("statediagram")) return "workflow";
  if (lowerCode.includes("gantt")) return "workflow";

  // Default to explainer for class diagrams, ER diagrams, etc.
  return "explainer";
}

export default MermaidDiagram;
