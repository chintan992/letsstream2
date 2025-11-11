import { swAnalytics } from "./sw-analytics";
import * as webVitals from "web-vitals";

type VitalMetric = {
  name: string;
  value: number;
  delta: number;
  id: string;
  entries: PerformanceEntry[];
};

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private marks: Record<string, number> = {};
  private isEnabled: boolean;
  private reportedMetrics: Set<string> = new Set();

  private constructor() {
    this.isEnabled = typeof window !== "undefined" && "performance" in window;
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startMeasurement(name: string) {
    if (!this.isEnabled) return;
    this.marks[name] = performance.now();
  }

  endMeasurement(name: string, category: string) {
    if (!this.isEnabled || !this.marks[name]) return;

    const duration = performance.now() - this.marks[name];
    delete this.marks[name];

    // Report to analytics if duration is significant (> 100ms)
    if (duration > 100) {
      swAnalytics.trackPerformanceEvent({
        name: `${category}_${name}`,
        value: Math.round(duration),
        type: "custom",
      });
    }

    return duration;
  }

  private reportWebVital(metric: VitalMetric) {
    // Avoid duplicate reporting for the same metric ID
    if (this.reportedMetrics.has(metric.id)) return;
    this.reportedMetrics.add(metric.id);

    console.log(`Web Vital: ${metric.name} = ${metric.value}`);

    swAnalytics.trackPerformanceEvent({
      name: metric.name,
      value: Math.round(
        metric.name === "CLS" ? metric.value * 1000 : metric.value
      ),
      type: "web-vital",
    });
  }

  initializeMonitoring() {
    if (!this.isEnabled) return;

    // Report Web Vitals metrics
    webVitals.onCLS(metric => this.reportWebVital(metric));
    webVitals.onFID(metric => this.reportWebVital(metric));
    webVitals.onLCP(metric => this.reportWebVital(metric));
    webVitals.onTTFB(metric => this.reportWebVital(metric));
    webVitals.onFCP(metric => this.reportWebVital(metric));
    webVitals.onINP(metric => this.reportWebVital(metric));

    // Measure resource timing
    this.measureResourceTiming();

    // Measure navigation timing
    this.measureNavigationTiming();

    // Report service worker activation time
    if ("serviceWorker" in navigator) {
      this.startMeasurement("swActivation");
      navigator.serviceWorker.ready.then(() => {
        this.endMeasurement("swActivation", "ServiceWorker");
      });
    }

    // Check for service worker controller
    if ("serviceWorker" in navigator) {
      if (navigator.serviceWorker.controller) {
        swAnalytics.trackPerformanceEvent({
          name: "ServiceWorkerStatus",
          value: 1, // 1 = active
          type: "sw-status",
        });
      } else {
        const swListener = () => {
          swAnalytics.trackPerformanceEvent({
            name: "ServiceWorkerStatus",
            value: 1, // 1 = active
            type: "sw-status",
          });
          navigator.serviceWorker.removeEventListener(
            "controllerchange",
            swListener
          );
        };

        navigator.serviceWorker.addEventListener(
          "controllerchange",
          swListener
        );

        // Initial state (no controller)
        swAnalytics.trackPerformanceEvent({
          name: "ServiceWorkerStatus",
          value: 0, // 0 = not active
          type: "sw-status",
        });
      }
    }
  }

  measureResourceTiming() {
    if (!this.isEnabled) return;

    new PerformanceObserver(entryList => {
      for (const entry of entryList.getEntries()) {
        // Only measure resources that took longer than 1 second
        if (entry.duration > 1000) {
          swAnalytics.trackPerformanceEvent({
            name: "ResourceTiming",
            value: Math.round(entry.duration),
            type: "resource",
            url: entry.name,
          });
        }
      }
    }).observe({ entryTypes: ["resource"] });
  }

  measureNavigationTiming() {
    if (!this.isEnabled) return;

    try {
      const navigation = performance.getEntriesByType(
        "navigation"
      )[0] as PerformanceNavigationTiming;
      if (navigation) {
        // Time to First Byte (TTFB)
        const ttfb = Math.round(
          navigation.responseStart - navigation.requestStart
        );
        if (ttfb > 0) {
          swAnalytics.trackPerformanceEvent({
            name: "TTFB",
            value: ttfb,
            type: "navigation",
          });
        }

        // DOM Interactive
        const domInteractive = Math.round(navigation.domInteractive);
        if (domInteractive > 0) {
          swAnalytics.trackPerformanceEvent({
            name: "DOMInteractive",
            value: domInteractive,
            type: "navigation",
          });
        }

        // DOM Complete
        const domComplete = Math.round(navigation.domComplete);
        if (domComplete > 0) {
          swAnalytics.trackPerformanceEvent({
            name: "DOMComplete",
            value: domComplete,
            type: "navigation",
          });
        }
      }
    } catch (error) {
      console.warn("Error measuring navigation timing:", error);
    }
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();
