/**
 * Build information utilities
 * Centralized build version and timestamp logic
 */

export interface BuildInfo {
  appVersion: string;
  buildHash: string;
  buildTime: string;
  versionString: string;
}

/**
 * Get build information from environment variables
 * Used consistently across the app for version display
 */
export const getBuildInfo = (): BuildInfo => {
  const appVersion =
    (typeof process !== "undefined" ? process.env.NEXT_PUBLIC_APP_VERSION : undefined) || "0.1.0";
  const buildHash =
    (typeof process !== "undefined" ? process.env.NEXT_PUBLIC_BUILD_HASH : undefined) || "dev";
  // IMPORTANT: Use the build-time generated timestamp, NEVER create a new Date() here
  // The fallback is a FIXED timestamp, not a dynamic one
  const buildTime =
    (typeof process !== "undefined" ? process.env.NEXT_PUBLIC_BUILD_TIME : undefined) ||
    "2025-08-04T02:45:00.000Z";
  const versionString = `v${appVersion}-${buildHash.substring(0, 7)}`;

  return {
    appVersion,
    buildHash,
    buildTime,
    versionString,
  };
};

/**
 * Get formatted build timestamp for display
 * Shows in user's local timezone if in browser, UTC otherwise
 */
export const getFormattedBuildTime = (buildTime?: string): string => {
  // Use timestamp if available, otherwise fall back to buildTime
  const timestamp =
    typeof process !== "undefined" ? process.env.NEXT_PUBLIC_BUILD_TIMESTAMP : undefined;

  if (!buildTime && !timestamp) {
    return "Unknown build time";
  }

  // Create date from either Unix timestamp or ISO string
  const date = timestamp ? new Date(parseInt(timestamp) * 1000) : new Date(buildTime || "");

  // Check if we're in the browser
  if (typeof window !== "undefined") {
    // Show in user's local timezone with proper 12-hour format
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "numeric", // No leading zero for 12-hour format
      minute: "2-digit",
      second: "2-digit",
      hour12: true, // Explicitly use 12-hour format
      timeZoneName: "short",
    });
  } else {
    // Server-side: show UTC
    const formattedDate = date.toISOString().split("T")[0];
    const formattedTime = date.toISOString().split("T")[1]?.split(".")[0];
    return `${formattedDate} ${formattedTime} UTC`;
  }
};
