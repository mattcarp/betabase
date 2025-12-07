"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mermaid from "mermaid";
import { cn } from "../../lib/utils";
import { Loader2, ZoomIn, ZoomOut, Maximize, Download, Copy, Check, Wand2 } from "lucide-react";
import {
  TransformWrapper,
  TransformComponent,
  ReactZoomPanPinchContentRef,
} from "react-zoom-pan-pinch";
import { toPng } from "html-to-image";
import { Button } from "../ui/button";
import { toast } from "sonner";

interface MermaidDiagramProps {
  code: string;
  className?: string;
}

export function MermaidDiagram({ code, className }: MermaidDiagramProps) {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const transformComponentRef = useRef<ReactZoomPanPinchContentRef>(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    // Initialize mermaid with "Groovy" theme settings
    mermaid.initialize({
      startOnLoad: false,
      theme: "base",
      securityLevel: "loose",
      fontFamily: "Inter, sans-serif",
      themeVariables: {
        primaryColor: "#FACC15", // Nano Banana Yellow
        primaryTextColor: "#FFFFFF", // White for readability
        primaryBorderColor: "#EAB308", // Darker Yellow
        lineColor: "#E2E8F0", // Bright Slate for visibility
        secondaryColor: "#A855F7", // Purple for contrast
        tertiaryColor: "#22D3EE", // Cyan for accents
        mainBkg: "#1e1e2e", // Dark Surface
        nodeBorder: "#FACC15",
        clusterBkg: "#2d2b42",
        clusterBorder: "#A855F7",
        defaultLinkColor: "#E2E8F0",
        titleColor: "#FACC15",
        edgeLabelBackground: "#1e1e2e",
        actorBorder: "#FACC15",
        actorBkg: "#1e1e2e",
        actorTextColor: "#FFFFFF",
        actorLineColor: "#E2E8F0",
        signalColor: "#E2E8F0",
        signalTextColor: "#FFFFFF",
        labelBoxBkgColor: "#1e1e2e",
        labelBoxBorderColor: "#FACC15",
        labelTextColor: "#FFFFFF",
        loopTextColor: "#FFFFFF",
        noteBorderColor: "#A855F7",
        noteBkgColor: "#1e1e2e",
        noteTextColor: "#FFFFFF",
        activationBorderColor: "#FACC15",
        activationBkgColor: "#1e1e2e",
        sequenceNumberColor: "#FFFFFF",
        git0: "#FACC15",
        git1: "#A855F7",
        git2: "#22D3EE",
        git3: "#F472B6",
        git4: "#3b82f6",
        git5: "#6366f1",
        git6: "#FACC15",
        git7: "#A855F7",
      },
    });
  }, []);

  /**
   * Pre-validates and sanitizes Mermaid code before rendering.
   * Fixes common AI-generated syntax errors.
   */
  const sanitizeMermaidCode = (rawCode: string): string => {
    let sanitized = rawCode;

    // Fix truncated hex colors (e.g., #005* -> #005588)
    // Common pattern: AI cuts off hex values mid-stream
    sanitized = sanitized.replace(/#([0-9a-fA-F]{3})(\*|[\s;,\)])/g, "#$1$1$2");
    sanitized = sanitized.replace(/#([0-9a-fA-F]{1,5})\*/g, (match, hex) => {
      // Pad truncated hex to 6 characters
      const padded = hex.padEnd(6, hex.charAt(hex.length - 1));
      return `#${padded}`;
    });

    // Fix unclosed double-circle parentheses (e.g., ((Success -> ((Success)))
    // The AI often forgets to close double-parens for circle nodes
    sanitized = sanitized.replace(/\(\(([^)]+)\s*$/gm, "(($1))");
    sanitized = sanitized.replace(/\(\(([^)]+)\*/g, "(($1))");
    // Fix single-paren closures on double-paren opens
    sanitized = sanitized.replace(/\(\(([^)]+)\)(?!\))/g, "(($1))");

    // Fix incomplete node shapes
    sanitized = sanitized.replace(/\[([^\]]+)\*/g, "[$1]");
    sanitized = sanitized.replace(/\{([^}]+)\*/g, "{$1}");

    // Remove trailing asterisks that shouldn't be there
    sanitized = sanitized.replace(/\*\s*$/gm, "");
    sanitized = sanitized.replace(/\*\s*;/g, ";");

    // Fix missing semicolons at end of style definitions
    sanitized = sanitized.replace(/(stroke-width:\d+px)\s*\n/g, "$1;\n");

    // Quote node labels that contain special characters
    // Mermaid needs quotes around labels with spaces/special chars in certain contexts
    // Fix: ID((Label with spaces)) -> ID(("Label with spaces"))
    sanitized = sanitized.replace(/\(\(([^")(]+\s[^")(]+)\)\)/g, '(("$1"))');

    // Fix node labels in brackets that have special chars (but aren't already quoted)
    // e.g., [Create DSCM Ticket] -> ["Create DSCM Ticket"]
    sanitized = sanitized.replace(/\[([^"\]]+\s[^"\]]+)\](?!:)/g, '["$1"]');

    return sanitized;
  };

  useEffect(() => {
    const renderDiagram = async () => {
      if (!code) return;

      console.log("🧜 MermaidDiagram: Starting render for code:", code.substring(0, 50) + "...");
      setIsLoading(true);
      setError("");

      try {
        // Generate a unique ID for this diagram
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

        // Sanitize the code to fix common AI-generated errors
        const sanitizedCode = sanitizeMermaidCode(code);
        if (sanitizedCode !== code) {
          console.log("🧜 MermaidDiagram: Code was sanitized to fix syntax errors");
        }

        // Attempt to render
        console.log("🧜 MermaidDiagram: Calling mermaid.render");
        const { svg } = await mermaid.render(id, sanitizedCode);
        console.log("🧜 MermaidDiagram: Render successful, SVG length:", svg.length);
        setSvg(svg);
      } catch (err) {
        console.error("🧜 MermaidDiagram: Render error:", err);
        setError("Failed to render diagram. The AI may have generated invalid syntax.");
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce rendering slightly to avoid flickering during typing
    const timeoutId = setTimeout(renderDiagram, 200);
    return () => clearTimeout(timeoutId);
  }, [code]);

  const handleDownload = useCallback(async () => {
    if (containerRef.current) {
      try {
        // Find the SVG element
        const svgElement = containerRef.current.querySelector("svg");
        if (!svgElement) return;

        // Create a temporary container for the export to ensure clean background
        const exportContainer = document.createElement("div");
        exportContainer.innerHTML = svgElement.outerHTML;
        exportContainer.style.padding = "20px";
        exportContainer.style.background = "#1e1e2e"; // Dark background
        exportContainer.style.borderRadius = "12px";
        document.body.appendChild(exportContainer);

        const dataUrl = await toPng(exportContainer, { quality: 1.0, pixelRatio: 2 });

        document.body.removeChild(exportContainer);

        const link = document.createElement("a");
        link.download = `mermaid-diagram-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
        toast.success("Diagram downloaded successfully");
      } catch (err) {
        console.error("Download failed:", err);
        toast.error("Failed to download diagram");
      }
    }
  }, []);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      toast.success("Mermaid code copied to clipboard");
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("Failed to copy code to clipboard");
    }
  };

  if (error) {
    return (
      <div
        className={cn(
          "my-4 p-4 border border-red-500/30 rounded-lg bg-red-500/10 text-red-400 text-sm font-mono",
          className
        )}
      >
        <div className="mb-2 font-semibold flex items-center gap-2">⚠️ Diagram Error</div>
        <div className="opacity-90">{error}</div>
        <pre className="mt-3 p-2 bg-black/20 rounded text-xs overflow-x-auto text-muted-foreground">
          {code}
        </pre>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group relative my-6 overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-slate-900 to-slate-950 shadow-xl transition-all",
        "hover:border-purple-500/30 hover:shadow-purple-500/10",
        className
      )}
    >
      {/* Toolbar */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 bg-black/40 backdrop-blur-sm p-1 rounded-lg border border-white/10">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-white/10"
          onClick={() => transformComponentRef.current?.zoomIn()}
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-white/10"
          onClick={() => transformComponentRef.current?.zoomOut()}
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-white/10"
          onClick={() => transformComponentRef.current?.resetTransform()}
          title="Reset View"
        >
          <Maximize className="h-4 w-4" />
        </Button>
        <div className="w-px h-4 bg-white/20 mx-1" />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-white/10"
          onClick={handleCopyCode}
          title="Copy Code"
        >
          {isCopied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-white/10"
          onClick={handleDownload}
          title="Download PNG"
        >
          <Download className="h-4 w-4" />
        </Button>
        <div className="w-px h-4 bg-white/20 mx-1" />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-white/10"
          onClick={() => {
            toast.promise(new Promise((resolve) => setTimeout(resolve, 1500)), {
              loading: "Refining diagram with AI...",
              success: "Diagram refined! (Demo)",
              error: "Failed to refine",
            });
          }}
          title="Refine with AI"
        >
          <Wand2 className="h-4 w-4 text-purple-400" />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2 text-purple-500" />
          <span className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
            Rendering groovy diagram...
          </span>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="w-full h-full min-h-[300px] flex items-center justify-center bg-[#1e1e2e]/50"
        >
          <style jsx global>{`
            .mermaid-svg-container svg {
              max-width: 100% !important;
              height: auto !important;
            }
            /* Animated Edges for Groovy Theme */
            .mermaid-svg-container .edgePaths path {
              stroke-dasharray: 10;
              animation: flow 20s linear infinite;
            }
            @keyframes flow {
              to {
                stroke-dashoffset: -1000;
              }
            }
            /* Glow effect for nodes */
            .mermaid-svg-container .nodes rect,
            .mermaid-svg-container .nodes circle,
            .mermaid-svg-container .nodes polygon {
              filter: drop-shadow(0 0 8px rgba(139, 92, 246, 0.3));
              transition: all 0.3s ease;
            }
            .mermaid-svg-container .nodes g:hover rect,
            .mermaid-svg-container .nodes g:hover circle,
            .mermaid-svg-container .nodes g:hover polygon {
              filter: drop-shadow(0 0 12px rgba(139, 92, 246, 0.6));
              stroke-width: 3px !important;
            }
          `}</style>
          <TransformWrapper
            ref={transformComponentRef}
            initialScale={1}
            minScale={0.5}
            maxScale={4}
            centerOnInit
            limitToBounds={false}
            wheel={{ step: 0.1 }}
          >
            <TransformComponent
              wrapperClass="!w-full !h-full min-h-[300px] cursor-grab active:cursor-grabbing"
              contentClass="!w-full !h-full flex items-center justify-center"
            >
              <div
                className="mermaid-svg-container p-8"
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            </TransformComponent>
          </TransformWrapper>
        </div>
      )}
    </div>
  );
}
