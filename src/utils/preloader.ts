/**
 * Resource preloading utilities for optimized application performance
 */

// Types for different resource types
type ResourceType = "script" | "style" | "image" | "font" | "video" | "audio";

interface PreloadResource {
  href: string;
  as: ResourceType;
  crossorigin?: string;
  type?: string;
}

/**
 * Preload critical resources using link rel="preload"
 */
export function preloadResource({ href, as, crossorigin, type }: PreloadResource): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if resource is already loaded
    const existing = document.querySelector(`link[href="${href}"]`);
    if (existing) {
      resolve();
      return;
    }

    const link = document.createElement("link");
    link.rel = "preload";
    link.href = href;
    link.as = as;

    if (crossorigin) link.crossOrigin = crossorigin;
    if (type) link.type = type;

    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to preload ${href}`));

    document.head.appendChild(link);
  });
}

/**
 * Preload multiple resources concurrently
 */
export async function preloadResources(resources: PreloadResource[]): Promise<void> {
  try {
    await Promise.all(resources.map((resource) => preloadResource(resource)));
    // console.log('All resources preloaded successfully');
  } catch (error) {
    // console.error('Error preloading resources:', error);
    throw error;
  }
}

/**
 * Preload images with intersection observer for lazy loading
 */
export function preloadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

/**
 * Lazy load images with intersection observer
 */
export function createImageLazyLoader() {
  const imageObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;

          if (src) {
            img.src = src;
            img.removeAttribute("data-src");
            observer.unobserve(img);
          }
        }
      });
    },
    {
      rootMargin: "50px 0px", // Start loading 50px before the image enters viewport
      threshold: 0.01,
    }
  );

  return {
    observe: (img: HTMLImageElement) => imageObserver.observe(img),
    disconnect: () => imageObserver.disconnect(),
  };
}

/**
 * Prefetch module chunks for components that might be needed
 */
export async function prefetchComponent(importFn: () => Promise<any>): Promise<void> {
  try {
    // Prefetch in the background without executing
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => {
        importFn();
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        importFn();
      }, 100);
    }
  } catch (error) {
    // console.log('Prefetch failed, but will load on demand:', error);
  }
}

/**
 * Critical resource preloader for essential app assets
 */
export const criticalResources: PreloadResource[] = [
  // Fonts
  {
    href: "/fonts/inter-var.woff2",
    as: "font",
    crossorigin: "anonymous",
    type: "font/woff2",
  },
  // Critical CSS will be inlined, so we don't need to preload it
];

/**
 * Non-critical resources that can be preloaded after initial load
 */
export const nonCriticalResources: PreloadResource[] = [
  // Additional fonts, images, or other assets
];

/**
 * Resource priority levels
 */
export enum ResourcePriority {
  CRITICAL = "critical",
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
}

/**
 * Load resources based on priority
 */
export async function loadResourcesByPriority() {
  try {
    // Load critical resources first
    await preloadResources(criticalResources);

    // Load non-critical resources after a delay
    requestIdleCallback(() => {
      preloadResources(nonCriticalResources);
    });
  } catch (error) {
    // console.error('Resource loading failed:', error);
  }
}

/**
 * Measure and report loading performance
 */
export function measureLoadingPerformance() {
  if ("performance" in window) {
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;

    const metrics = {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
      loadComplete: navigation.loadEventEnd - navigation.fetchStart,
      firstPaint: 0,
      firstContentfulPaint: 0,
    };

    // Get paint metrics if available
    const paintEntries = performance.getEntriesByType("paint");
    paintEntries.forEach((entry) => {
      if (entry.name === "first-paint") {
        metrics.firstPaint = entry.startTime;
      } else if (entry.name === "first-contentful-paint") {
        metrics.firstContentfulPaint = entry.startTime;
      }
    });

    // console.log('Loading Performance Metrics:', metrics);
    return metrics;
  }

  return null;
}
