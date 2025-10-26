import React, { useState, useEffect } from "react";
import { cn } from "../../lib/utils";

export interface AudioSource {
  id: string;
  name: string;
  type: "microphone" | "system" | "application" | "virtual";
  deviceId?: string;
  isDefault?: boolean;
  isActive?: boolean;
  volume?: number;
}

interface AudioSourceSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  sources: AudioSource[];
  selectedSourceId?: string;
  onSelectSource: (sourceId: string) => void;
  onVolumeChange?: (sourceId: string, volume: number) => void;
  position?: { x: number; y: number };
}

export const AudioSourceSelector: React.FC<AudioSourceSelectorProps> = ({
  isOpen,
  onClose,
  sources,
  selectedSourceId,
  onSelectSource,
  onVolumeChange,
  position = { x: 100, y: 100 },
}) => {
  const [audioLevel, setAudioLevel] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState("");

  // Simulate audio level monitoring (in real implementation, this would use Web Audio API)
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      const newLevels: Record<string, number> = {};
      sources.forEach((source) => {
        if (source.isActive) {
          newLevels[source.id] = Math.random() * 0.8 + 0.2; // Simulate audio activity
        } else {
          newLevels[source.id] = 0;
        }
      });
      setAudioLevel(newLevels);
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, sources]);

  const filteredSources = sources.filter((source) =>
    source.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSourceIcon = (type: AudioSource["type"]) => {
    switch (type) {
      case "microphone":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        );
      case "system":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        );
      case "application":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
            />
          </svg>
        );
      case "virtual":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed z-50 w-[450px] floating-panel animate-in fade-in slide-in-from-right-5"
      style={{
        left: position.x,
        top: position.y,
      }}
      role="dialog"
      aria-label="Audio Source Selector"
      aria-modal="true"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-jarvis-panel-border">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-jarvis-cyan"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
            />
          </svg>
          <div>
            <h3 className="mac-title">
              Audio Sources
            </h3>
            <p className="mac-body text-xs text-mac-text-muted mt-0.5">Select audio input device</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="hud-icon-button"
          aria-label="Close audio source selector"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-jarvis-panel-border">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-mac-text-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search audio sources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-jarvis-panel-dark-bg-start border border-jarvis-panel-border rounded-lg text-mac-text-primary placeholder-mac-text-muted focus:outline-none focus:border-jarvis-cyan transition-colors"
            aria-label="Search audio sources"
          />
        </div>
      </div>

      {/* Source List */}
      <div className="max-h-[400px] overflow-y-auto p-2">
        {filteredSources.length === 0 ? (
          <div className="p-8 text-center">
            <p className="mac-body text-mac-text-muted">No audio sources found</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredSources.map((source) => (
              <button
                key={source.id}
                onClick={() => onSelectSource(source.id)}
                className={cn(
                  "w-full p-4 rounded-lg border transition-all duration-200 text-left",
                  selectedSourceId === source.id
                    ? "border-jarvis-cyan bg-jarvis-panel-active-bg-start"
                    : "border-jarvis-panel-border bg-jarvis-panel-bg-start hover:bg-jarvis-panel-bg-end hover:border-jarvis-panel-active-border"
                )}
                aria-pressed={selectedSourceId === source.id}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className={cn(
                        "p-2 rounded-lg",
                        selectedSourceId === source.id
                          ? "bg-jarvis-cyan/20 text-jarvis-cyan"
                          : "bg-jarvis-panel-dark-bg-start text-mac-text-secondary"
                      )}
                    >
                      {getSourceIcon(source.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="mac-body font-medium text-mac-text-primary truncate">
                          {source.name}
                        </p>
                        {source.isDefault && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-jarvis-cyan/20 text-jarvis-cyan border border-jarvis-cyan/30">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-mac-text-muted capitalize mt-0.5">{source.type}</p>

                      {/* Audio Level Indicator */}
                      {source.isActive && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1 bg-jarvis-panel-dark-bg-start rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-jarvis-cyan to-jarvis-electric-blue transition-all duration-100 rounded-full"
                                style={{
                                  width: `${(audioLevel[source.id] || 0) * 100}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs text-mac-text-muted tabular-nums w-8 text-right">
                              {Math.round((audioLevel[source.id] || 0) * 100)}%
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Volume Control (if callback provided) */}
                      {onVolumeChange && selectedSourceId === source.id && (
                        <div className="mt-4">
                          <label className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-mac-text-muted flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                              />
                            </svg>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={source.volume || 100}
                              onChange={(e) => onVolumeChange(source.id, parseInt(e.target.value))}
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1 h-1 bg-jarvis-panel-dark-bg-start rounded-full appearance-none cursor-pointer accent-jarvis-cyan"
                              aria-label={`Volume for ${source.name}`}
                            />
                            <span className="text-xs text-mac-text-muted tabular-nums w-8 text-right">
                              {source.volume || 100}%
                            </span>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Active Indicator */}
                  {source.isActive && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-jarvis-cyan animate-pulse" />
                      <span className="text-xs text-jarvis-cyan">Live</span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-jarvis-panel-border bg-jarvis-panel-dark-bg-start/50">
        <div className="flex items-center justify-between">
          <p className="text-xs text-mac-text-muted">
            {filteredSources.length} source{filteredSources.length !== 1 ? "s" : ""} available
          </p>
          <p className="text-xs text-mac-text-muted">
            <kbd className="px-2 py-0.5 rounded bg-jarvis-panel-dark-bg-end">Alt+↑/↓</kbd> Navigate
          </p>
        </div>
      </div>
    </div>
  );
};

export default AudioSourceSelector;
