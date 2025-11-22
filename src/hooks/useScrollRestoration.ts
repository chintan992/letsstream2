import { useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";

export interface ScrollRestorationOptions {
  enabled?: boolean;
  restoreDelay?: number;
  maxRestoreDelay?: number;
  debounceMs?: number;
  storageKey?: string;
}

export const useScrollRestoration = (
  options: ScrollRestorationOptions = {}
) => {
  const {
    enabled = true,
    restoreDelay = 50,
    maxRestoreDelay = 2000,
    debounceMs = 100,
    storageKey = "scroll-positions",
  } = options;

  const location = useLocation();
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restoreTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxRestoreTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  // Non-debounced helper to save scroll position immediately
  const saveScrollPositionImmediate = useCallback(() => {
    if (!enabled) return;

    try {
      if (typeof sessionStorage !== "undefined") {
        const key = `${storageKey}-${location.pathname}`;
        const position = window.scrollY;
        sessionStorage.setItem(key, position.toString());
      }
    } catch (error) {
      // Silently handle errors (e.g., privacy mode)
    }
  }, [enabled, location.pathname, storageKey]);

  // Debounced function to save scroll position
  const saveScrollPosition = useCallback(() => {
    if (!enabled) return;

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      saveScrollPositionImmediate();
    }, debounceMs);
  }, [enabled, debounceMs, saveScrollPositionImmediate]);

  // Function to restore scroll position
  const restoreScrollPosition = useCallback(() => {
    if (!enabled) return;

    try {
      if (typeof sessionStorage !== "undefined") {
        const key = `${storageKey}-${location.pathname}`;
        const savedPosition = sessionStorage.getItem(key);

        if (savedPosition !== null) {
          const position = parseInt(savedPosition, 10);
          if (!isNaN(position)) {
            // Clear any existing restore timeouts
            if (restoreTimeoutRef.current) {
              clearTimeout(restoreTimeoutRef.current);
            }
            if (maxRestoreTimeoutRef.current) {
              clearTimeout(maxRestoreTimeoutRef.current);
            }

            // Set up normal restore timeout
            restoreTimeoutRef.current = setTimeout(() => {
              // Ensure position doesn't exceed document height
              const maxScroll =
                document.documentElement.scrollHeight - window.innerHeight;
              const safePosition = Math.min(position, maxScroll);
              window.scrollTo(0, safePosition);

              // Clear the max restore timeout since normal restore executed
              if (maxRestoreTimeoutRef.current) {
                clearTimeout(maxRestoreTimeoutRef.current);
                maxRestoreTimeoutRef.current = null;
              }
            }, restoreDelay);

            // Set up fallback timeout in case content takes longer to load
            maxRestoreTimeoutRef.current = setTimeout(() => {
              console.warn(
                `Scroll restoration fallback: restoring after ${maxRestoreDelay}ms due to slow content loading`
              );
              // Ensure position doesn't exceed document height
              const maxScroll =
                document.documentElement.scrollHeight - window.innerHeight;
              const safePosition = Math.min(position, maxScroll);
              window.scrollTo(0, safePosition);

              // Clear the normal restore timeout since fallback executed
              if (restoreTimeoutRef.current) {
                clearTimeout(restoreTimeoutRef.current);
                restoreTimeoutRef.current = null;
              }
            }, maxRestoreDelay);
          }
        } else {
          // If no position is saved, scroll to top
          // Clear any existing restore timeouts
          if (restoreTimeoutRef.current) {
            clearTimeout(restoreTimeoutRef.current);
          }
          if (maxRestoreTimeoutRef.current) {
            clearTimeout(maxRestoreTimeoutRef.current);
          }

          restoreTimeoutRef.current = setTimeout(() => {
            window.scrollTo(0, 0);

            // Clear the max restore timeout since normal restore executed
            if (maxRestoreTimeoutRef.current) {
              clearTimeout(maxRestoreTimeoutRef.current);
              maxRestoreTimeoutRef.current = null;
            }
          }, restoreDelay);

          // Set up fallback timeout in case content takes longer to load
          maxRestoreTimeoutRef.current = setTimeout(() => {
            console.warn(
              `Scroll restoration fallback: restoring after ${maxRestoreDelay}ms due to slow content loading`
            );
            window.scrollTo(0, 0);

            // Clear the normal restore timeout since fallback executed
            if (restoreTimeoutRef.current) {
              clearTimeout(restoreTimeoutRef.current);
              restoreTimeoutRef.current = null;
            }
          }, maxRestoreDelay);
        }
      } else {
        // If sessionStorage is not available, scroll to top
        window.scrollTo(0, 0);
      }
    } catch (error) {
      // If there's an error, scroll to top
      window.scrollTo(0, 0);
    }
  }, [enabled, location.pathname, storageKey, restoreDelay, maxRestoreDelay]);

  // Effect to handle scroll position restoration and saving
  useEffect(() => {
    if (!enabled) return;

    // Add scroll event listener to save position (debounced)
    window.addEventListener("scroll", saveScrollPosition, { passive: true });

    // Add beforeunload listener to save position on page refresh (immediate)
    window.addEventListener("beforeunload", saveScrollPositionImmediate);

    // Restore scroll position on component mount
    restoreScrollPosition();

    // Clean up on unmount or when location changes
    return () => {
      // Save current position before unmounting (immediate)
      saveScrollPositionImmediate();

      // Remove event listeners
      window.removeEventListener("scroll", saveScrollPosition);
      window.removeEventListener("beforeunload", saveScrollPositionImmediate);

      // Clear timeouts
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (restoreTimeoutRef.current) {
        clearTimeout(restoreTimeoutRef.current);
      }
      if (maxRestoreTimeoutRef.current) {
        clearTimeout(maxRestoreTimeoutRef.current);
      }
    };
  }, [
    location.pathname,
    enabled,
    restoreDelay,
    debounceMs,
    storageKey,
    saveScrollPosition,
    saveScrollPositionImmediate,
    restoreScrollPosition,
  ]);
};
