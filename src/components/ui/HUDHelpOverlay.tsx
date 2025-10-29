import React, { useState } from "react";
import { cn } from "../../lib/utils";

interface HUDHelpOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

interface HelpSection {
  title: string;
  icon: React.ReactNode;
  shortcuts: Array<{
    key: string;
    description: string;
  }>;
}

export const HUDHelpOverlay: React.FC<HUDHelpOverlayProps> = ({ isOpen, onClose }) => {
  const [selectedSection, setSelectedSection] = useState<number>(0);

  const helpSections: HelpSection[] = [
    {
      title: "Panel Management",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"
          />
        </svg>
      ),
      shortcuts: [
        { key: "Ctrl+1-9", description: "Toggle specific panel" },
        { key: "Ctrl+Shift+R", description: "Reset all panels to default positions" },
        { key: "Ctrl+Shift+M", description: "Minimize all panels" },
        { key: "Drag Header", description: "Move panel to new position" },
      ],
    },
    {
      title: "Navigation",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      shortcuts: [
        { key: "Tab", description: "Focus next panel" },
        { key: "Shift+Tab", description: "Focus previous panel" },
        { key: "Ctrl+Tab", description: "Cycle through all panels" },
        { key: "Esc", description: "Close active panel or overlay" },
      ],
    },
    {
      title: "Customization",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
        </svg>
      ),
      shortcuts: [
        { key: "Ctrl+Shift+C", description: "Toggle customization panel" },
        { key: "Ctrl+Shift+T", description: "Cycle through theme presets" },
        { key: "Ctrl+↑ / Ctrl+↓", description: "Adjust blur intensity" },
        { key: "Ctrl+← / Ctrl+→", description: "Adjust panel opacity" },
        { key: "Ctrl+Shift+K", description: "Toggle high contrast mode" },
      ],
    },
    {
      title: "Audio Control",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
          />
        </svg>
      ),
      shortcuts: [
        { key: "Ctrl+Shift+A", description: "Toggle audio source selector" },
        { key: "Alt+↑ / Alt+↓", description: "Select next/previous audio source" },
        { key: "Space", description: "Toggle recording (when focused)" },
        { key: "Shift+Space", description: "Toggle transcription" },
      ],
    },
    {
      title: "Accessibility",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      shortcuts: [
        { key: "Ctrl+Shift+X", description: "Toggle accessibility features" },
        { key: "Ctrl+Shift+H", description: "Toggle this help overlay" },
        { key: "Ctrl++ / Ctrl+-", description: "Zoom in/out" },
        { key: "Screen Reader", description: "Full ARIA support enabled" },
      ],
    },
    {
      title: "General",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
      shortcuts: [
        { key: "F11", description: "Toggle fullscreen mode" },
        { key: "F5", description: "Refresh HUD interface" },
        { key: "Ctrl+S", description: "Save current session" },
        { key: "Ctrl+E", description: "Export session data" },
        { key: "Ctrl+K", description: "Quick command search" },
        { key: "Ctrl+,", description: "Open settings" },
      ],
    },
  ];

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center animate-in fade-in"
      role="dialog"
      aria-labelledby="help-overlay-title"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Help Panel */}
      <div className="relative w-full max-w-4xl mx-4 floating-panel animate-in zoom-in-95 slide-in-from-bottom-10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-jarvis-panel-border">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-jarvis-cyan/20">
              <svg
                className="w-6 h-6 text-jarvis-cyan"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h2
                className="mac-heading"
                id="help-overlay-title"
                className="mac-heading text-mac-text-primary"
              >
                JARVIS HUD Help
              </h2>
              <p className="mac-body text-xs text-mac-text-muted mt-2">
                Keyboard shortcuts and interface guide
              </p>
            </div>
          </div>
          <button onClick={onClose} className="hud-icon-button" aria-label="Close help overlay">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex h-[500px]">
          {/* Sidebar Navigation */}
          <div className="w-64 border-r border-jarvis-panel-border p-2 overflow-y-auto">
            <nav aria-label="Help sections">
              {helpSections.map((section, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedSection(index)}
                  className={cn(
                    "w-full flex items-center gap-4 px-4 py-4 rounded-lg transition-all duration-200 mb-2",
                    selectedSection === index
                      ? "bg-jarvis-panel-active-bg-start border border-jarvis-cyan text-jarvis-cyan"
                      : "text-mac-text-secondary hover:bg-jarvis-panel-bg-end hover:text-mac-text-primary"
                  )}
                  aria-current={selectedSection === index ? "page" : undefined}
                >
                  {section.icon}
                  <span className="mac-body font-medium">{section.title}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="mb-6">
              <h3 className="mac-title">{helpSections[selectedSection].title}</h3>
              <div className="h-1 w-16 rounded-full bg-gradient-to-r from-jarvis-cyan to-jarvis-electric-blue" />
            </div>

            <div className="space-y-2">
              {helpSections[selectedSection].shortcuts.map((shortcut, index) => (
                <div
                  key={index}
                  className="group flex items-start justify-between p-4 rounded-lg border border-jarvis-panel-border bg-jarvis-panel-bg-start hover:bg-jarvis-panel-bg-end hover:border-jarvis-panel-active-border transition-all duration-200"
                >
                  <p className="mac-body text-mac-text-secondary group-hover:text-mac-text-primary flex-1">
                    {shortcut.description}
                  </p>
                  <kbd className="ml-4 px-4 py-2.5 rounded-lg bg-jarvis-panel-dark-bg-start border border-jarvis-panel-dark-border text-jarvis-cyan font-mono text-sm whitespace-nowrap">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>

            {/* Additional Tips */}
            <div className="mt-8 p-4 rounded-lg border-l-4 border-jarvis-cyan bg-jarvis-cyan/5">
              <h4
                className="mac-title"
                className="mac-title mac-body font-normal text-jarvis-cyan mb-2"
              >
                Pro Tip
              </h4>
              <p className="mac-body text-sm text-mac-text-secondary">
                {selectedSection === 0 &&
                  "Drag panel headers to reposition them anywhere on screen. Your layout will be saved automatically."}
                {selectedSection === 1 &&
                  "Use Tab to quickly navigate between panels without using your mouse."}
                {selectedSection === 2 &&
                  "Customize the glassmorphism effects to match your preferences and lighting conditions."}
                {selectedSection === 3 &&
                  "Audio sources are automatically detected. Select the one that provides the clearest input."}
                {selectedSection === 4 &&
                  "High contrast mode increases visibility for users with visual impairments or in bright environments."}
                {selectedSection === 5 &&
                  "Sessions are auto-saved every 5 minutes. You can also manually save with Ctrl+S."}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-jarvis-panel-border bg-jarvis-panel-dark-bg-start/50 flex items-center justify-between">
          <p className="text-sm text-mac-text-muted">
            Press{" "}
            <kbd className="px-2 py-2 rounded bg-jarvis-panel-dark-bg-end text-jarvis-cyan">F1</kbd>{" "}
            or{" "}
            <kbd className="px-2 py-2 rounded bg-jarvis-panel-dark-bg-end text-jarvis-cyan">
              Ctrl+Shift+H
            </kbd>{" "}
            anytime to open this help
          </p>
          <p className="text-xs text-mac-text-muted">
            SIAM v{process.env.NEXT_PUBLIC_VERSION || "1.0.0"} • JARVIS Interface
          </p>
        </div>
      </div>
    </div>
  );
};

export default HUDHelpOverlay;
