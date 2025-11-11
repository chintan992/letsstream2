// Network condition simulation

// Use the logging functions attached to self by sw-logging.js
const log = self.log;

let networkConditions = {
  latency: 0,
  downloadThroughput: Infinity,
  uploadThroughput: Infinity,
  offline: false,
};

self.initializeNetworkSimulation = function () {
  log("info", "Initializing network simulation");
  return Promise.resolve();
};

self.setNetworkConditions = function (conditions) {
  networkConditions = {
    ...networkConditions,
    ...conditions,
  };
  log("info", "Network conditions updated:", networkConditions);
};

// Simulate network conditions for a request
self.simulateNetworkConditions = function (request) {
  if (networkConditions.offline) {
    return Promise.reject(new Error("Network is offline"));
  }

  return new Promise((resolve, reject) => {
    // Simulate latency
    setTimeout(() => {
      fetch(request)
        .then(response => {
          // Simulate throughput limitations
          if (
            response.body &&
            networkConditions.downloadThroughput < Infinity
          ) {
            // Implementation of throttled response
            const reader = response.body.getReader();
            const stream = new ReadableStream({
              async start(controller) {
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;

                  // Calculate delay based on throughput
                  const delay =
                    ((value.length * 8) /
                      networkConditions.downloadThroughput) *
                    1000;
                  await new Promise(r => setTimeout(r, delay));

                  controller.enqueue(value);
                }
                controller.close();
              },
            });

            resolve(
              new Response(stream, {
                headers: response.headers,
                status: response.status,
                statusText: response.statusText,
              })
            );
          } else {
            resolve(response);
          }
        })
        .catch(reject);
    }, networkConditions.latency);
  });
};
