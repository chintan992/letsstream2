import React from "react";
import { createRoot, type Root } from "react-dom/client";
import BootError from "./components/BootError";
import { initSecurity } from "./utils/security";
import "./index.css";

// Type for the beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Store the event on the window so React components can access it
window.addEventListener("beforeinstallprompt", e => {
  window.__deferredPWAInstallPrompt = e as BeforeInstallPromptEvent;
});

// Firebase validates its config during module initialization. If any of these
// variables are missing, importing the app throws `auth/invalid-api-key` before
// React can mount, which leaves #root empty and shows a blank page. Check them
// here (with literal `import.meta.env` access so Vite can statically replace
// them) and render an actionable message instead.
const FIREBASE_ENV = {
  VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env
    .VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
};

const missingFirebaseEnv = Object.entries(FIREBASE_ENV)
  .filter(([, value]) => !value)
  .map(([key]) => key);

const rootElement = document.getElementById("root");
let root: Root | null = null;
let bootErrorShown = false;

function render(node: React.ReactNode) {
  if (!rootElement) return;
  root ??= createRoot(rootElement);
  root.render(<React.StrictMode>{node}</React.StrictMode>);
}

function hasRenderedContent() {
  return Boolean(rootElement && rootElement.childElementCount > 0);
}

function renderBootError(title: string, message: string, details?: string) {
  if (hasRenderedContent() || bootErrorShown) return;
  bootErrorShown = true;
  render(<BootError title={title} message={message} details={details} />);
}

function describeError(error: unknown): string {
  if (error instanceof Error) {
    return error.stack || error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return String(error);
  }
}

function installGlobalErrorHandlers() {
  window.addEventListener("error", event => {
    renderBootError(
      "Unable to start Let's Stream",
      "An unexpected error occurred while loading the application.",
      event.error instanceof Error ? describeError(event.error) : event.message
    );
  });

  window.addEventListener("unhandledrejection", event => {
    renderBootError(
      "Unable to start Let's Stream",
      "An unexpected error occurred while loading the application.",
      describeError(event.reason)
    );
  });
}

async function startApp() {
  if (!rootElement) {
    console.error("Root element not found!");
    return;
  }

  if (missingFirebaseEnv.length > 0) {
    renderBootError(
      "Configuration required",
      "This deployment is missing required Firebase environment variables, so the app cannot start. Set the variables below in your hosting provider (for Cloudflare Pages: Settings → Environment variables), then redeploy.",
      missingFirebaseEnv.join("\n")
    );
    return;
  }

  try {
    // Imported dynamically so a failure while evaluating the app's modules is
    // caught and reported instead of producing a blank page.
    const { default: HapticApp } = await import("./HapticApp");
    render(<HapticApp />);
  } catch (error) {
    renderBootError(
      "Unable to start Let's Stream",
      "The application failed to load. Check the deployment build and environment configuration, then try again.",
      describeError(error)
    );
  }
}

installGlobalErrorHandlers();
initSecurity();
void startApp();
