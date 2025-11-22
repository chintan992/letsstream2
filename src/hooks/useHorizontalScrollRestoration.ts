import { useEffect, useRef, useCallback } from "react";

export interface HorizontalScrollRestorationOptions {
  enabled?: boolean;
  restoreDelay?: number;
  maxRestoreDelay?: number;
  debounceMs?: number;
}

export const useHorizontalScrollRestoration = (
  elementRef: React.RefObject<HTMLElement>,
  storageKey: string,
  options: HorizontalScrollRestorationOptions = {}
) => {
  const {
    enabled = true,
    restoreDelay = 50,
    maxRestoreDelay = 2000,
    debounceMs = 100,
  } = options;
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restoreTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxRestoreTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  // Non-debounced helper to save scroll position immediately
  const saveScrollPositionImmediate = useCallback(() => {
    if (!enabled || !elementRef.current) return;

    try {
      if (typeof sessionStorage !== "undefined") {
        const position = elementRef.current.scrollLeft;
        sessionStorage.setItem(storageKey, position.toString());
      }
    } catch (error) {
      // Silently handle errors (e.g., privacy mode)
    }
  }, [enabled, elementRef, storageKey]);

  // Debounced function to save scroll position
  const saveScrollPosition = useCallback(
    (manualCall = false) => {
      if (!enabled || !elementRef.current) return;

      // If called manually (from external onScroll), ignore if not enabled
      if (manualCall && !enabled) return;

      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(() => {
        saveScrollPositionImmediate();
      }, debounceMs);
    },
    [enabled, elementRef, debounceMs, saveScrollPositionImmediate]
  );

  // Function to restore scroll position
  const restoreScrollPosition = useCallback(() => {
    if (!enabled || !elementRef.current) return;

    try {
      if (typeof sessionStorage !== "undefined") {
        const savedPosition = sessionStorage.getItem(storageKey);

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
              if (elementRef.current) {
                elementRef.current.scrollLeft = position;
              }

              // Clear the max restore timeout since normal restore executed
              if (maxRestoreTimeoutRef.current) {
                clearTimeout(maxRestoreTimeoutRef.current);
                maxRestoreTimeoutRef.current = null;
              }
            }, restoreDelay);

            // Set up fallback timeout in case content takes longer to load
            maxRestoreTimeoutRef.current = setTimeout(() => {
              console.warn(
                `Horizontal scroll restoration fallback: restoring after ${maxRestoreDelay}ms due to slow content loading`
              );
              if (elementRef.current) {
                elementRef.current.scrollLeft = position;
              }

              // Clear the normal restore timeout since fallback executed
              if (restoreTimeoutRef.current) {
                clearTimeout(restoreTimeoutRef.current);
                restoreTimeoutRef.current = null;
              }
            }, maxRestoreDelay);
          }
        } else {
          // If no position is saved, scroll to left
          // Clear any existing restore timeouts
          if (restoreTimeoutRef.current) {
            clearTimeout(restoreTimeoutRef.current);
          }
          if (maxRestoreTimeoutRef.current) {
            clearTimeout(maxRestoreTimeoutRef.current);
          }

          restoreTimeoutRef.current = setTimeout(() => {
            if (elementRef.current) {
              elementRef.current.scrollLeft = 0;
            }

            // Clear the max restore timeout since normal restore executed
            if (maxRestoreTimeoutRef.current) {
              clearTimeout(maxRestoreTimeoutRef.current);
              maxRestoreTimeoutRef.current = null;
            }
          }, restoreDelay);

          // Set up fallback timeout in case content takes longer to load
          maxRestoreTimeoutRef.current = setTimeout(() => {
            console.warn(
              `Horizontal scroll restoration fallback: restoring after ${maxRestoreDelay}ms due to slow content loading`
            );
            if (elementRef.current) {
              elementRef.current.scrollLeft = 0;
            }

            // Clear the normal restore timeout since fallback executed
            if (restoreTimeoutRef.current) {
              clearTimeout(restoreTimeoutRef.current);
              restoreTimeoutRef.current = null;
            }
          }, maxRestoreDelay);
        }
      } else {
        // If sessionStorage is not available, scroll to left
        if (elementRef.current) {
          elementRef.current.scrollLeft = 0;
        }
      }
    } catch (error) {
      // If there's an error, scroll to left
      if (elementRef.current) {
        elementRef.current.scrollLeft = 0;
      }
    }
  }, [enabled, elementRef, storageKey, restoreDelay, maxRestoreDelay]);

  // Effect to handle scroll position restoration
  useEffect(() => {
    if (!enabled) return;

    // Wait for element to be available before restoring
    if (elementRef.current) {
      restoreScrollPosition();
    } else {
      // If element is not ready, wait for it
      const checkElement = () => {
        if (elementRef.current) {
          restoreScrollPosition();
        } else {
          requestAnimationFrame(checkElement);
        }
      };
      requestAnimationFrame(checkElement);
    }

    // Add beforeunload listener to save position on page refresh (immediate)
    window.addEventListener("beforeunload", saveScrollPositionImmediate);

    // Clean up on unmount
    return () => {
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

      // Save current position before unmounting (immediate)
      saveScrollPositionImmediate();
    };
  }, [
    enabled,
    restoreDelay,
    debounceMs,
    storageKey,
    saveScrollPositionImmediate,
    restoreScrollPosition,
    elementRef,
  ]);

  // Return both restoration function and debounced save function
  return {
    saveScrollPosition,
    restoreScrollPosition,
    saveScrollPositionImmediate,
  };
};
