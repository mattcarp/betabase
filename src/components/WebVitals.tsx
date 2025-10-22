"use client";

import { useEffect } from "react";
import { onCLS, onFCP, onLCP, onTTFB, onINP, type Metric } from "web-vitals";

/**
 * Web Vitals Tracking Component
 *
 * Tracks Core Web Vitals and sends them to analytics/monitoring
 *
 * Metrics tracked:
 * - LCP (Largest Contentful Paint): Loading performance
 * - INP (Interaction to Next Paint): Responsiveness (replaced FID in web-vitals v4+)
 * - CLS (Cumulative Layout Shift): Visual stability
 * - FCP (First Contentful Paint): Perceived load speed
 * - TTFB (Time to First Byte): Server response time
 *
 * Thresholds (Google recommendations):
 * - LCP: Good < 2.5s, Needs Improvement < 4s, Poor >= 4s
 * - INP: Good < 200ms, Needs Improvement < 500ms, Poor >= 500ms
 * - CLS: Good < 0.1, Needs Improvement < 0.25, Poor >= 0.25
 * - FCP: Good < 1.8s, Needs Improvement < 3s, Poor >= 3s
 * - TTFB: Good < 800ms, Needs Improvement < 1800ms, Poor >= 1800ms
 *
 * Note: FID (First Input Delay) was deprecated in web-vitals v4 and replaced with INP
 */

interface WebVitalsProps {
  onMetric?: (metric: Metric) => void;
  enableConsoleLogging?: boolean;
}

// Rate limits for core vitals
export enum Rating {
  GOOD = "good",
  NEEDS_IMPROVEMENT = "needs-improvement",
  POOR = "poor",
}

const WEB_VITALS_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  INP: { good: 200, poor: 500 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
};

function getRating(metric: Metric): Rating {
  const thresholds = WEB_VITALS_THRESHOLDS[metric.name as keyof typeof WEB_VITALS_THRESHOLDS];
  if (!thresholds) return Rating.GOOD;

  if (metric.value <= thresholds.good) return Rating.GOOD;
  if (metric.value <= thresholds.poor) return Rating.NEEDS_IMPROVEMENT;
  return Rating.POOR;
}

function formatMetricValue(metric: Metric): string {
  if (metric.name === "CLS") {
    return metric.value.toFixed(3);
  }
  return `${Math.round(metric.value)}ms`;
}

export function WebVitals({ onMetric, enableConsoleLogging = false }: WebVitalsProps) {
  useEffect(() => {
    const handleMetric = (metric: Metric) => {
      const rating = getRating(metric);
      const formattedValue = formatMetricValue(metric);

      // Console logging for development
      if (enableConsoleLogging) {
        const ratingEmoji = {
          [Rating.GOOD]: "✅",
          [Rating.NEEDS_IMPROVEMENT]: "⚠️",
          [Rating.POOR]: "❌",
        };

        console.log(
          `${ratingEmoji[rating]} Web Vital - ${metric.name}: ${formattedValue} (${rating})`,
          {
            id: metric.id,
            value: metric.value,
            rating,
            navigationType: metric.navigationType,
          }
        );
      }

      // Send to analytics endpoint (if provided)
      if (onMetric) {
        onMetric(metric);
      }

      // Send to API endpoint for storage/dashboard
      if (typeof window !== "undefined") {
        // Use sendBeacon for reliability (doesn't block page unload)
        const data = {
          name: metric.name,
          value: metric.value,
          rating,
          id: metric.id,
          navigationType: metric.navigationType,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        };

        // Try sendBeacon first (more reliable), fallback to fetch
        const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
        if (!navigator.sendBeacon("/api/web-vitals", blob)) {
          // Fallback to fetch if sendBeacon fails
          fetch("/api/web-vitals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
            keepalive: true,
          }).catch((error) => {
            if (enableConsoleLogging) {
              console.error("Failed to send Web Vital:", error);
            }
          });
        }
      }
    };

    // Register all Core Web Vitals
    onCLS(handleMetric);
    onFCP(handleMetric);
    onLCP(handleMetric);
    onTTFB(handleMetric);
    onINP(handleMetric);
  }, [onMetric, enableConsoleLogging]);

  return null; // This component doesn't render anything
}

/**
 * Helper function to use in _app.tsx or layout.tsx
 *
 * @example
 * ```tsx
 * // In app/layout.tsx
 * import { reportWebVitals } from "@/components/WebVitals";
 *
 * export function reportWebVitals(metric: Metric) {
 *   // Send to Google Analytics
 *   window.gtag?.('event', metric.name, {
 *     value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
 *     event_label: metric.id,
 *     non_interaction: true,
 *   });
 * }
 * ```
 */
export function reportWebVitals(metric: Metric) {
  // Default implementation - can be overridden
  if (process.env.NODE_ENV === "development") {
    console.log(`Web Vital - ${metric.name}:`, metric.value);
  }

  // Send to analytics services here
  // Example: Google Analytics, Vercel Analytics, etc.
}
