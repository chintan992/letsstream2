// Analytics handling
// Use the logging functions attached to self by sw-logging.js
const log = self.log;

const analyticsQueue = [];

self.initializeAnalytics = function () {
  log("info", "Initializing analytics system");
  return Promise.resolve();
};

self.queueAnalyticsEvent = function (payload) {
  analyticsQueue.push(payload);
  log("debug", "Analytics event queued:", payload);
  // Try to sync if online
  if (self.navigator.onLine) {
    self.syncAnalytics();
  }
};

self.syncAnalytics = function () {
  return Promise.all(
    analyticsQueue.map(payload =>
      fetch(
        "https://www.google-analytics.com/mp/collect?" +
          new URLSearchParams(payload)
      )
        .then(() => {
          const index = analyticsQueue.indexOf(payload);
          if (index > -1) {
            analyticsQueue.splice(index, 1);
          }
          log("debug", "Analytics event sent successfully");
        })
        .catch(error => {
          log("error", "Failed to send analytics event:", error);
        })
    )
  );
};

// Register for background sync
self.addEventListener("sync", event => {
  if (event.tag === "sync-analytics") {
    event.waitUntil(self.syncAnalytics());
  }
});
