import React, { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "../../lib/utils";
import { useHUDShortcuts } from "../../hooks/useHUDShortcuts";
import HUDCustomizationPanel, { GlassmorphismSettings } from "./HUDCustomizationPanel";
import AudioSourceSelector, { AudioSource } from "./AudioSourceSelector";
import HUDHelpOverlay from "./HUDHelpOverlay";

interface FloatingPanelProps {
  id: string;
  children: React.ReactNode;
  title: string;
  position: { x: number; y: number };
  onDrag?: (position: { x: number; y: number }) => void;
  onFocus?: () => void;
  isFocused?: boolean;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  className?: string;
  settings: GlassmorphismSettings;
}

const FloatingPanel: React.FC<FloatingPanelProps> = ({
  id,
  children,
  title,
  position,
  onDrag,
  onFocus,
  isFocused,
  isMinimized,
  onToggleMinimize,
  className,
  settings,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
    onFocus?.();
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging && onDrag) {
        onDrag({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    },
    [isDragging, dragStart, onDrag]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Apply custom glassmorphism settings
  const panelStyle = {
    left: position.x,
    top: position.y,
    backdropFilter: `blur(${settings.blur}px)`,
    WebkitBackdropFilter: `blur(${settings.blur}px)`,
    backgroundColor: `rgba(255, 255, 255, ${settings.opacity})`,
    borderColor: `rgba(255, 255, 255, ${settings.borderOpacity})`,
    transition: isDragging
      ? "none"
      : settings.animationSpeed === "fast"
        ? "all 150ms ease"
        : settings.animationSpeed === "slow"
          ? "all 500ms ease"
          : "all 300ms ease",
  };

  return (
    <div
      ref={panelRef}
      id={id}
      className={cn(
        "absolute z-10 select-none mac-card-elevated",
        isDragging && "cursor-grabbing scale-105 dragging-panel",
        !isDragging && "cursor-grab hover:scale-[1.02]",
        isFocused && "ring-2 ring-jarvis-cyan ring-offset-2 ring-offset-transparent",
        isMinimized && "h-auto",
        settings.highContrast && "border-2 border-white",
        className
      )}
      style={panelStyle}
      role="region"
      aria-label={`${title} panel`}
      aria-expanded={!isMinimized}
      tabIndex={0}
      onFocus={onFocus}
    >
      {/* Drag Handle */}
      <div
        className="px-4 py-2 border-b border-mac-border cursor-grab active:cursor-grabbing bg-mac-state-hover flex items-center justify-between"
        onMouseDown={handleMouseDown}
      >
        <h3 c className="mac-title" lassName="mac-title text-mac-text-primary">
          {title}
        </h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleMinimize?.();
          }}
          className="hud-icon-button"
          aria-label={isMinimized ? "Maximize panel" : "Minimize panel"}
          aria-expanded={!isMinimized}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMinimized ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 15l7-7 7 7"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Content */}
      {!isMinimized && <div className="p-4">{children}</div>}
    </div>
  );
};

interface EnhancedHUDInterfaceProps {
  transcription?: string;
  insights?: string[];
  audioLevel?: number;
  onAudioSourceChange?: (sourceId: string) => void;
}

export const EnhancedHUDInterface: React.FC<EnhancedHUDInterfaceProps> = ({
  transcription = "Listening for audio input...",
  insights = ["AI analysis will appear here", "Real-time insights", "Contextual information"],
  audioLevel = 0,
  onAudioSourceChange,
}) => {
  // Panel state
  const [panels, setPanels] = useState([
    {
      id: "panel-1",
      title: "Live Transcription",
      position: { x: 50, y: 100 },
      content: transcription,
      isMinimized: false,
    },
    {
      id: "panel-2",
      title: "AI Insights",
      position: { x: 400, y: 200 },
      content: insights,
      isMinimized: false,
    },
    {
      id: "panel-3",
      title: "Audio Monitoring",
      position: { x: 750, y: 150 },
      content: audioLevel,
      isMinimized: false,
    },
  ]);

  const [focusedPanelIndex, setFocusedPanelIndex] = useState<number | null>(null);

  // UI state
  const [showCustomization, setShowCustomization] = useState(false);
  const [showAudioSelector, setShowAudioSelector] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Settings state
  const [settings, setSettings] = useState<GlassmorphismSettings>({
    blur: 12,
    opacity: 0.08,
    borderOpacity: 0.1,
    theme: "default",
    animationSpeed: "medium",
    highContrast: false,
  });

  // Mock audio sources (in real implementation, these would come from browser APIs)
  const [audioSources] = useState<AudioSource[]>([
    {
      id: "default-mic",
      name: "Default Microphone",
      type: "microphone",
      isDefault: true,
      isActive: true,
      volume: 100,
    },
    {
      id: "headset",
      name: "USB Headset",
      type: "microphone",
      isActive: false,
      volume: 85,
    },
    {
      id: "system-audio",
      name: "System Audio",
      type: "system",
      isActive: false,
      volume: 75,
    },
  ]);

  const [selectedAudioSource, setSelectedAudioSource] = useState("default-mic");

  // Panel management functions
  const updatePanelPosition = useCallback((id: string, position: { x: number; y: number }) => {
    setPanels((prev) => prev.map((panel) => (panel.id === id ? { ...panel, position } : panel)));
  }, []);

  const togglePanelMinimize = useCallback((id: string) => {
    setPanels((prev) =>
      prev.map((panel) => (panel.id === id ? { ...panel, isMinimized: !panel.isMinimized } : panel))
    );
  }, []);

  const resetPanels = useCallback(() => {
    setPanels([
      {
        id: "panel-1",
        title: "Live Transcription",
        position: { x: 50, y: 100 },
        content: transcription,
        isMinimized: false,
      },
      {
        id: "panel-2",
        title: "AI Insights",
        position: { x: 400, y: 200 },
        content: insights,
        isMinimized: false,
      },
      {
        id: "panel-3",
        title: "Audio Monitoring",
        position: { x: 750, y: 150 },
        content: audioLevel,
        isMinimized: false,
      },
    ]);
  }, [transcription, insights, audioLevel]);

  const minimizeAllPanels = useCallback(() => {
    setPanels((prev) => prev.map((panel) => ({ ...panel, isMinimized: true })));
  }, []);

  const focusNextPanel = useCallback(() => {
    setFocusedPanelIndex((prev) => {
      const next = prev === null ? 0 : (prev + 1) % panels.length;
      document.getElementById(panels[next].id)?.focus();
      return next;
    });
  }, [panels]);

  const focusPreviousPanel = useCallback(() => {
    setFocusedPanelIndex((prev) => {
      const next = prev === null ? panels.length - 1 : (prev - 1 + panels.length) % panels.length;
      document.getElementById(panels[next].id)?.focus();
      return next;
    });
  }, [panels]);

  // Customization functions
  const increaseBlur = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      blur: Math.min(prev.blur + 2, 30),
    }));
  }, []);

  const decreaseBlur = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      blur: Math.max(prev.blur - 2, 0),
    }));
  }, []);

  const increaseOpacity = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      opacity: Math.min(prev.opacity + 0.02, 0.3),
    }));
  }, []);

  const decreaseOpacity = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      opacity: Math.max(prev.opacity - 0.02, 0.02),
    }));
  }, []);

  const cycleTheme = useCallback(() => {
    const themes: GlassmorphismSettings["theme"][] = [
      "default",
      "cyan",
      "purple",
      "green",
      "amber",
    ];
    setSettings((prev) => {
      const currentIndex = themes.indexOf(prev.theme);
      const nextIndex = (currentIndex + 1) % themes.length;
      return { ...prev, theme: themes[nextIndex] };
    });
  }, []);

  const toggleHighContrast = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      highContrast: !prev.highContrast,
    }));
  }, []);

  // Audio source functions
  const selectNextAudioSource = useCallback(() => {
    const currentIndex = audioSources.findIndex((s) => s.id === selectedAudioSource);
    const nextIndex = (currentIndex + 1) % audioSources.length;
    setSelectedAudioSource(audioSources[nextIndex].id);
    onAudioSourceChange?.(audioSources[nextIndex].id);
  }, [audioSources, selectedAudioSource, onAudioSourceChange]);

  const selectPreviousAudioSource = useCallback(() => {
    const currentIndex = audioSources.findIndex((s) => s.id === selectedAudioSource);
    const nextIndex = (currentIndex - 1 + audioSources.length) % audioSources.length;
    setSelectedAudioSource(audioSources[nextIndex].id);
    onAudioSourceChange?.(audioSources[nextIndex].id);
  }, [audioSources, selectedAudioSource, onAudioSourceChange]);

  // Setup keyboard shortcuts
  useHUDShortcuts({
    onResetPanels: resetPanels,
    onMinimizeAllPanels: minimizeAllPanels,
    onFocusNextPanel: focusNextPanel,
    onFocusPreviousPanel: focusPreviousPanel,
    onCyclePanels: focusNextPanel,
    onToggleCustomization: () => setShowCustomization((prev) => !prev),
    onToggleTheme: cycleTheme,
    onIncreaseBlur: increaseBlur,
    onDecreaseBlur: decreaseBlur,
    onIncreaseOpacity: increaseOpacity,
    onDecreaseOpacity: decreaseOpacity,
    onToggleAudioSource: () => setShowAudioSelector((prev) => !prev),
    onSelectNextAudioSource: selectNextAudioSource,
    onSelectPreviousAudioSource: selectPreviousAudioSource,
    onToggleHelp: () => setShowHelp((prev) => !prev),
    onToggleHighContrast: toggleHighContrast,
    onRefresh: () => window.location.reload(),
  });

  // Apply theme colors
  useEffect(() => {
    const root = document.documentElement;
    const themeColors = {
      default: { primary: "#3B82F6", accent: "#00FFFF" },
      cyan: { primary: "#00E5FF", accent: "#0080FF" },
      purple: { primary: "#A855F7", accent: "#C77DFF" },
      green: { primary: "#00FFA3", accent: "#00FF7F" },
      amber: { primary: "#FFB347", accent: "#FF9500" },
    };

    const colors = themeColors[settings.theme];
    root.style.setProperty("--jarvis-cyan", colors.primary);
    root.style.setProperty("--jarvis-electric-blue", colors.accent);
  }, [settings.theme]);

  return (
    <div
      className="relative w-full h-screen overflow-hidden mac-background"
      role="application"
      aria-label="JARVIS HUD Interface"
    >
      {/* MAC Floating Background Orbs */}
      <div className="mac-floating-background" aria-hidden="true" />

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
        aria-hidden="true"
      />

      {/* HUD Title */}
      <header className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20">
        <h1 c className="mac-heading" lassName="mac-heading mac-display text-mac-text-primary">
          SIAM HUD Interface
        </h1>
        <p className="text-center mac-body mt-2">
          Smart In A Meeting • Floating Intelligence Panels
        </p>
      </header>

      {/* Floating Panels */}
      {panels.map((panel, index) => (
        <FloatingPanel
          key={panel.id}
          id={panel.id}
          title={panel.title}
          position={panel.position}
          onDrag={(position) => updatePanelPosition(panel.id, position)}
          onFocus={() => setFocusedPanelIndex(index)}
          isFocused={focusedPanelIndex === index}
          isMinimized={panel.isMinimized}
          onToggleMinimize={() => togglePanelMinimize(panel.id)}
          settings={settings}
        >
          {panel.id === "panel-1" && (
            <div className="w-80 max-h-40 overflow-y-auto">
              <p className="mac-body leading-relaxed">{panel.content}</p>
            </div>
          )}

          {panel.id === "panel-2" && (
            <div className="w-72">
              {(panel.content as string[]).map((insight, idx) => (
                <div
                  key={idx}
                  className="mb-2 p-4 rounded-lg border-l-2 border-mac-accent-purple-400 bg-mac-accent-purple-400/10"
                >
                  <p className="mac-body text-mac-text-secondary">{insight}</p>
                </div>
              ))}
            </div>
          )}

          {panel.id === "panel-3" && (
            <div className="w-64">
              <div className="mb-4">
                <p className="mac-body mb-2">
                  Audio Level: {Math.round((panel.content as number) * 100)}%
                </p>
                <div
                  className="h-2 rounded-full overflow-hidden bg-mac-border"
                  role="progressbar"
                  aria-valuenow={Math.round((panel.content as number) * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Audio level"
                >
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

      {/* Customization Panel */}
      <HUDCustomizationPanel
        isOpen={showCustomization}
        onClose={() => setShowCustomization(false)}
        settings={settings}
        onSettingsChange={setSettings}
        position={{ x: window.innerWidth / 2 - 200, y: 100 }}
      />

      {/* Audio Source Selector */}
      <AudioSourceSelector
        isOpen={showAudioSelector}
        onClose={() => setShowAudioSelector(false)}
        sources={audioSources}
        selectedSourceId={selectedAudioSource}
        onSelectSource={(id) => {
          setSelectedAudioSource(id);
          onAudioSourceChange?.(id);
        }}
        position={{ x: window.innerWidth - 500, y: 100 }}
      />

      {/* Help Overlay */}
      <HUDHelpOverlay isOpen={showHelp} onClose={() => setShowHelp(false)} />

      {/* Instructions Footer */}
      <footer className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="text-center space-y-2">
          <p className="mac-body text-mac-text-muted">
            Drag panels to reposition • Press{" "}
            <kbd className="px-2 py-2 rounded bg-jarvis-panel-dark-bg-end text-jarvis-cyan">F1</kbd>{" "}
            for help
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-mac-text-muted">
            <button
              onClick={() => setShowCustomization(true)}
              className="hover:text-jarvis-cyan transition-colors"
            >
              Customize (Ctrl+Shift+C)
            </button>
            <span>•</span>
            <button
              onClick={() => setShowAudioSelector(true)}
              className="hover:text-jarvis-cyan transition-colors"
            >
              Audio (Ctrl+Shift+A)
            </button>
            <span>•</span>
            <button
              onClick={() => setShowHelp(true)}
              className="hover:text-jarvis-cyan transition-colors"
            >
              Help (F1)
            </button>
          </div>
        </div>
      </footer>

      {/* Accessibility Announcements */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {showCustomization && "Customization panel opened"}
        {showAudioSelector && "Audio source selector opened"}
        {showHelp && "Help overlay opened"}
      </div>
    </div>
  );
};

export default EnhancedHUDInterface;
