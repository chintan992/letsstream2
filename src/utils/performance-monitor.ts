import { swAnalytics } from "./sw-analytics";
import * as webVitals from "web-vitals";

type VitalMetric = {
  name: string;
  value: number;
  delta: number;
  id: string;
  entries: PerformanceEntry[];
};

export interface WebVitalData {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  timestamp: number;
}

type WebVitalsSubscriber = (vitals: WebVitalData[]) => void;

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private marks: Record<string, number> = {};
  private isEnabled: boolean;
  private reportedMetrics: Set<string> = new Set();
  private webVitalsData: Map<string, WebVitalData> = new Map();
  private subscribers: Set<WebVitalsSubscriber> = new Set();

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

  private getRating(
    name: string,
    value: number
  ): "good" | "needs-improvement" | "poor" {
    // Thresholds based on web.dev recommendations
    const thresholds: Record<string, [number, number]> = {
      CLS: [0.1, 0.25],
      FID: [100, 300],
      LCP: [2500, 4000],
      TTFB: [800, 1800],
      FCP: [1800, 3000],
      INP: [200, 500],
    };

    const [good, poor] = thresholds[name] || [0, 0];
    if (value <= good) return "good";
    if (value <= poor) return "needs-improvement";
    return "poor";
  }

  private notifySubscribers() {
    const vitals = this.getWebVitals();
    this.subscribers.forEach(subscriber => subscriber(vitals));
  }

  private reportWebVital(metric: VitalMetric) {
    // Avoid duplicate reporting for the same metric ID
    if (this.reportedMetrics.has(metric.id)) return;
    this.reportedMetrics.add(metric.id);

    console.log(`Web Vital: ${metric.name} = ${metric.value}`);

    // Store the web vital data for the debug panel
    const vitalData: WebVitalData = {
      name: metric.name,
      value: metric.name === "CLS" ? metric.value * 1000 : metric.value,
      rating: this.getRating(metric.name, metric.value),
      timestamp: Date.now(),
    };
    this.webVitalsData.set(metric.name, vitalData);
    this.notifySubscribers();

    swAnalytics.trackPerformanceEvent({
      name: metric.name,
      value: Math.round(
        metric.name === "CLS" ? metric.value * 1000 : metric.value
      ),
      type: "web-vital",
    });
  }

  getWebVitals(): WebVitalData[] {
    return Array.from(this.webVitalsData.values());
  }

  subscribeToWebVitals(callback: WebVitalsSubscriber): () => void {
    this.subscribers.add(callback);
    // Immediately call with current data
    callback(this.getWebVitals());
    return () => this.unsubscribeFromWebVitals(callback);
  }

  unsubscribeFromWebVitals(callback: WebVitalsSubscriber) {
    this.subscribers.delete(callback);
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
