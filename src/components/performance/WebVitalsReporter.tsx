"use client";

import { useEffect } from "react";
import { onLCP, onCLS, onFCP, onTTFB, onINP, Metric } from "web-vitals";

/**
 * WebVitalsReporter - Automatically collects and reports Core Web Vitals
 *
 * This component uses Google's web-vitals library to capture:
 * - LCP (Largest Contentful Paint) - loading performance
 * - CLS (Cumulative Layout Shift) - visual stability
 * - FCP (First Contentful Paint) - initial render
 * - TTFB (Time to First Byte) - server response time
 * - INP (Interaction to Next Paint) - responsiveness (replaced FID in 2024)
 *
 * Note: FID (First Input Delay) was removed in web-vitals v4, replaced by INP.
 *
 * Metrics are sent to /api/performance/metrics for aggregation.
 */
export function WebVitalsReporter() {
  useEffect(() => {
    // Report function that sends metrics to our API
    const reportMetric = async (metric: Metric) => {
      try {
        await fetch("/api/performance/metrics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "web-vital",
            metadata: {
              name: metric.name,
              value: metric.value,
              id: metric.id,
              rating: metric.rating, // "good" | "needs-improvement" | "poor"
            },
          }),
        });
      } catch (error) {
        // Silently fail - we don't want to impact user experience
        console.debug("Failed to report web vital:", error);
      }
    };

    // Register Core Web Vitals observers
    // Note: FID was removed in web-vitals v4, replaced by INP
    onLCP(reportMetric);
    onCLS(reportMetric);
    onFCP(reportMetric);
    onTTFB(reportMetric);
    onINP(reportMetric);
  }, []);

  // This component renders nothing - it just reports metrics
  return null;
}
