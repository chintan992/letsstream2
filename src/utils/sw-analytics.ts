// Avoid flooding analytics in development
const isDev = process.env.NODE_ENV === "development";

import { swMonitor } from "./sw-monitor";

// Add proper type definitions for Google Analytics
interface GtagParams {
  event_category?: string;
  event_label?: string;
  value?: number;
}

interface Gtag {
  (command: "event", action: string, params: GtagParams): void;
}

interface CustomWindow extends Window {
  gtag?: Gtag;
}

declare let window: CustomWindow;

interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
}

interface PerformanceEvent {
  name: string;
  value: number;
  type: "web-vital" | "custom" | "resource" | "navigation" | "sw-status";
  url?: string;
}

class ServiceWorkerAnalytics {
  private static instance: ServiceWorkerAnalytics;
  private REPORT_INTERVAL = 15 * 60 * 1000; // 15 minutes

  private constructor() {
    this.initializeAnalytics();
  }

  static getInstance(): ServiceWorkerAnalytics {
    if (!ServiceWorkerAnalytics.instance) {
      ServiceWorkerAnalytics.instance = new ServiceWorkerAnalytics();
    }
    return ServiceWorkerAnalytics.instance;
  }

  private initializeAnalytics() {
    // Only initialize in browser environment and production
    if (!isDev && typeof window !== "undefined") {
      // Start periodic reporting
      this.scheduleMetricsReport();

      // Listen for specific events
      if ("addEventListener" in window) {
        window.addEventListener("online", () => {
          this.trackEvent({
            category: "Connectivity",
            action: "Online",
          });
        });

        window.addEventListener("offline", () => {
          this.trackEvent({
            category: "Connectivity",
            action: "Offline",
          });
        });
      }
    }
  }

  private async scheduleMetricsReport() {
    try {
      this.trackEvent({
        category: "Performance",
        action: "NetworkSuccessRate",
        value: Math.round(this.calculateNetworkSuccessRate()),
      });

      // Report web vitals metrics - fix type issue by ensuring numeric values
      const webVitals = await this.getWebVitals();
      Object.entries(webVitals).forEach(([name, value]) => {
        // Ensure value is a number before passing it to trackEvent
        const numericValue = typeof value === "number" ? value : 0;
        this.trackEvent({
          category: "WebVitals",
          action: name,
          value: Math.round(numericValue),
        });
      });

      // Schedule next report
      setTimeout(() => this.scheduleMetricsReport(), this.REPORT_INTERVAL);
    } catch (error) {
      console.error("Error reporting service worker metrics:", error);
    }
  }

  private calculateNetworkSuccessRate(): number {
    const metrics = swMonitor.getNetworkMetrics();
    const totalRequests =
      metrics.successes + metrics.failures + metrics.timeouts;
    return totalRequests ? (metrics.successes / totalRequests) * 100 : 0;
  }

  private async getWebVitals() {
    // Implementation of web vitals collection
    return {};
  }

  trackEvent(event: AnalyticsEvent) {
    try {
      // Send event to your analytics platform, using window.gtag if available
      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", event.action, {
          event_category: event.category,
          event_label: event.label,
          value: event.value,
        });
      } else {
        // Fallback for when gtag is not available - just log to console in development
        if (isDev) {
          console.log("Analytics Event:", event);
        }
      }
    } catch (error) {
      console.error("Error tracking event:", error);
    }
  }

  trackNetworkEvent(success: boolean, url: string) {
    try {
      let hostname = "";
      if (url.startsWith("http")) {
        hostname = new URL(url).hostname;
      } else {
        hostname = "unknown";
      }

      this.trackEvent({
        category: "Network",
        action: success ? "Success" : "Failure",
        label: hostname,
      });
    } catch (error) {
      console.warn("Error tracking network event:", error);
    }
  }

  // Track performance events for web vitals and other metrics
  trackPerformanceEvent(event: PerformanceEvent) {
    this.trackEvent({
      category: "Performance",
      action: event.name,
      value: event.value,
      label: event.url,
    });
  }
}

export const swAnalytics = ServiceWorkerAnalytics.getInstance();
