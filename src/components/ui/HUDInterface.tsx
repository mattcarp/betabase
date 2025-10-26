import React, { useState, useEffect } from "react";
import { cn } from "../../lib/utils";

interface FloatingPanelProps {
  children: React.ReactNode;
  title: string;
  position: { x: number; y: number };
  onDrag?: (position: { x: number; y: number }) => void;
  className?: string;
}

const FloatingPanel: React.FC<FloatingPanelProps> = ({
  children,
  title,
  position,
  onDrag,
  className,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && onDrag) {
      onDrag({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  return (
    <div
      className={cn(
        "absolute z-10 select-none transition-all duration-300 mac-card-elevated",
        isDragging && "cursor-grabbing scale-105",
        !isDragging && "cursor-grab hover:scale-[1.02]",
        className
      )}
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {/* Drag Handle */}
      <div
        className="px-4 py-2 border-b border-mac-border cursor-grab active:cursor-grabbing bg-mac-state-hover"
        onMouseDown={handleMouseDown}
      >
        <h3 className="mac-title">
          {title}
        </h3>
      </div>

      {/* Content */}
      <div className="p-4">{children}</div>
    </div>
  );
};

interface HUDInterfaceProps {
  transcription?: string;
  insights?: string[];
  audioLevel?: number;
}

export const HUDInterface: React.FC<HUDInterfaceProps> = ({
  transcription = "Listening for audio input...",
  insights = ["AI analysis will appear here", "Real-time insights", "Contextual information"],
  audioLevel = 0,
}) => {
  const [panels, setPanels] = useState([
    {
      id: "transcription",
      title: "Live Transcription",
      position: { x: 50, y: 100 },
      content: transcription,
    },
    {
      id: "insights",
      title: "AI Insights",
      position: { x: 400, y: 200 },
      content: insights,
    },
    {
      id: "audio",
      title: "Audio Monitoring",
      position: { x: 750, y: 150 },
      content: audioLevel,
    },
  ]);

  const updatePanelPosition = (id: string, position: { x: number; y: number }) => {
    setPanels((prev) => prev.map((panel) => (panel.id === id ? { ...panel, position } : panel)));
  };

  return (
    <div className="relative w-full h-screen overflow-hidden mac-background">
      {/* MAC Floating Background Orbs */}
      <div className="mac-floating-background"></div>

      {/* Background Grid */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(51, 133, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(51, 133, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />

      {/* HUD Title */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20">
        <h1 className="mac-heading">
          SIAM HUD Interface
        </h1>
        <p className="text-center mac-body mt-2">
          Smart In A Meeting • Floating Intelligence Panels
        </p>
      </div>

      {/* Floating Panels */}
      {panels.map((panel) => (
        <FloatingPanel
          key={panel.id}
          title={panel.title}
          position={panel.position}
          onDrag={(position) => updatePanelPosition(panel.id, position)}
        >
          {panel.id === "transcription" && (
            <div className="w-80 max-h-40 overflow-y-auto">
              <p className="mac-body leading-relaxed">{panel.content}</p>
            </div>
          )}

          {panel.id === "insights" && (
            <div className="w-72">
              {(panel.content as string[]).map((insight, index) => (
                <div
                  key={index}
                  className="mb-2 p-4 rounded-lg border-l-2 border-mac-accent-purple-400 bg-mac-accent-purple-400/10"
                >
                  <p className="mac-body text-mac-text-secondary">{insight}</p>
                </div>
              ))}
            </div>
          )}

          {panel.id === "audio" && (
            <div className="w-64">
              <div className="mb-4">
                <p className="mac-body mb-2">
                  Audio Level: {Math.round((panel.content as number) * 100)}%
                </p>
                <div className="h-2 rounded-full overflow-hidden bg-mac-border">
                  <div
                    className="h-full transition-all duration-150 rounded-full"
                    style={{
                      width: `${(panel.content as number) * 100}%`,
                      background:
                        "linear-gradient(90deg, var(--mac-primary-blue-400), var(--mac-accent-purple-400))",
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded text-center bg-mac-primary-blue-400/10">
                  <p className="mac-body text-mac-text-muted">Status</p>
                  <p className="mac-body text-mac-text-primary">Active</p>
                </div>
                <div className="p-2 rounded text-center bg-mac-accent-purple-400/10">
                  <p className="mac-body text-mac-text-muted">Quality</p>
                  <p className="mac-body text-mac-text-primary">HD</p>
                </div>
              </div>
            </div>
          )}
        </FloatingPanel>
      ))}

      {/* Instructions */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <p className="mac-body text-mac-text-muted text-center">
          Drag panels to reposition • Hover for interaction • Real-time meeting intelligence
        </p>
      </div>
    </div>
  );
};
