// Initialize the service worker

// ...existing code...

// Initialize the service worker
export function initializeSW() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      try {
        // Register the main service worker
        const registration = await navigator.serviceWorker.register("/sw.js");
        console.log(
          "Service Worker registered with scope:",
          registration.scope
        );

        // ...existing code...

        // Listen for updates
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.onstatechange = () => {
            if (installingWorker.state === "installed") {
              if (navigator.serviceWorker.controller) {
                console.log("New content is available; please refresh.");
                // You can dispatch an event here to show a notification to the user
                window.dispatchEvent(new CustomEvent("swUpdate"));
              } else {
                console.log("Content is cached for offline use.");
              }
            }
          };
        };
      } catch (error) {
        console.error("Error during service worker registration:", error);
      }
    });
  }
}
