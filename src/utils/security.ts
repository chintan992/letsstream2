import { DevToolsDetector } from "developer-tools-detector";

/**
 * Security mechanisms to prevent easy access to the developer console.
 */
let securityClearIntervalId: ReturnType<typeof setInterval> | undefined;
let currentKeydownListener: ((e: KeyboardEvent) => void) | undefined;

export const initSecurity = () => {
  // Disabled for testing
  return () => {};
};
