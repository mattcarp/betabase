"use client";

import { WebVitals } from "./WebVitals";

/**
 * Client-side Web Vitals wrapper
 * This component is imported in the root layout to track performance
 */
export function ClientWebVitals() {
  const isDevelopment = process.env.NODE_ENV === "development";

  return <WebVitals enableConsoleLogging={isDevelopment} />;
}
