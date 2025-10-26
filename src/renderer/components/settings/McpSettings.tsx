import React, { useState, useEffect } from "react";
import {
  Save,
  Server,
  Key,
  Clock,
  ToggleLeft,
  ToggleRight,
  Check,
  AlertCircle,
  Search,
  Database,
  Cpu,
  Eye,
  Zap,
  Activity,
} from "lucide-react";
import { useMcp } from "../../hooks/useMcp";
import type { AOMAReshConfig } from "../../../services/aomaMeshMcp";
import { useNotifications } from "../../../hooks/useNotifications";
// Temporarily disabled to fix build - MCP Feature Discovery uses Node.js modules
// import {
//   mcpFeatureDiscovery,
//   type MCPCapabilities,
//   type MCPFeature,
// } from "../../../services/MCPFeatureDiscovery";

interface McpSettingsProps {
  isOpen?: boolean;
  onSave?: () => void;
}

interface McpFormData {
  enabled: boolean;
  serverUrl: string;
  apiKey: string;
  timeout: number;
}

const DEFAULT_CONFIG: McpFormData = {
  enabled: false,
  serverUrl: "",
  apiKey: "",
  timeout: 5000,
};

export function McpSettings({ isOpen = true, onSave }: McpSettingsProps) {
  const { status, init, refresh } = useMcp();
  const { success, error } = useNotifications();

  const [formData, setFormData] = useState<McpFormData>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Partial<McpFormData>>({});
  // Temporarily disabled to fix build
  // const [capabilities, setCapabilities] = useState<MCPCapabilities | null>(
  //   null,
  // );
  const [capabilities, setCapabilities] = useState<any | null>(null);
  const [showFeatures, setShowFeatures] = useState(false);

  // Load current configuration from MCP status
  useEffect(() => {
    if (status?.data?.servers?.[0]) {
      const server = status.data.servers[0];
      setFormData({
        enabled: server.config.enabled,
        serverUrl: server.config.serverPath || "",
        apiKey: server.config.env?.API_KEY || "",
        timeout: server.config.timeout || 5000,
      });
    }
  }, [status]);

  // Load MCP capabilities - temporarily disabled to fix build
  useEffect(() => {
    const loadCapabilities = async () => {
      try {
        // const caps = await mcpFeatureDiscovery.discoverFeatures();
        // setCapabilities(caps);
        setCapabilities(null); // Temporary placeholder
      } catch (err) {
        console.error("Failed to load MCP capabilities:", err);
      }
    };

    if (formData.enabled) {
      loadCapabilities();

      // Set up capability updates listener - temporarily disabled
      // const handleCapabilityUpdate = (caps: MCPCapabilities) => {
      //   setCapabilities(caps);
      // };
      // mcpFeatureDiscovery.onCapabilitiesUpdate(handleCapabilityUpdate);
      // return () => {
      //   mcpFeatureDiscovery.removeListener(handleCapabilityUpdate);
      // };
    }
  }, [formData.enabled]);

  const validateForm = (): boolean => {
    const errors: Partial<McpFormData> = {};

    if (formData.enabled) {
      if (!formData.serverUrl.trim()) {
        errors.serverUrl = "Server URL is required when MCP is enabled";
      } else if (!isValidUrl(formData.serverUrl)) {
        errors.serverUrl = "Please enter a valid URL";
      }

      if (formData.timeout < 1000) {
        (errors as any).timeout = "Timeout must be at least 1000ms";
      } else if (formData.timeout > 60000) {
        (errors as any).timeout = "Timeout cannot exceed 60000ms";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      error("Please fix validation errors before saving");
      return;
    }

    setIsLoading(true);

    try {
      const config = {
        enabled: formData.enabled,
        serverUrl: formData.serverUrl.trim() || undefined,
        apiKey: (formData.apiKey as string).trim() || undefined,
        timeout: formData.timeout,
      } as AOMAReshConfig;

      // Update configuration
      await window.mcp.updateConfig(config);

      // Refresh status to get updated state
      await refresh();

      success("MCP settings saved successfully");
      onSave?.();
    } catch (err) {
      console.error("Failed to save MCP settings:", err);
      error("Failed to save MCP settings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = <K extends keyof McpFormData>(field: K, value: McpFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const getServerStatus = () => {
    if (!status?.data?.servers?.[0]) {
      return { text: "Not configured", color: "text-gray-400" };
    }

    const server = status.data.servers[0];
    switch (server.status) {
      case "connected":
        return { text: "Connected", color: "text-green-400" };
      case "connecting":
        return { text: "Connecting...", color: "text-yellow-400" };
      case "disconnected":
        return { text: "Disconnected", color: "text-gray-400" };
      case "error":
        return { text: "Error", color: "text-red-400" };
      default:
        return { text: "Unknown", color: "text-gray-400" };
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "knowledge":
        return <Database cclassName="w-4 h-4" />;
      case "analytics":
        return <Activity cclassName="w-4 h-4" />;
      case "integration":
        return <Search cclassName="w-4 h-4" />;
      case "observability":
        return <Eye cclassName="w-4 h-4" />;
      case "system":
        return <Cpu cclassName="w-4 h-4" />;
      default:
        return <Zap cclassName="w-4 h-4" />;
    }
  };

  const renderFeaturesByCategory = () => {
    if (!capabilities) return null;

    // Temporarily disabled to fix build
    // const categories = mcpFeatureDiscovery.getCategories();
    const categories: string[] = [];

    return categories.map((category) => {
      // const features = mcpFeatureDiscovery.getFeaturesByCategory(
      //   category as MCPFeature["category"],
      // );
      const features: any[] = [];
      if (features.length === 0) return null;

      return (
        <div key={category} cclassName="mb-6">
          <h5 cclassName="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
            {getCategoryIcon(category)}
            {category.charAt(0).toUpperCase() + category.slice(1)} ({features.length})
          </h5>
          <div cclassName="grid grid-cols-1 gap-2">
            {features.map((feature) => (
              <div
                key={feature.toolName}
                cclassName={`p-4 rounded border ${
                  feature.isAdvanced
                    ? "bg-yellow-900/20 border-yellow-500/30"
                    : "bg-gray-800/30 border-gray-700"
                }`}
              >
                <div cclassName="flex items-start justify-between">
                  <div cclassName="flex-1 min-w-0">
                    <div cclassName="flex items-center gap-2">
                      <code cclassName="text-xs font-mono text-blue-300 bg-gray-800 px-2 py-2 rounded">
                        {feature.toolName}
                      </code>
                      {feature.isAdvanced && (
                        <span cclassName="text-xs bg-yellow-600/20 text-yellow-300 px-2 py-2 rounded border border-yellow-500/30">
                          Advanced
                        </span>
                      )}
                    </div>
                    <p cclassName="text-xs text-gray-400 mt-2 line-clamp-2">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    });
  };

  if (!isOpen) return null;

  const serverStatus = getServerStatus();

  return (
    <div cclassName="space-y-6">
      <div cclassName="flex items-center justify-between">
        <h3 cclassName="mac-title text-lg font-bold text-blue-600 font-mono">MCP Settings</h3>
        <div cclassName="flex items-center gap-2 text-sm font-mono">
          <span cclassName="text-gray-300">Status:</span>
          <span cclassName={serverStatus.color}>{serverStatus.text}</span>
        </div>
      </div>

      <div cclassName="space-y-6">
        {/* Enable Toggle */}
        <div cclassName="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <div>
            <label cclassName="text-sm font-medium text-gray-300">Enable MCP</label>
            <p cclassName="text-xs text-gray-400 mt-2">
              Enable Model Context Protocol integration for enhanced AI capabilities
            </p>
          </div>
          <button
            onClick={() => handleFieldChange("enabled", !formData.enabled)}
            cclassName={`flex items-center gap-2 px-4 py-2 rounded font-mono text-sm transition-colors ${
              formData.enabled
                ? "bg-blue-400/20 border border-blue-500 text-blue-300"
                : "bg-gray-600/20 border border-gray-500 text-gray-300"
            }`}
            data-testid="mcp-enable-toggle"
          >
            {formData.enabled ? (
              <>
                <ToggleRight cclassName="w-4 h-4" />
                Enabled
              </>
            ) : (
              <>
                <ToggleLeft cclassName="w-4 h-4" />
                Disabled
              </>
            )}
          </button>
        </div>

        {/* Form Fields */}
        <div cclassName="grid grid-cols-1 gap-6">
          {/* Server URL */}
          <div>
            <label cclassName="block text-sm font-medium text-gray-300 mb-2">
              <Server cclassName="w-4 h-4 inline mr-2" />
              Server URL
            </label>
            <input
              type="url"
              value={formData.serverUrl}
              onChange={(e) => handleFieldChange("serverUrl", e.target.value)}
              placeholder="https://your-mcp-server.com"
              disabled={!formData.enabled}
              cclassName={`w-full bg-gray-700 border rounded px-4 py-2 text-white focus:outline-none font-mono text-sm ${
                validationErrors.serverUrl
                  ? "border-red-500 focus:border-red-400"
                  : "border-gray-600 focus:border-blue-600"
              } ${!formData.enabled ? "opacity-50 cursor-not-allowed" : ""}`}
              data-testid="mcp-server-url"
            />
            {validationErrors.serverUrl && (
              <p cclassName="text-red-400 text-xs mt-2 flex items-center gap-2">
                <AlertCircle cclassName="w-3 h-3" />
                {validationErrors.serverUrl}
              </p>
            )}
          </div>

          {/* API Key */}
          <div>
            <label cclassName="block text-sm font-medium text-gray-300 mb-2">
              <Key cclassName="w-4 h-4 inline mr-2" />
              API Key
              <span cclassName="text-gray-400 font-normal ml-2">(optional)</span>
            </label>
            <input
              type="password"
              value={formData.apiKey}
              onChange={(e) => handleFieldChange("apiKey", e.target.value)}
              placeholder="Enter API key if required"
              disabled={!formData.enabled}
              cclassName={`w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white focus:border-blue-600 focus:outline-none font-mono text-sm ${
                !formData.enabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
              data-testid="mcp-api-key"
            />
          </div>

          {/* Timeout */}
          <div>
            <label cclassName="block text-sm font-medium text-gray-300 mb-2">
              <Clock cclassName="w-4 h-4 inline mr-2" />
              Timeout (ms)
            </label>
            <input
              type="number"
              min="1000"
              max="60000"
              step="1000"
              value={formData.timeout}
              onChange={(e) => handleFieldChange("timeout", parseInt(e.target.value) || 5000)}
              disabled={!formData.enabled}
              cclassName={`w-full bg-gray-700 border rounded px-4 py-2 text-white focus:outline-none font-mono text-sm ${
                validationErrors.timeout
                  ? "border-red-500 focus:border-red-400"
                  : "border-gray-600 focus:border-blue-600"
              } ${!formData.enabled ? "opacity-50 cursor-not-allowed" : ""}`}
              data-testid="mcp-timeout"
            />
            {validationErrors.timeout && (
              <p cclassName="text-red-400 text-xs mt-2 flex items-center gap-2">
                <AlertCircle cclassName="w-3 h-3" />
                {validationErrors.timeout}
              </p>
            )}
            <p cclassName="text-xs text-gray-400 mt-2">
              Connection timeout in milliseconds (1000-60000)
            </p>
          </div>
        </div>

        {/* Server Information */}
        {status?.data?.servers?.[0] && (
          <div cclassName="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
            <h4 cclassName="mac-title text-sm font-medium text-gray-300 mb-4">Server Information</h4>
            <div cclassName="grid grid-cols-2 gap-4 text-sm font-mono">
              <div>
                <span cclassName="text-gray-400">Name:</span>
                <span cclassName="text-blue-300 ml-2">
                  {status.data.servers[0].name || "Unknown"}
                </span>
              </div>
              <div>
                <span cclassName="text-gray-400">Uptime:</span>
                <span cclassName="text-blue-300 ml-2">
                  {status.data.servers[0].uptime
                    ? `${Math.floor(status.data.servers[0].uptime / 1000)}s`
                    : "N/A"}
                </span>
              </div>
              {status.data.servers[0].statistics && (
                <>
                  <div>
                    <span cclassName="text-gray-400">Requests:</span>
                    <span cclassName="text-blue-300 ml-2">
                      {status.data.servers[0].statistics.requestCount}
                    </span>
                  </div>
                  <div>
                    <span cclassName="text-gray-400">Errors:</span>
                    <span cclassName="text-blue-300 ml-2">
                      {status.data.servers[0].statistics.errorCount}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* MCP Capabilities & Features */}
        {capabilities && formData.enabled && (
          <div cclassName="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
            <div cclassName="flex items-center justify-between mb-4">
              <h4 cclassName="mac-title text-sm font-medium text-gray-300">
                AOMA Mesh MCP Capabilities
              </h4>
              <button
                onClick={() => setShowFeatures(!showFeatures)}
                cclassName="text-xs text-blue-600 hover:text-blue-300 font-mono"
              >
                {showFeatures ? "Hide Features" : `Show ${capabilities.totalTools} Features`}
              </button>
            </div>

            <div cclassName="grid grid-cols-3 gap-4 text-sm font-mono mb-4">
              <div>
                <span cclassName="text-gray-400">Version:</span>
                <span cclassName="text-blue-300 ml-2">{capabilities.serverVersion}</span>
              </div>
              <div>
                <span cclassName="text-gray-400">Tools:</span>
                <span cclassName="text-blue-300 ml-2">{capabilities.totalTools}</span>
              </div>
              <div>
                <span cclassName="text-gray-400">Advanced:</span>
                <span cclassName="text-yellow-300 ml-2">
                  {capabilities.features.filter((f) => f.isAdvanced).length}
                </span>
              </div>
            </div>

            <div cclassName="flex items-center gap-2 text-xs">
              <div
                cclassName={`w-2 h-2 rounded-full ${
                  capabilities.connectionStatus === "connected"
                    ? "bg-green-400"
                    : capabilities.connectionStatus === "error"
                      ? "bg-red-400"
                      : "bg-yellow-400"
                }`}
              />
              <span cclassName="text-gray-400">
                {capabilities.connectionStatus === "connected"
                  ? "All features available"
                  : capabilities.connectionStatus === "error"
                    ? "Connection error"
                    : "Connecting..."}
              </span>
              <span cclassName="text-gray-500 ml-auto">
                Updated: {new Date(capabilities.lastUpdated).toLocaleTimeString()}
              </span>
            </div>

            {showFeatures && (
              <div cclassName="mt-6 border-t border-gray-700 pt-4">
                <div cclassName="max-h-96 overflow-y-auto">{renderFeaturesByCategory()}</div>
              </div>
            )}
          </div>
        )}

        {/* Save Button */}
        <div cclassName="flex justify-end pt-4 border-t border-gray-700">
          <button
            onClick={handleSave}
            disabled={isLoading}
            cclassName="flex items-center gap-2 px-4 py-2 bg-blue-400/20 border border-blue-500 text-blue-300 rounded font-mono text-sm hover:bg-blue-400/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="mcp-save-button"
          >
            {isLoading ? (
              <>
                <div cclassName="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save cclassName="w-4 h-4" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
