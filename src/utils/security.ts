import { DevToolsDetector } from "developer-tools-detector";

/**
 * Security mechanisms to prevent easy access to the developer console.
 */
export const initSecurity = () => {
  // Deprecated: previously blocked context menu for security by default
  // Context menu and keydown blockers removed in favor of proper auth controls.

  // Intercept the fetch call from developer-tools-detector to handle detection gracefully
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    // Debug hook for detection URL
    if (
      typeof args[0] === "string" &&
      args[0].includes("/log-devtools-detected")
    ) {
      // Do not reload the page here; log the event and return a harmless response
      console.debug("DevTools detection intercepted: /log-devtools-detected");
      return new Response("ok");
    }
    try {
      return await originalFetch(...args);
    } catch (err) {
      console.error("Fetch interception error:", err);
      throw err;
    }
  };

  // Initialize the detector
  const detector = new DevToolsDetector(["/"], {
    consoleLog: true, // This triggers the fetch call we intercept
    checkDuration: "always",
    blockIfDetected: false, // We handle blockers manually above
  });

  // The package generates an HTML string meant for backend injection like:
  // <script> (function() { ... })() </script>
  // We need to extract the JavaScript and run it.
  const scriptHtml = detector.getDetectionScript();
  const scriptContentMatch = scriptHtml.match(/<script>([\s\S]*?)<\/script>/i);

  if (scriptContentMatch && scriptContentMatch[1]) {
    const script = document.createElement("script");
    script.textContent = scriptContentMatch[1];
    document.head.appendChild(script);
  }
};
