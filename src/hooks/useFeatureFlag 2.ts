"use client";

import { useState, useEffect } from "react";

// Feature flags configuration
const FEATURE_FLAGS = {
  useAIElements: {
    key: "siam.feature.useAIElements",
    defaultValue: false,
    description: "Enable new AI Elements UI for chat",
  },
} as const;

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

export function useFeatureFlag(
  flagKey: FeatureFlagKey,
): [boolean, (value: boolean) => void] {
  const flag = FEATURE_FLAGS[flagKey];

  const [enabled, setEnabled] = useState(() => {
    if (typeof window === "undefined") {
      return flag.defaultValue;
    }

    const stored = localStorage.getItem(flag.key);
    if (stored !== null) {
      return stored === "true";
    }

    // Check URL params for override
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get(flagKey);
    if (urlParam !== null) {
      return urlParam === "true";
    }

    return flag.defaultValue;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(flag.key, String(enabled));
    }
  }, [enabled, flag.key]);

  return [enabled, setEnabled];
}

// Helper to get all feature flags
export function getAllFeatureFlags() {
  const flags: Record<string, boolean> = {};

  Object.entries(FEATURE_FLAGS).forEach(([key, config]) => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(config.key);
      flags[key] = stored !== null ? stored === "true" : config.defaultValue;
    } else {
      flags[key] = config.defaultValue;
    }
  });

  return flags;
}

// Helper to reset all feature flags to defaults
export function resetFeatureFlags() {
  if (typeof window !== "undefined") {
    Object.values(FEATURE_FLAGS).forEach((config) => {
      localStorage.removeItem(config.key);
    });
  }
}
