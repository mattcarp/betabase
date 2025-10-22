import React, { useState, useEffect } from "react";
import { cn } from "../../lib/utils";

export interface GlassmorphismSettings {
  blur: number;
  opacity: number;
  borderOpacity: number;
  theme: "default" | "cyan" | "purple" | "green" | "amber";
  animationSpeed: "slow" | "medium" | "fast";
  highContrast: boolean;
}

interface HUDCustomizationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GlassmorphismSettings;
  onSettingsChange: (settings: GlassmorphismSettings) => void;
  position?: { x: number; y: number };
}

const THEME_PRESETS = {
  default: {
    name: "Classic JARVIS",
    primary: "#3B82F6",
    accent: "#00FFFF",
    description: "Original cyan/blue theme",
  },
  cyan: {
    name: "Arctic Cyan",
    primary: "#00E5FF",
    accent: "#0080FF",
    description: "Bright cyan emphasis",
  },
  purple: {
    name: "Royal Purple",
    primary: "#A855F7",
    accent: "#C77DFF",
    description: "Purple gradient theme",
  },
  green: {
    name: "Matrix Green",
    primary: "#00FFA3",
    accent: "#00FF7F",
    description: "Green terminal style",
  },
  amber: {
    name: "Solar Amber",
    primary: "#FFB347",
    accent: "#FF9500",
    description: "Warm amber tones",
  },
};

export const HUDCustomizationPanel: React.FC<HUDCustomizationPanelProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  position = { x: 100, y: 100 },
}) => {
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSettingChange = <K extends keyof GlassmorphismSettings>(
    key: K,
    value: GlassmorphismSettings[K]
  ) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleReset = () => {
    const defaultSettings: GlassmorphismSettings = {
      blur: 12,
      opacity: 0.08,
      borderOpacity: 0.1,
      theme: "default",
      animationSpeed: "medium",
      highContrast: false,
    };
    setLocalSettings(defaultSettings);
    onSettingsChange(defaultSettings);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed z-50 w-96 floating-panel animate-in fade-in slide-in-from-top-5"
      style={{
        left: position.x,
        top: position.y,
      }}
      role="dialog"
      aria-label="HUD Customization Panel"
      aria-modal="true"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-jarvis-panel-border">
        <div>
          <h3 className="mac-title text-mac-text-primary">HUD Customization</h3>
          <p className="mac-body text-xs text-mac-text-muted mt-1">
            Personalize your JARVIS interface
          </p>
        </div>
        <button
          onClick={onClose}
          className="hud-icon-button"
          aria-label="Close customization panel"
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

      {/* Content */}
      <div className="p-4 space-y-6 max-h-[70vh] overflow-y-auto">
        {/* Theme Selection */}
        <section aria-labelledby="theme-section">
          <h4 id="theme-section" className="mac-body font-semibold text-mac-text-primary mb-3">
            Theme Preset
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {Object.entries(THEME_PRESETS).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => handleSettingChange("theme", key as GlassmorphismSettings["theme"])}
                className={cn(
                  "p-3 rounded-lg border transition-all duration-200",
                  localSettings.theme === key
                    ? "border-jarvis-cyan bg-jarvis-panel-active-bg-start"
                    : "border-jarvis-panel-border bg-jarvis-panel-bg-start hover:bg-jarvis-panel-bg-end"
                )}
                aria-pressed={localSettings.theme === key}
              >
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <p className="mac-body font-medium text-mac-text-primary">{preset.name}</p>
                    <p className="text-xs text-mac-text-muted">{preset.description}</p>
                  </div>
                  <div className="flex gap-1">
                    <div
                      className="w-6 h-6 rounded-full border border-white/20"
                      style={{ backgroundColor: preset.primary }}
                    />
                    <div
                      className="w-6 h-6 rounded-full border border-white/20"
                      style={{ backgroundColor: preset.accent }}
                    />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Blur Control */}
        <section aria-labelledby="blur-section">
          <label
            id="blur-section"
            htmlFor="blur-slider"
            className="mac-body font-semibold text-mac-text-primary mb-2 block"
          >
            Blur Intensity: {localSettings.blur}px
          </label>
          <input
            id="blur-slider"
            type="range"
            min="0"
            max="30"
            step="1"
            value={localSettings.blur}
            onChange={(e) => handleSettingChange("blur", parseInt(e.target.value))}
            className="w-full h-2 bg-jarvis-panel-dark-bg-start rounded-lg appearance-none cursor-pointer accent-jarvis-cyan"
            aria-valuemin={0}
            aria-valuemax={30}
            aria-valuenow={localSettings.blur}
          />
          <div className="flex justify-between text-xs text-mac-text-muted mt-1">
            <span>Sharp</span>
            <span>Blurred</span>
          </div>
        </section>

        {/* Opacity Control */}
        <section aria-labelledby="opacity-section">
          <label
            id="opacity-section"
            htmlFor="opacity-slider"
            className="mac-body font-semibold text-mac-text-primary mb-2 block"
          >
            Panel Opacity: {Math.round(localSettings.opacity * 100)}%
          </label>
          <input
            id="opacity-slider"
            type="range"
            min="0.02"
            max="0.3"
            step="0.01"
            value={localSettings.opacity}
            onChange={(e) => handleSettingChange("opacity", parseFloat(e.target.value))}
            className="w-full h-2 bg-jarvis-panel-dark-bg-start rounded-lg appearance-none cursor-pointer accent-jarvis-cyan"
            aria-valuemin={2}
            aria-valuemax={30}
            aria-valuenow={Math.round(localSettings.opacity * 100)}
          />
          <div className="flex justify-between text-xs text-mac-text-muted mt-1">
            <span>Transparent</span>
            <span>Solid</span>
          </div>
        </section>

        {/* Border Opacity Control */}
        <section aria-labelledby="border-opacity-section">
          <label
            id="border-opacity-section"
            htmlFor="border-opacity-slider"
            className="mac-body font-semibold text-mac-text-primary mb-2 block"
          >
            Border Opacity: {Math.round(localSettings.borderOpacity * 100)}%
          </label>
          <input
            id="border-opacity-slider"
            type="range"
            min="0.05"
            max="0.5"
            step="0.05"
            value={localSettings.borderOpacity}
            onChange={(e) => handleSettingChange("borderOpacity", parseFloat(e.target.value))}
            className="w-full h-2 bg-jarvis-panel-dark-bg-start rounded-lg appearance-none cursor-pointer accent-jarvis-cyan"
            aria-valuemin={5}
            aria-valuemax={50}
            aria-valuenow={Math.round(localSettings.borderOpacity * 100)}
          />
        </section>

        {/* Animation Speed */}
        <section aria-labelledby="animation-section">
          <h4 id="animation-section" className="mac-body font-semibold text-mac-text-primary mb-3">
            Animation Speed
          </h4>
          <div className="flex gap-2">
            {(["slow", "medium", "fast"] as const).map((speed) => (
              <button
                key={speed}
                onClick={() => handleSettingChange("animationSpeed", speed)}
                className={cn(
                  "flex-1 py-2 px-3 rounded-lg border text-sm transition-all duration-200",
                  localSettings.animationSpeed === speed
                    ? "border-jarvis-cyan bg-jarvis-panel-active-bg-start text-jarvis-cyan"
                    : "border-jarvis-panel-border bg-jarvis-panel-bg-start text-mac-text-secondary hover:bg-jarvis-panel-bg-end"
                )}
                aria-pressed={localSettings.animationSpeed === speed}
              >
                {speed.charAt(0).toUpperCase() + speed.slice(1)}
              </button>
            ))}
          </div>
        </section>

        {/* High Contrast Toggle */}
        <section aria-labelledby="contrast-section">
          <div className="flex items-center justify-between p-3 rounded-lg border border-jarvis-panel-border bg-jarvis-panel-bg-start">
            <div>
              <h4 id="contrast-section" className="mac-body font-semibold text-mac-text-primary">
                High Contrast Mode
              </h4>
              <p className="text-xs text-mac-text-muted mt-1">
                Increase visibility for accessibility
              </p>
            </div>
            <button
              onClick={() => handleSettingChange("highContrast", !localSettings.highContrast)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                localSettings.highContrast ? "bg-jarvis-cyan" : "bg-jarvis-panel-dark-bg-start"
              )}
              role="switch"
              aria-checked={localSettings.highContrast}
              aria-labelledby="contrast-section"
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  localSettings.highContrast ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>
        </section>

        {/* Reset Button */}
        <button onClick={handleReset} className="w-full hud-button text-center">
          Reset to Defaults
        </button>
      </div>

      {/* Keyboard Shortcuts Info */}
      <div className="px-4 py-3 border-t border-jarvis-panel-border bg-jarvis-panel-dark-bg-start/50">
        <p className="text-xs text-mac-text-muted text-center">
          <kbd className="px-1 py-0.5 rounded bg-jarvis-panel-dark-bg-end">Ctrl+↑/↓</kbd> Blur •{" "}
          <kbd className="px-1 py-0.5 rounded bg-jarvis-panel-dark-bg-end">Ctrl+←/→</kbd> Opacity
        </p>
      </div>
    </div>
  );
};

export default HUDCustomizationPanel;
