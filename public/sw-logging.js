// Enhanced logging system
let logLevel = "info";
const LOG_LEVELS = ["error", "warn", "info", "debug"];

const logBuffer = [];
const MAX_LOG_ENTRIES = 1000;

self.initializeLogging = function () {
  log("info", "Initializing logging system");
  return Promise.resolve();
};

self.setLogLevel = function (level) {
  if (LOG_LEVELS.includes(level)) {
    logLevel = level;
    log("info", `Log level set to ${level}`);
  }
};

self.log = function (level, ...args) {
  const levelIndex = LOG_LEVELS.indexOf(level);
  const currentLevelIndex = LOG_LEVELS.indexOf(logLevel);

  if (levelIndex <= currentLevelIndex) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message: args
        .map(arg =>
          typeof arg === "object" ? JSON.stringify(arg) : String(arg)
        )
        .join(" "),
    };

    // Add to buffer
    logBuffer.push(logEntry);
    if (logBuffer.length > MAX_LOG_ENTRIES) {
      logBuffer.shift();
    }

    // Send to all clients
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: "LOG_ENTRY",
          payload: logEntry,
        });
      });
    });

    // Also log to console with appropriate level
    console[level](...args);
  }
};

self.getLogs = function () {
  return [...logBuffer];
};

self.clearLogs = function () {
  logBuffer.length = 0;
  log("info", "Logs cleared");
};
