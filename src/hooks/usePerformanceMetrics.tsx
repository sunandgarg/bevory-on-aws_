import { useState, useEffect, useCallback } from "react";

export interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  fcp: number | null; // First Contentful Paint
  ttfb: number | null; // Time to First Byte
  inp: number | null; // Interaction to Next Paint
  
  // Page Load Metrics
  domContentLoaded: number | null;
  loadComplete: number | null;
  
  // Resource Metrics
  totalResources: number;
  totalTransferSize: number;
  imageCount: number;
  imageTransferSize: number;
  
  // Optimization Savings
  estimatedSavings: number;
}

const DEFAULT_METRICS: PerformanceMetrics = {
  lcp: null,
  fid: null,
  cls: null,
  fcp: null,
  ttfb: null,
  inp: null,
  domContentLoaded: null,
  loadComplete: null,
  totalResources: 0,
  totalTransferSize: 0,
  imageCount: 0,
  imageTransferSize: 0,
  estimatedSavings: 0,
};

export const usePerformanceMetrics = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>(DEFAULT_METRICS);
  const [loading, setLoading] = useState(true);

  const collectMetrics = useCallback(() => {
    try {
      const newMetrics: PerformanceMetrics = { ...DEFAULT_METRICS };

      // Navigation Timing API
      const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
      if (navigation) {
        newMetrics.domContentLoaded = Math.round(navigation.domContentLoadedEventEnd - navigation.startTime);
        newMetrics.loadComplete = Math.round(navigation.loadEventEnd - navigation.startTime);
        newMetrics.ttfb = Math.round(navigation.responseStart - navigation.requestStart);
      }

      // Resource Timing API
      const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
      let totalSize = 0;
      let imageSize = 0;
      let imageCount = 0;

      resources.forEach((resource) => {
        const size = resource.transferSize || 0;
        totalSize += size;
        
        if (resource.initiatorType === "img" || 
            resource.name.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)(\?|$)/i)) {
          imageCount++;
          imageSize += size;
        }
      });

      newMetrics.totalResources = resources.length;
      newMetrics.totalTransferSize = totalSize;
      newMetrics.imageCount = imageCount;
      newMetrics.imageTransferSize = imageSize;

      // Estimate savings from WebP conversion (typically 25-35% smaller)
      newMetrics.estimatedSavings = Math.round(imageSize * 0.30);

      // Web Vitals (using PerformanceObserver if available)
      const paintEntries = performance.getEntriesByType("paint");
      const fcpEntry = paintEntries.find(entry => entry.name === "first-contentful-paint");
      if (fcpEntry) {
        newMetrics.fcp = Math.round(fcpEntry.startTime);
      }

      // LCP from largest-contentful-paint entries
      const lcpEntries = performance.getEntriesByType("largest-contentful-paint");
      if (lcpEntries.length > 0) {
        const lastLcp = lcpEntries[lcpEntries.length - 1] as any;
        newMetrics.lcp = Math.round(lastLcp.startTime);
      }

      // CLS from layout-shift entries
      const layoutShiftEntries = performance.getEntriesByType("layout-shift");
      let clsValue = 0;
      layoutShiftEntries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      newMetrics.cls = Math.round(clsValue * 1000) / 1000;

      setMetrics(newMetrics);
      setLoading(false);
    } catch (error) {
      console.error("Error collecting performance metrics:", error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Wait for page to fully load
    if (document.readyState === "complete") {
      setTimeout(collectMetrics, 100);
    } else {
      window.addEventListener("load", () => {
        setTimeout(collectMetrics, 100);
      });
    }

    // Set up observers for Web Vitals
    try {
      // LCP Observer
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        setMetrics(prev => ({ ...prev, lcp: Math.round(lastEntry.startTime) }));
      });
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });

      // FID Observer
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const firstEntry = entries[0] as any;
        setMetrics(prev => ({ ...prev, fid: Math.round(firstEntry.processingStart - firstEntry.startTime) }));
      });
      fidObserver.observe({ type: "first-input", buffered: true });

      // CLS Observer
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        list.getEntries().forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        setMetrics(prev => ({ ...prev, cls: Math.round(clsValue * 1000) / 1000 }));
      });
      clsObserver.observe({ type: "layout-shift", buffered: true });

      // INP Observer
      const inpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          const lastEntry = entries[entries.length - 1] as any;
          setMetrics(prev => ({ ...prev, inp: Math.round(lastEntry.duration) }));
        }
      });
      inpObserver.observe({ type: "event", buffered: true });

      return () => {
        lcpObserver.disconnect();
        fidObserver.disconnect();
        clsObserver.disconnect();
        inpObserver.disconnect();
      };
    } catch (error) {
      // PerformanceObserver not fully supported
      console.warn("Some performance metrics not available:", error);
    }
  }, [collectMetrics]);

  const refresh = useCallback(() => {
    setLoading(true);
    collectMetrics();
  }, [collectMetrics]);

  return { metrics, loading, refresh };
};

// Utility to format bytes
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

// Utility to get score color
export const getScoreColor = (value: number | null, thresholds: { good: number; needsImprovement: number }): string => {
  if (value === null) return "text-muted-foreground";
  if (value <= thresholds.good) return "text-green-500";
  if (value <= thresholds.needsImprovement) return "text-yellow-500";
  return "text-red-500";
};

// Web Vitals thresholds (Google's recommendations)
export const WEB_VITALS_THRESHOLDS = {
  lcp: { good: 2500, needsImprovement: 4000 },
  fid: { good: 100, needsImprovement: 300 },
  cls: { good: 0.1, needsImprovement: 0.25 },
  fcp: { good: 1800, needsImprovement: 3000 },
  ttfb: { good: 800, needsImprovement: 1800 },
  inp: { good: 200, needsImprovement: 500 },
};
