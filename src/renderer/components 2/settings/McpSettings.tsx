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
} from "lucide-react";
import { useMcp } from "../../hooks/useMcp";
import type { AOMAReshConfig } from "../../../services/aomaMeshMcp";
import { useNotifications } from "../../../hooks/useNotifications";

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
  const [validationErrors, setValidationErrors] = useState<
    Partial<McpFormData>
  >({});

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

  const handleFieldChange = <K extends keyof McpFormData>(
    field: K,
    value: McpFormData[K],
  ) => {
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

  if (!isOpen) return null;

  const serverStatus = getServerStatus();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-blue-600 font-mono">
          MCP Settings
        </h3>
        <div className="flex items-center gap-2 text-sm font-mono">
          <span className="text-gray-300">Status:</span>
          <span className={serverStatus.color}>{serverStatus.text}</span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Enable Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <div>
            <label className="text-sm font-medium text-gray-300">
              Enable MCP
            </label>
            <p className="text-xs text-gray-400 mt-1">
              Enable Model Context Protocol integration for enhanced AI
              capabilities
            </p>
          </div>
          <button
            onClick={() => handleFieldChange("enabled", !formData.enabled)}
            className={`flex items-center gap-2 px-3 py-2 rounded font-mono text-sm transition-colors ${
              formData.enabled
                ? "bg-blue-400/20 border border-blue-500 text-blue-300"
                : "bg-gray-600/20 border border-gray-500 text-gray-300"
            }`}
            data-testid="mcp-enable-toggle"
          >
            {formData.enabled ? (
              <>
                <ToggleRight className="w-4 h-4" />
                Enabled
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4" />
                Disabled
              </>
            )}
          </button>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 gap-6">
          {/* Server URL */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Server className="w-4 h-4 inline mr-2" />
              Server URL
            </label>
            <input
              type="url"
              value={formData.serverUrl}
              onChange={(e) => handleFieldChange("serverUrl", e.target.value)}
              placeholder="https://your-mcp-server.com"
              disabled={!formData.enabled}
              className={`w-full bg-gray-700 border rounded px-3 py-2 text-white focus:outline-none font-mono text-sm ${
                validationErrors.serverUrl
                  ? "border-red-500 focus:border-red-400"
                  : "border-gray-600 focus:border-blue-600"
              } ${!formData.enabled ? "opacity-50 cursor-not-allowed" : ""}`}
              data-testid="mcp-server-url"
            />
            {validationErrors.serverUrl && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {validationErrors.serverUrl}
              </p>
            )}
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Key className="w-4 h-4 inline mr-2" />
              API Key
              <span className="text-gray-400 font-normal ml-2">(optional)</span>
            </label>
            <input
              type="password"
              value={formData.apiKey}
              onChange={(e) => handleFieldChange("apiKey", e.target.value)}
              placeholder="Enter API key if required"
              disabled={!formData.enabled}
              className={`w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-600 focus:outline-none font-mono text-sm ${
                !formData.enabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
              data-testid="mcp-api-key"
            />
          </div>

          {/* Timeout */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Clock className="w-4 h-4 inline mr-2" />
              Timeout (ms)
            </label>
            <input
              type="number"
              min="1000"
              max="60000"
              step="1000"
              value={formData.timeout}
              onChange={(e) =>
                handleFieldChange("timeout", parseInt(e.target.value) || 5000)
              }
              disabled={!formData.enabled}
              className={`w-full bg-gray-700 border rounded px-3 py-2 text-white focus:outline-none font-mono text-sm ${
                validationErrors.timeout
                  ? "border-red-500 focus:border-red-400"
                  : "border-gray-600 focus:border-blue-600"
              } ${!formData.enabled ? "opacity-50 cursor-not-allowed" : ""}`}
              data-testid="mcp-timeout"
            />
            {validationErrors.timeout && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {validationErrors.timeout}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Connection timeout in milliseconds (1000-60000)
            </p>
          </div>
        </div>

        {/* Server Information */}
        {status?.data?.servers?.[0] && (
          <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
            <h4 className="text-sm font-medium text-gray-300 mb-3">
              Server Information
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm font-mono">
              <div>
                <span className="text-gray-400">Name:</span>
                <span className="text-blue-300 ml-2">
                  {status.data.servers[0].name || "Unknown"}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Uptime:</span>
                <span className="text-blue-300 ml-2">
                  {status.data.servers[0].uptime
                    ? `${Math.floor(status.data.servers[0].uptime / 1000)}s`
                    : "N/A"}
                </span>
              </div>
              {status.data.servers[0].statistics && (
                <>
                  <div>
                    <span className="text-gray-400">Requests:</span>
                    <span className="text-blue-300 ml-2">
                      {status.data.servers[0].statistics.requestCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Errors:</span>
                    <span className="text-blue-300 ml-2">
                      {status.data.servers[0].statistics.errorCount}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-gray-700">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-400/20 border border-blue-500 text-blue-300 rounded font-mono text-sm hover:bg-blue-400/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="mcp-save-button"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
