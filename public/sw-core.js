// Core service worker functionality
// All dependencies are attached to self by their respective files
const log = self.log;
const initializeLogging = self.initializeLogging;
const initializePerformanceTracking = self.initializePerformanceTracking;
const initializeNetworkSimulation = self.initializeNetworkSimulation;
const initializeAnalytics = self.initializeAnalytics;

// Initialize all modules
self.addEventListener("install", event => {
  log("info", "Service Worker installing");
  event.waitUntil(
    Promise.all([
      initializeLogging(),
      initializePerformanceTracking(),
      initializeNetworkSimulation(),
      initializeAnalytics(),
      caches.open("v1").then(cache => {
        return cache.addAll([
          "/",
          "/index.html",
          "/offline.html",
          "/favicon.ico",
        ]);
      }),
    ])
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  log("info", "Service Worker activating");
  event.waitUntil(self.clients.claim());
});

// Message handling from debug panel
self.addEventListener("message", event => {
  const { type, payload } = event.data;
  switch (type) {
    case "SET_LOG_LEVEL":
      self.setLogLevel(payload.level);
      break;
    case "SET_NETWORK_CONDITIONS":
      self.setNetworkConditions(payload);
      break;
    default:
      // Forward to appropriate module based on message type
      break;
  }
});
