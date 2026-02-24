import { DevToolsDetector } from "developer-tools-detector";

/**
 * Security mechanisms to prevent easy access to the developer console.
 */
let securityClearIntervalId: ReturnType<typeof setInterval> | undefined;
let currentKeydownListener: ((e: KeyboardEvent) => void) | undefined;

export const initSecurity = () => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (
      e.key === "F12" ||
      (e.ctrlKey &&
        e.shiftKey &&
        (e.key === "I" || e.key === "J" || e.key === "C")) ||
      (e.metaKey &&
        e.altKey &&
        (e.key === "I" || e.key === "J" || e.key === "C")) ||
      (e.ctrlKey && e.key === "U") ||
      (e.metaKey && e.altKey && e.key === "U")
    ) {
      e.preventDefault();
      // Note: Chrome and other browsers intentionally ignore preventDefault() for browser-reserved DevTools shortcuts.
    }
  };

  // Prevent common devtools shortcuts
  if (currentKeydownListener) {
    window.removeEventListener("keydown", currentKeydownListener);
  }
  currentKeydownListener = handleKeyDown;
  window.addEventListener("keydown", currentKeydownListener);

  if (securityClearIntervalId) clearInterval(securityClearIntervalId);
  const isDev =
    typeof process !== "undefined" && process.env
      ? process.env.NODE_ENV !== "production"
      : false;

  if (!isDev) {
    securityClearIntervalId = setInterval(() => {
      console.clear();
    }, 1000);
  }

  // Capture the ID specific to THIS initialization call
  const registeredIntervalId = securityClearIntervalId;
  const registeredListener = currentKeydownListener;

  // TODO: Safe DevTools detection can be added here later if needed.

  return () => {
    if (registeredListener) {
      window.removeEventListener("keydown", registeredListener);
      if (currentKeydownListener === registeredListener) {
        currentKeydownListener = undefined;
      }
    }
    if (registeredIntervalId) {
      clearInterval(registeredIntervalId);
      if (securityClearIntervalId === registeredIntervalId) {
        securityClearIntervalId = undefined;
      }
    }
  };
};
