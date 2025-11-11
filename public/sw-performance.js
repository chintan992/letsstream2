// Performance metrics tracking

// Use the logging functions attached to self by sw-logging.js
const log = self.log;

let metrics = {
  requestCount: 0,
  totalResponseTime: 0,
  cacheHits: 0,
  cacheMisses: 0,
  errors: 0,
};

self.initializePerformanceTracking = function () {
  log("info", "Initializing performance tracking");
  return Promise.resolve();
};

self.trackRequest = function (url, startTime) {
  metrics.requestCount++;
  return {
    success: responseTime => {
      metrics.totalResponseTime += responseTime;
      log("debug", `Request to ${url} completed in ${responseTime}ms`);
    },
    error: () => {
      metrics.errors++;
      log("error", `Request to ${url} failed`);
    },
    cacheHit: () => {
      metrics.cacheHits++;
      log("debug", `Cache hit for ${url}`);
    },
    cacheMiss: () => {
      metrics.cacheMisses++;
      log("debug", `Cache miss for ${url}`);
    },
  };
};

self.getMetrics = function () {
  return {
    ...metrics,
    averageResponseTime: metrics.requestCount
      ? metrics.totalResponseTime / metrics.requestCount
      : 0,
  };
};

// Reset metrics (e.g., for periodic reporting)
self.resetMetrics = function () {
  metrics = {
    requestCount: 0,
    totalResponseTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
    errors: 0,
  };
};
