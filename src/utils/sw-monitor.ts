interface NetworkMetrics {
  successes: number;
  failures: number;
  timeouts: number;
}

interface ServiceWorkerDebugMessage {
  type: string;
  clientId: string;
  payload: unknown;
}

class ServiceWorkerMonitor {
  private static instance: ServiceWorkerMonitor;
  private debugMode: boolean = false;
  private clientId: string;
  private networkMetrics = {
    successes: 0,
    failures: 0,
    timeouts: 0,
  };

  private constructor() {
    this.clientId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    this.initializeMonitoring();
  }

  static getInstance(): ServiceWorkerMonitor {
    if (!ServiceWorkerMonitor.instance) {
      ServiceWorkerMonitor.instance = new ServiceWorkerMonitor();
    }
    return ServiceWorkerMonitor.instance;
  }

  private initializeMonitoring() {
    // Only initialize in browser environment
    if (typeof window !== "undefined") {
      // Listen for specific events
      if ("addEventListener" in window) {
        window.addEventListener("online", () => {
          console.log("Network connection restored");
        });

        window.addEventListener("offline", () => {
          console.error("Network connection lost");
        });
      }
    }
  }

  recordNetworkSuccess() {
    this.networkMetrics.successes++;
  }

  recordNetworkFailure() {
    this.networkMetrics.failures++;
  }

  recordNetworkTimeout() {
    this.networkMetrics.timeouts++;
  }

  getNetworkMetrics() {
    return { ...this.networkMetrics };
  }

  setDebugMode(enabled: boolean) {
    this.debugMode = enabled;
  }

  getClientId(): string {
    return this.clientId;
  }

  async unregisterServiceWorker(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const unregistered = await registration.unregister();
      return unregistered;
    } catch (error) {
      console.error("Failed to unregister service worker:", error);
      return false;
    }
  }

  async updateServiceWorker(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();
      return true;
    } catch (error) {
      console.error("Failed to update service worker:", error);
      return false;
    }
  }

  // Debug utility to send a message to the service worker
  async sendDebugMessage(message: ServiceWorkerDebugMessage): Promise<void> {
    if (!this.debugMode) return;

    const registration = await navigator.serviceWorker.ready;
    if (registration.active) {
      registration.active.postMessage(message);
    }
  }

  // Add the missing logAllMetrics method
  logAllMetrics(): void {
    console.log("Service Worker Network Metrics:", this.networkMetrics);
  }

  reset() {
    this.networkMetrics = {
      successes: 0,
      failures: 0,
      timeouts: 0,
    };
  }
}

export const swMonitor = ServiceWorkerMonitor.getInstance();
