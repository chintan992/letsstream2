// Add type for window property
declare global {
  interface Window {
    __deferredPWAInstallPrompt?: BeforeInstallPromptEvent;
  }
}
import React, { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

// Consider moving this type to a shared types file if reused elsewhere
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const PWAInstallPrompt = ({
  promptTitle = "Install App?",
  promptDescription = "Install this app for offline access and a better experience.",
  installButtonLabel = "Install",
  installedMessage = "The app has been installed successfully!",
  installStartedMessage = "The app installation has started.",
  installCancelledMessage = "You can install the app later from the menu.",
  installFailedMessage = "There was an error installing the app. Please try again.",
}: {
  promptTitle?: string;
  promptDescription?: string;
  installButtonLabel?: string;
  installedMessage?: string;
  installStartedMessage?: string;
  installCancelledMessage?: string;
  installFailedMessage?: string;
}) => {
  const { toast } = useToast();
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(() => {
    // Improve detection: check localStorage and display-mode
    return (
      localStorage.getItem("app-installed") === "true" ||
      window.matchMedia("(display-mode: standalone)").matches
    );
  });
  // In development, show the card by default if not installed/dismissed
  const isDev =
    (typeof process !== "undefined" &&
      process.env &&
      process.env.NODE_ENV === "development") ||
    window.location.hostname === "localhost";
  const [promptVisible, setPromptVisible] = useState(() => {
    if (isDev && !localStorage.getItem("app-installed")) {
      return true;
    }
    return false;
  });
  const [cardDismissed, setCardDismissed] = useState(false);

  // Pick up the global deferred prompt if available (fixes timing issues)
  useEffect(() => {
    if (!deferredPrompt && window.__deferredPWAInstallPrompt) {
      setDeferredPrompt(window.__deferredPWAInstallPrompt);
    }
  }, [deferredPrompt]);

  // Prevent multiple toasts
  // Prevent multiple toasts
  const handleInstallClick = useCallback(async () => {
    console.log("[PWAInstallPrompt] Install button clicked", {
      deferredPrompt,
    });
    if (!deferredPrompt) {
      console.warn(
        "[PWAInstallPrompt] No deferredPrompt available. Install prompt cannot be shown."
      );
      // Fallback for dev mode: show a message if install prompt is unavailable
      toast({
        title: "Install Unavailable",
        description:
          "The install prompt is not available in this environment. In production, this button will trigger the PWA install dialog when eligible.",
        variant: "destructive",
      });
      return;
    }
    try {
      console.log("[PWAInstallPrompt] Calling deferredPrompt.prompt()");
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      console.log("[PWAInstallPrompt] User choice result:", choiceResult);
      if (choiceResult.outcome === "accepted") {
        setIsAppInstalled(true);
        localStorage.setItem("app-installed", "true");
        toast({
          title: "Installation Started",
          description: installStartedMessage,
        });
      } else {
        toast({
          title: "Installation Cancelled",
          description: installCancelledMessage,
        });
      }
      setDeferredPrompt(null);
      setPromptVisible(false);
    } catch (error) {
      console.error("[PWAInstallPrompt] Error during install:", error);
      toast({
        title: "Installation Failed",
        description: installFailedMessage,
        variant: "destructive",
      });
      setPromptVisible(false);
    }
  }, [
    deferredPrompt,
    toast,
    installStartedMessage,
    installCancelledMessage,
    installFailedMessage,
  ]);

  // Show the card only if not dismissed
  const showInstallCard = useCallback(() => {
    if (promptVisible || cardDismissed) return;
    setPromptVisible(true);
  }, [promptVisible, cardDismissed]);

  useEffect(() => {
    // Handler for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isAppInstalled) {
        showInstallCard();
      }
    };

    // Handler for appinstalled
    const handleAppInstalled = (e: Event) => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
      localStorage.setItem("app-installed", "true");
      toast({
        title: "Successfully Installed",
        description: installedMessage,
      });
      setPromptVisible(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // In development, if no deferredPrompt and not installed/dismissed, show the card after a short delay
    if (isDev && !deferredPrompt && !isAppInstalled && !cardDismissed) {
      const timeout = setTimeout(() => {
        setPromptVisible(true);
      }, 1000);
      return () => clearTimeout(timeout);
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [
    toast,
    isAppInstalled,
    showInstallCard,
    installedMessage,
    isDev,
    deferredPrompt,
    cardDismissed,
  ]);

  // Accessibility: aria-live for prompt
  // Card-style popup UI
  if (isAppInstalled || cardDismissed || !promptVisible) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 w-full max-w-xs"
      aria-live="polite"
    >
      <div className="flex animate-fade-in flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-5 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between gap-2">
          <span className="text-base font-semibold text-neutral-900 dark:text-white">
            {promptTitle}
          </span>
          <button
            onClick={() => {
              setCardDismissed(true);
              setPromptVisible(false);
            }}
            className="ml-2 rounded p-1 hover:bg-neutral-100 focus:outline-none dark:hover:bg-neutral-800"
            aria-label="Dismiss install prompt"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M6 6l8 8M6 14L14 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="mb-2 text-sm text-neutral-700 dark:text-neutral-300">
          {promptDescription}
        </div>
        <Button
          variant="default"
          size="lg"
          onClick={handleInstallClick}
          className="hover:bg-primary/90 w-full bg-primary text-primary-foreground"
          aria-label={installButtonLabel}
        >
          {installButtonLabel}
        </Button>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
