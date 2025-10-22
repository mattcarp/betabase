import { useState, useEffect, useCallback } from "react";
import {
  loadResourcesByPriority,
  measureLoadingPerformance,
  prefetchComponent as prefetchComponentUtil,
} from "../utils/preloader";

interface LoadingState {
  isLoading: boolean;
  progress: number;
  stage: string;
  error: string | null;
}

interface PerformanceMetrics {
  domContentLoaded: number;
  loadComplete: number;
  firstPaint: number;
  firstContentfulPaint: number;
}

export const usePerformance = () => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    progress: 0,
    stage: "Initializing...",
    error: null,
  });

  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  // Component prefetch registry
  const [prefetchedComponents] = useState(new Set<string>());

  const updateLoadingState = useCallback((update: Partial<LoadingState>) => {
    setLoadingState((prev) => ({ ...prev, ...update }));
  }, []);

  // Initialize performance monitoring and resource loading
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Stage 1: Load critical resources
        updateLoadingState({
          stage: "Loading critical resources...",
          progress: 10,
        });

        await loadResourcesByPriority();

        // Stage 2: Measure initial performance
        updateLoadingState({
          stage: "Measuring performance...",
          progress: 30,
        });

        const performanceMetrics = measureLoadingPerformance();
        if (performanceMetrics) {
          setMetrics(performanceMetrics);
        }

        // Stage 3: Prefetch likely components
        updateLoadingState({
          stage: "Preparing interface...",
          progress: 60,
        });

        // Prefetch components that are likely to be used
        await prefetchLikelyComponents();

        // Stage 4: Final initialization
        updateLoadingState({
          stage: "Finalizing...",
          progress: 90,
        });

        // Simulate final initialization delay
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Complete loading
        updateLoadingState({
          isLoading: false,
          progress: 100,
          stage: "Ready",
        });
      } catch (error) {
        updateLoadingState({
          error: error instanceof Error ? error.message : "Loading failed",
          isLoading: false,
        });
      }
    };

    initializeApp();
  }, [updateLoadingState]);

  // Prefetch components that are likely to be used
  const prefetchLikelyComponents = useCallback(async () => {
    const componentsToPrefetch = [
      // Settings panel (accessed via menu)
      () => import("../components/SettingsPanel"),
      // Error boundary (for error handling)
      () => import("../components/ErrorBoundary"),
    ];

    // Prefetch components in the background
    for (const importFn of componentsToPrefetch) {
      try {
        await prefetchComponentUtil(importFn);
      } catch (error) {
        // Prefetch failures are non-critical
        // console.log('Component prefetch failed:', error);
      }
    }
  }, []);

  // Prefetch a specific component by name
  const prefetchComponent = useCallback(
    async (componentName: string, importFn: () => Promise<any>) => {
      if (prefetchedComponents.has(componentName)) {
        return; // Already prefetched
      }

      try {
        await prefetchComponentUtil(importFn);
        prefetchedComponents.add(componentName);
      } catch (error) {
        // console.log(`Failed to prefetch ${componentName}:`, error);
      }
    },
    [prefetchedComponents]
  );

  // Mark critical path complete (when main UI is ready)
  const markCriticalPathComplete = useCallback(() => {
    // Measure time to interactive
    if ("performance" in window) {
      const now = performance.now();
      // console.log('Critical path completed at:', now);
    }
  }, []);

  // Report performance issue
  const reportPerformanceIssue = useCallback((issue: string, details?: any) => {
    // console.warn('Performance issue:', issue, details);

    // In production, this could send telemetry data
    if (process.env.NODE_ENV === "production") {
      // Send to analytics/monitoring service
    }
  }, []);

  // Lazy load a component with loading state
  const lazyLoadComponent = useCallback(
    async (importFn: () => Promise<any>, componentName: string) => {
      try {
        const startTime = performance.now();
        const component = await importFn();
        const loadTime = performance.now() - startTime;

        // Report slow component loads
        if (loadTime > 1000) {
          reportPerformanceIssue("Slow component load", {
            componentName,
            loadTime,
          });
        }

        return component;
      } catch (error) {
        reportPerformanceIssue("Component load failed", {
          componentName,
          error,
        });
        throw error;
      }
    },
    [reportPerformanceIssue]
  );

  // Get current performance state
  const getPerformanceState = useCallback(() => {
    return {
      loadingState,
      metrics,
      isReady: !loadingState.isLoading && !loadingState.error,
    };
  }, [loadingState, metrics]);

  // Monitor component render performance
  const measureRenderTime = useCallback(
    (componentName: string) => {
      const startTime = performance.now();

      return () => {
        const renderTime = performance.now() - startTime;

        // Report slow renders
        if (renderTime > 16) {
          // More than one frame at 60fps
          reportPerformanceIssue("Slow render", {
            componentName,
            renderTime,
          });
        }
      };
    },
    [reportPerformanceIssue]
  );

  return {
    // State
    loadingState,
    metrics,
    isLoading: loadingState.isLoading,
    isReady: !loadingState.isLoading && !loadingState.error,

    // Actions
    prefetchComponent,
    markCriticalPathComplete,
    reportPerformanceIssue,
    lazyLoadComponent,
    getPerformanceState,
    measureRenderTime,

    // Utils
    updateLoadingState,
  };
};

export default usePerformance;
