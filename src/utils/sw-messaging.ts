import { swMonitor } from "./sw-monitor";

export function initServiceWorkerMessaging() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", event => {
      const { type } = event.data;

      switch (type) {
        case "NETWORK_SUCCESS":
          swMonitor.recordNetworkSuccess();
          break;
        case "NETWORK_FAILURE":
          swMonitor.recordNetworkFailure();
          break;
        case "NETWORK_TIMEOUT":
          swMonitor.recordNetworkTimeout();
          break;
      }
    });
  }
}

// Function to get metrics summary
export async function getServiceWorkerMetrics() {
  return {
    networkMetrics: swMonitor.getNetworkMetrics(),
    timestamp: Date.now(),
  };
}

// Function to reset metrics
export function resetServiceWorkerMetrics() {
  swMonitor.reset();
}

// Initialize metrics logging interval (every hour)
export function initMetricsLogging(intervalMs = 60 * 60 * 1000) {
  setInterval(() => {
    swMonitor.logAllMetrics();
  }, intervalMs);
}
