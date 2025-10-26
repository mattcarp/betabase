import { useState, useEffect } from "react";
import {
  Settings,
  X,
  Save,
  RotateCcw,
  Download,
  Upload,
  Volume2,
  Mic,
  Keyboard,
  Shield,
  Palette,
  Layout,
  Network,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useSettings, SiamSettings } from "../hooks/useSettings";
import useNotifications from "../hooks/useNotifications";
import { McpSettings } from "../renderer/components/settings/McpSettings";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout?: () => void;
}

interface TabDefinition {
  id: string;
  label: string;
  icon: React.ComponentType<{ cclassName?: string }>;
}

const tabs: TabDefinition[] = [
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "audio", label: "Audio", icon: Volume2 },
  { id: "recording", label: "Recording", icon: Mic },
  { id: "layout", label: "Layout", icon: Layout },
  { id: "shortcuts", label: "Shortcuts", icon: Keyboard },
  { id: "mcp", label: "MCP Settings", icon: Network },
  { id: "data", label: "Data & Privacy", icon: Shield },
];

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { settings, saveSettings, resetSettings, exportSettings, importSettings } = useSettings();
  const { success, error } = useNotifications();
  const [activeTab, setActiveTab] = useState("appearance");
  const [localSettings, setLocalSettings] = useState<SiamSettings>(settings);

  const handleSave = async () => {
    try {
      await saveSettings(localSettings);
      success("Settings saved successfully");
      onClose();
    } catch (err) {
      error("Failed to save settings");
    }
  };

  const handleReset = async () => {
    try {
      await resetSettings();
      setLocalSettings(settings);
      success("Settings reset to defaults");
    } catch (err) {
      error("Failed to reset settings");
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await importSettings(file);
      setLocalSettings(settings);
      success("Settings imported successfully");
      // Reset the input
      event.target.value = "";
    } catch (err) {
      error("Failed to import settings");
    }
  };

  const updateSetting = <K extends keyof SiamSettings>(key: K, value: SiamSettings[K]) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  const updateNestedSetting = <T extends keyof SiamSettings, K extends keyof SiamSettings[T]>(
    parentKey: T,
    key: K,
    value: SiamSettings[T][K]
  ) => {
    setLocalSettings((prev) => {
      const newSettings = { ...prev };
      if (typeof newSettings[parentKey] === "object" && newSettings[parentKey] !== null) {
        return {
          ...newSettings,
          [parentKey]: {
            ...newSettings[parentKey],
            [key]: value,
          },
        };
      }
      return newSettings;
    });
  };

  if (!isOpen) return null;

  return (
    <div
      cclassName="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      data-testid="settings-panel"
    >
      <div cclassName="bg-gray-800 border border-blue-600 rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div cclassName="flex items-center justify-between p-4 border-b border-gray-700">
          <div cclassName="flex items-center gap-2">
            <Settings cclassName="w-5 h-5 text-blue-600" />
            <h2
              cclassName="mac-heading"
              cclassName="mac-heading text-xl font-bold text-blue-600 font-mono"
            >
              Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            cclassName="text-gray-400 hover:text-white transition-colors"
            data-testid="settings-close"
          >
            <X cclassName="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div cclassName="flex-1 flex min-h-0">
          {/* Sidebar */}
          <div cclassName="w-48 border-r border-gray-700 p-4">
            <nav cclassName="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    cclassName={cn(
                      "w-full flex items-center gap-4 px-4 py-2 rounded font-mono text-sm transition-colors",
                      activeTab === tab.id
                        ? "bg-blue-600/20 text-blue-300 border border-blue-600/30"
                        : "text-gray-300 hover:text-blue-300 hover:bg-gray-700/50"
                    )}
                    data-testid={`settings-tab-${tab.id}`}
                  >
                    <Icon cclassName="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Settings Content */}
          <div cclassName="flex-1 p-6 overflow-y-auto">
            {activeTab === "appearance" && (
              <AppearanceSettings settings={localSettings} updateSetting={updateSetting} />
            )}
            {activeTab === "audio" && (
              <AudioSettings settings={localSettings} updateSetting={updateSetting} />
            )}
            {activeTab === "recording" && (
              <RecordingSettings settings={localSettings} updateSetting={updateSetting} />
            )}
            {activeTab === "layout" && (
              <LayoutSettings
                settings={localSettings}
                updateSetting={updateSetting}
                updateNestedSetting={updateNestedSetting}
              />
            )}
            {activeTab === "shortcuts" && (
              <ShortcutsSettings
                settings={localSettings}
                updateNestedSetting={updateNestedSetting}
              />
            )}
            {activeTab === "mcp" && (
              <McpSettings isOpen={true} onSave={() => success("MCP settings updated")} />
            )}
            {activeTab === "data" && (
              <DataPrivacySettings settings={localSettings} updateSetting={updateSetting} />
            )}
          </div>
        </div>

        {/* Footer */}
        <div cclassName="p-4 border-t border-gray-700 flex items-center justify-between">
          <div cclassName="flex items-center gap-2">
            <button
              onClick={exportSettings}
              cclassName="flex items-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-500 text-blue-300 rounded font-mono text-sm hover:bg-blue-600/30 transition-colors"
              data-testid="settings-export"
            >
              <Download cclassName="w-4 h-4" />
              Export
            </button>
            <label cclassName="flex items-center gap-2 px-4 py-2 bg-green-600/20 border border-green-500 text-green-300 rounded font-mono text-sm hover:bg-green-600/30 transition-colors cursor-pointer">
              <Upload cclassName="w-4 h-4" />
              Import
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                cclassName="hidden"
                data-testid="settings-import-input"
              />
            </label>
          </div>
          <div cclassName="flex items-center gap-2">
            <button
              onClick={handleReset}
              cclassName="flex items-center gap-2 px-4 py-2 bg-yellow-600/20 border border-yellow-500 text-yellow-300 rounded font-mono text-sm hover:bg-yellow-600/30 transition-colors"
              data-testid="settings-reset"
            >
              <RotateCcw cclassName="w-4 h-4" />
              Reset to Defaults
            </button>
            <button
              onClick={handleSave}
              cclassName="flex items-center gap-2 px-4 py-2 bg-blue-400/20 border border-blue-500 text-blue-300 rounded font-mono text-sm hover:bg-blue-400/30 transition-colors"
              data-testid="settings-save"
            >
              <Save cclassName="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Individual Settings Sections
function AppearanceSettings({
  settings,
  updateSetting,
}: {
  settings: SiamSettings;
  updateSetting: <K extends keyof SiamSettings>(key: K, value: SiamSettings[K]) => void;
}) {
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    // Web environment - no window opacity control available
    setIsElectron(false);
  }, [settings.windowOpacity]);

  const handleOpacityChange = async (value: number) => {
    updateSetting("windowOpacity", value);
    // Web environment - window opacity control not available
    console.log(`Window opacity setting updated to ${value}% (web environment)`);
  };

  return (
    <div cclassName="space-y-6">
      <h3 cclassName="mac-title">
        Appearance Settings
      </h3>

      <div cclassName="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label cclassName="block text-sm font-medium text-gray-300 mb-2">Theme</label>
          <select
            value={settings.theme}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              updateSetting("theme", e.target.value as SiamSettings["theme"])
            }
            cclassName="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white focus:border-blue-600 focus:outline-none"
            data-testid="theme-select"
          >
            <option value="matrix">Matrix</option>
            <option value="cyberpunk">Cyberpunk</option>
            <option value="minimal">Minimal</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <div>
          <label cclassName="block text-sm font-medium text-gray-300 mb-2">Color Scheme</label>
          <select
            value={settings.colorScheme}
            onChange={(e) =>
              updateSetting("colorScheme", e.target.value as SiamSettings["colorScheme"])
            }
            cclassName="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white focus:border-blue-600 focus:outline-none"
            data-testid="colorscheme-select"
          >
            <option value="default">Default</option>
            <option value="high-contrast">High Contrast</option>
            <option value="colorblind-friendly">Colorblind Friendly</option>
          </select>
        </div>

        <div>
          <label cclassName="block text-sm font-medium text-gray-300 mb-2">Font Size</label>
          <select
            value={settings.fontSize}
            onChange={(e) => updateSetting("fontSize", e.target.value as SiamSettings["fontSize"])}
            cclassName="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white focus:border-blue-600 focus:outline-none"
            data-testid="fontsize-select"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>
      </div>

      <div cclassName="flex items-center">
        <input
          type="checkbox"
          id="animations"
          checked={settings.animationsEnabled}
          onChange={(e) => updateSetting("animationsEnabled", e.target.checked)}
          cclassName="mr-2"
          data-testid="animations-checkbox"
        />
        <label htmlFor="animations" cclassName="text-gray-300">
          Enable animations and transitions
        </label>
      </div>

      {/* MAIN TRANSPARENCY SLIDER - This is the primary one */}
      <div cclassName="flex flex-col gap-2">
        <label htmlFor="window-opacity" cclassName="font-mono text-sm text-gray-300">
          🔄 Window Transparency: {settings.windowOpacity}%
        </label>
        <div cclassName="flex items-center gap-4">
          <input
            id="window-opacity"
            type="range"
            min="10"
            max="100"
            step="5"
            value={settings.windowOpacity}
            onChange={(e) => handleOpacityChange(parseInt(e.target.value, 10))}
            cclassName="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 slider"
            data-testid="transparency-slider"
            style={{
              background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${settings.windowOpacity}%, #374151 ${settings.windowOpacity}%, #374151 100%)`,
            }}
          />
          <span cclassName="font-mono text-sm text-blue-300 w-12 text-center">
            {settings.windowOpacity}%
          </span>
        </div>
        {isElectron ? (
          <div cclassName="text-xs text-green-400 font-mono">
            ✅ Electron detected - Live transparency control enabled
          </div>
        ) : (
          <div cclassName="text-xs text-yellow-400 font-mono">
            ⚠️ Web mode - Transparency saved for Electron build
          </div>
        )}
      </div>
    </div>
  );
}

function AudioSettings({
  settings,
  updateSetting,
}: {
  settings: SiamSettings;
  updateSetting: <K extends keyof SiamSettings>(key: K, value: SiamSettings[K]) => void;
}) {
  return (
    <div cclassName="space-y-6">
      <h3 cclassName="mac-title">
        Audio Settings
      </h3>

      <div cclassName="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label cclassName="block text-sm font-medium text-gray-300 mb-2">
            Audio Gain: {settings.audioGain}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.audioGain}
            onChange={(e) => updateSetting("audioGain", parseInt(e.target.value))}
            cclassName="w-full"
            data-testid="audio-gain-slider"
          />
        </div>
      </div>

      <div cclassName="space-y-3">
        <div cclassName="flex items-center">
          <input
            type="checkbox"
            id="noiseReduction"
            checked={settings.noiseReduction}
            onChange={(e) => updateSetting("noiseReduction", e.target.checked)}
            cclassName="mr-2"
            data-testid="noise-reduction-checkbox"
          />
          <label htmlFor="noiseReduction" cclassName="text-gray-300">
            Enable noise reduction
          </label>
        </div>

        <div cclassName="flex items-center">
          <input
            type="checkbox"
            id="audioVisualization"
            checked={settings.audioVisualizationEnabled}
            onChange={(e) => updateSetting("audioVisualizationEnabled", e.target.checked)}
            cclassName="mr-2"
            data-testid="audio-visualization-checkbox"
          />
          <label htmlFor="audioVisualization" cclassName="text-gray-300">
            Enable audio visualization
          </label>
        </div>
      </div>
    </div>
  );
}

function RecordingSettings({
  settings,
  updateSetting,
}: {
  settings: SiamSettings;
  updateSetting: <K extends keyof SiamSettings>(key: K, value: SiamSettings[K]) => void;
}) {
  return (
    <div cclassName="space-y-6">
      <h3 cclassName="mac-title">
        Recording Settings
      </h3>

      <div cclassName="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label cclassName="block text-sm font-medium text-gray-300 mb-2">
            Transcription Language
          </label>
          <select
            value={settings.transcriptionLanguage}
            onChange={(e) => updateSetting("transcriptionLanguage", e.target.value)}
            cclassName="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white focus:border-blue-600 focus:outline-none"
            data-testid="language-select"
          >
            <option value="en-US">English (US)</option>
            <option value="en-GB">English (UK)</option>
            <option value="es-ES">Spanish</option>
            <option value="fr-FR">French</option>
            <option value="de-DE">German</option>
            <option value="it-IT">Italian</option>
            <option value="pt-PT">Portuguese</option>
          </select>
        </div>

        <div>
          <label cclassName="block text-sm font-medium text-gray-300 mb-2">
            Max Recording Duration (minutes, 0 = unlimited)
          </label>
          <input
            type="number"
            min="0"
            max="480"
            value={settings.maxRecordingDuration}
            onChange={(e) => updateSetting("maxRecordingDuration", parseInt(e.target.value))}
            cclassName="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white focus:border-blue-600 focus:outline-none"
            data-testid="max-duration-input"
          />
        </div>
      </div>

      <div cclassName="space-y-3">
        <div cclassName="flex items-center">
          <input
            type="checkbox"
            id="autoStart"
            checked={settings.autoStartRecording}
            onChange={(e) => updateSetting("autoStartRecording", e.target.checked)}
            cclassName="mr-2"
            data-testid="auto-start-checkbox"
          />
          <label htmlFor="autoStart" cclassName="text-gray-300">
            Auto-start recording on app launch
          </label>
        </div>

        <div cclassName="flex items-center">
          <input
            type="checkbox"
            id="autoSave"
            checked={settings.autoSaveTranscriptions}
            onChange={(e) => updateSetting("autoSaveTranscriptions", e.target.checked)}
            cclassName="mr-2"
            data-testid="auto-save-checkbox"
          />
          <label htmlFor="autoSave" cclassName="text-gray-300">
            Auto-save transcriptions
          </label>
        </div>
      </div>
    </div>
  );
}

function LayoutSettings({
  settings,
  updateSetting,
  updateNestedSetting,
}: {
  settings: SiamSettings;
  updateSetting: <K extends keyof SiamSettings>(key: K, value: SiamSettings[K]) => void;
  updateNestedSetting: <T extends keyof SiamSettings, K extends keyof SiamSettings[T]>(
    parentKey: T,
    key: K,
    value: SiamSettings[T][K]
  ) => void;
}) {
  return (
    <div cclassName="space-y-6">
      <h3 cclassName="mac-title">
        Layout Settings
      </h3>

      <div cclassName="grid grid-cols-3 gap-4">
        <div>
          <label cclassName="block text-sm font-medium text-gray-300 mb-2">
            Left Panel: {settings.panelSizes.left}%
          </label>
          <input
            type="range"
            min="15"
            max="40"
            value={settings.panelSizes.left}
            onChange={(e) => updateNestedSetting("panelSizes", "left", parseInt(e.target.value))}
            cclassName="w-full"
            data-testid="left-panel-slider"
          />
        </div>

        <div>
          <label cclassName="block text-sm font-medium text-gray-300 mb-2">
            Middle Panel: {settings.panelSizes.middle}%
          </label>
          <input
            type="range"
            min="30"
            max="60"
            value={settings.panelSizes.middle}
            onChange={(e) => updateNestedSetting("panelSizes", "middle", parseInt(e.target.value))}
            cclassName="w-full"
            data-testid="middle-panel-slider"
          />
        </div>

        <div>
          <label cclassName="block text-sm font-medium text-gray-300 mb-2">
            Right Panel: {settings.panelSizes.right}%
          </label>
          <input
            type="range"
            min="15"
            max="40"
            value={settings.panelSizes.right}
            onChange={(e) => updateNestedSetting("panelSizes", "right", parseInt(e.target.value))}
            cclassName="w-full"
            data-testid="right-panel-slider"
          />
        </div>
      </div>

      <div cclassName="space-y-3">
        <div cclassName="flex items-center">
          <input
            type="checkbox"
            id="performanceStats"
            checked={settings.showPerformanceStats}
            onChange={(e) => updateSetting("showPerformanceStats", e.target.checked)}
            cclassName="mr-2"
            data-testid="performance-stats-checkbox"
          />
          <label htmlFor="performanceStats" cclassName="text-gray-300">
            Show performance statistics
          </label>
        </div>

        <div cclassName="flex items-center">
          <input
            type="checkbox"
            id="statusBar"
            checked={settings.showStatusBar}
            onChange={(e) => updateSetting("showStatusBar", e.target.checked)}
            cclassName="mr-2"
            data-testid="status-bar-checkbox"
          />
          <label htmlFor="statusBar" cclassName="text-gray-300">
            Show status bar
          </label>
        </div>

        <div cclassName="flex items-center">
          <input
            type="checkbox"
            id="compactMode"
            checked={settings.compactMode}
            onChange={(e) => updateSetting("compactMode", e.target.checked)}
            cclassName="mr-2"
            data-testid="compact-mode-checkbox"
          />
          <label htmlFor="compactMode" cclassName="text-gray-300">
            Enable compact mode
          </label>
        </div>
      </div>
    </div>
  );
}

function ShortcutsSettings({
  settings,
  updateNestedSetting,
}: {
  settings: SiamSettings;
  updateNestedSetting: <T extends keyof SiamSettings, K extends keyof SiamSettings[T]>(
    parentKey: T,
    key: K,
    value: SiamSettings[T][K]
  ) => void;
}) {
  const shortcuts = [
    { key: "toggleRecording", label: "Toggle Recording" },
    { key: "toggleTranscription", label: "Toggle Transcription Tab" },
    { key: "clearTranscription", label: "Clear Transcription" },
    { key: "saveSession", label: "Save Session" },
    { key: "toggleFullscreen", label: "Toggle Fullscreen" },
    { key: "showHelp", label: "Show Help" },
    { key: "exportData", label: "Export Data" },
    { key: "quickSearch", label: "Quick Search" },
    { key: "toggleSettings", label: "Toggle Settings" },
  ] as const;

  return (
    <div cclassName="space-y-6">
      <h3 cclassName="mac-title">
        Keyboard Shortcuts
      </h3>

      <div cclassName="grid grid-cols-1 md:grid-cols-2 gap-4">
        {shortcuts.map(({ key, label }) => (
          <div key={key} cclassName="flex items-center justify-between">
            <label cclassName="text-gray-300 text-sm">{label}</label>
            <input
              type="text"
              value={settings.shortcuts[key]}
              onChange={(e) => updateNestedSetting("shortcuts", key, e.target.value)}
              cclassName="w-24 bg-gray-700 border border-gray-600 rounded px-2 py-2 text-white text-center font-mono text-sm focus:border-blue-600 focus:outline-none"
              data-testid={`shortcut-${key}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function DataPrivacySettings({
  settings,
  updateSetting,
}: {
  settings: SiamSettings;
  updateSetting: <K extends keyof SiamSettings>(key: K, value: SiamSettings[K]) => void;
}) {
  return (
    <div cclassName="space-y-6">
      <h3 cclassName="mac-title">
        Data & Privacy Settings
      </h3>

      <div cclassName="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label cclassName="block text-sm font-medium text-gray-300 mb-2">
            Max Session History
          </label>
          <input
            type="number"
            min="10"
            max="1000"
            value={settings.maxSessionHistory}
            onChange={(e) => updateSetting("maxSessionHistory", parseInt(e.target.value))}
            cclassName="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white focus:border-blue-600 focus:outline-none"
            data-testid="max-sessions-input"
          />
        </div>

        <div>
          <label cclassName="block text-sm font-medium text-gray-300 mb-2">
            Session Retention (days)
          </label>
          <input
            type="number"
            min="1"
            max="365"
            value={settings.sessionRetentionDays}
            onChange={(e) => updateSetting("sessionRetentionDays", parseInt(e.target.value))}
            cclassName="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white focus:border-blue-600 focus:outline-none"
            data-testid="retention-days-input"
          />
        </div>
      </div>

      <div cclassName="space-y-3">
        <div cclassName="flex items-center">
          <input
            type="checkbox"
            id="localOnly"
            checked={settings.localStorageOnly}
            onChange={(e) => updateSetting("localStorageOnly", e.target.checked)}
            cclassName="mr-2"
            data-testid="local-only-checkbox"
          />
          <label htmlFor="localOnly" cclassName="text-gray-300">
            Use local storage only (no cloud sync)
          </label>
        </div>

        <div cclassName="flex items-center">
          <input
            type="checkbox"
            id="autoDelete"
            checked={settings.autoDeleteOldSessions}
            onChange={(e) => updateSetting("autoDeleteOldSessions", e.target.checked)}
            cclassName="mr-2"
            data-testid="auto-delete-checkbox"
          />
          <label htmlFor="autoDelete" cclassName="text-gray-300">
            Auto-delete old sessions
          </label>
        </div>
      </div>
    </div>
  );
}
