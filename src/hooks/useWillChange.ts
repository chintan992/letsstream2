import { useEffect, useRef, useCallback } from "react";

/**
 * Comprehensive hook to manage will-change property for performance optimization.
 * Sets will-change before animation starts and removes it after animation completes,
 * handling both infinite animations and temporary transitions.
 *
 * @param elementRef - Ref to the DOM element that will be animated
 * @param properties - CSS properties to apply will-change for (e.g., 'transform, opacity')
 * @param options - Configuration options including animation type and cleanup behavior
 */
export const useWillChange = (
  elementRef: React.RefObject<HTMLElement>,
  properties: string,
  options: {
    animationName?: string; // Name of CSS animation to watch for
    animationDuration?: number; // Duration in ms for temporary animations (not infinite)
    idleTimeout?: number; // Timeout in ms to remove will-change when no user interaction occurs (for infinite animations)
    cleanupOnUnmount?: boolean; // Whether to cleanup will-change on unmount (default: true)
    respectReducedMotion?: boolean; // Whether to respect prefers-reduced-motion (default: true)
  } = {}
) => {
  const {
    animationName,
    animationDuration,
    idleTimeout = 500, // Default 500ms idle timeout for infinite animations
    cleanupOnUnmount = true,
    respectReducedMotion = true,
  } = options;

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if reduced motion is preferred
  const getReducedMotion = useCallback(() => {
    if (typeof window !== "undefined" && respectReducedMotion) {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    return false;
  }, [respectReducedMotion]);

  // Apply will-change
  const setWillChange = useCallback(() => {
    if (getReducedMotion()) return;

    const element = elementRef.current;
    if (element) {
      element.style.willChange = properties;
    }
  }, [elementRef, properties, getReducedMotion]);

  // Remove will-change
  const removeWillChange = useCallback(() => {
    const element = elementRef.current;
    if (element) {
      element.style.willChange = "auto";
    }

    // Clear any pending timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = null;
    }
  }, [elementRef]);

  useEffect(() => {
    if (getReducedMotion()) return;

    const element = elementRef.current;
    if (!element) return;

    // For temporary animations, set and unset after duration
    if (animationDuration && animationDuration > 0) {
      setWillChange();

      // Set timeout to remove will-change after animation completes
      timeoutRef.current = setTimeout(() => {
        removeWillChange();
      }, animationDuration + 50); // Add 50ms buffer

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        if (cleanupOnUnmount) {
          removeWillChange();
        }
      };
    }

    // For infinite animations, use idle timeout to manage will-change
    if (animationName && !animationDuration) {
      setWillChange();

      // Set idle timeout to remove will-change after inactivity
      const resetIdleTimeout = () => {
        if (idleTimeoutRef.current) {
          clearTimeout(idleTimeoutRef.current);
        }
        idleTimeoutRef.current = setTimeout(() => {
          removeWillChange();
        }, idleTimeout);
      };

      // Start the initial idle timeout
      resetIdleTimeout();

      // For infinite animations, we can't rely on animationend events
      // So we'll use intersection observer to manage visibility and idle timeout
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        if (idleTimeoutRef.current) {
          clearTimeout(idleTimeoutRef.current);
          idleTimeoutRef.current = null;
        }
        if (cleanupOnUnmount) {
          removeWillChange();
        }
      };
    }

    // For finite animations with specific animationName
    if (animationName && animationDuration) {
      setWillChange();

      const handleAnimationEnd = (e: AnimationEvent) => {
        if (e.animationName.includes(animationName.split(",")[0].trim())) {
          removeWillChange();
        }
      };

      const handleTransitionEnd = (e: TransitionEvent) => {
        if (e.propertyName.includes(animationName.split(",")[0].trim())) {
          removeWillChange();
        }
      };

      // Add event listeners
      element.addEventListener(
        "animationend",
        handleAnimationEnd as EventListener,
        { passive: true }
      );
      element.addEventListener(
        "transitionend",
        handleTransitionEnd as EventListener,
        { passive: true }
      );

      return () => {
        // Remove event listeners
        element.removeEventListener(
          "animationend",
          handleAnimationEnd as EventListener
        );
        element.removeEventListener(
          "transitionend",
          handleTransitionEnd as EventListener
        );

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        if (idleTimeoutRef.current) {
          clearTimeout(idleTimeoutRef.current);
          idleTimeoutRef.current = null;
        }
        if (cleanupOnUnmount) {
          removeWillChange();
        }
      };
    } else {
      // For manual control without animation events, only cleanup on unmount
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        if (idleTimeoutRef.current) {
          clearTimeout(idleTimeoutRef.current);
          idleTimeoutRef.current = null;
        }
        if (cleanupOnUnmount) {
          removeWillChange();
        }
      };
    }
  }, [
    elementRef,
    properties,
    animationName,
    animationDuration,
    idleTimeout,
    cleanupOnUnmount,
    removeWillChange,
    setWillChange,
    getReducedMotion,
  ]);

  // Reset idle timeout when needed (for infinite animations)
  const resetIdleTimeout = useCallback(() => {
    if (
      options.animationName &&
      !options.animationDuration &&
      !getReducedMotion()
    ) {
      setWillChange();

      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }

      idleTimeoutRef.current = setTimeout(() => {
        removeWillChange();
      }, idleTimeout);
    }
  }, [
    options.animationName,
    options.animationDuration,
    idleTimeout,
    getReducedMotion,
    setWillChange,
    removeWillChange,
  ]);

  // Handle intersection observer for elements that should only have will-change when visible
  const setupVisibilityHandler = useCallback(
    (callback: (isVisible: boolean) => void) => {
      if (getReducedMotion()) return () => {};

      const element = elementRef.current;
      if (!element) return () => {};

      let observer: IntersectionObserver | null = null;

      if (typeof IntersectionObserver !== "undefined") {
        observer = new IntersectionObserver(
          entries => {
            entries.forEach(entry => {
              const isVisible = entry.isIntersecting;
              callback(isVisible);

              if (isVisible) {
                // When element becomes visible, reset idle timeout to apply will-change
                if (options.animationName && !options.animationDuration) {
                  resetIdleTimeout();
                }
              }
            });
          },
          { threshold: 0.1 } // Trigger when 10% visible
        );

        observer.observe(element);
      }

      return () => {
        if (observer) {
          observer.disconnect();
        }

        if (idleTimeoutRef.current) {
          clearTimeout(idleTimeoutRef.current);
          idleTimeoutRef.current = null;
        }
      };
    },
    [
      elementRef,
      getReducedMotion,
      options.animationName,
      options.animationDuration,
      resetIdleTimeout,
    ]
  );

  // Handle user interaction events to reset idle timeout
  const setupInteractionHandler = useCallback(
    (element: HTMLElement) => {
      if (
        getReducedMotion() ||
        !options.animationName ||
        options.animationDuration
      )
        return () => {};

      const handleInteraction = () => {
        resetIdleTimeout();
      };

      // Add event listeners for potential user interactions
      element.addEventListener("mouseenter", handleInteraction);
      element.addEventListener("focus", handleInteraction);
      element.addEventListener("mousedown", handleInteraction);
      element.addEventListener("touchstart", handleInteraction);

      return () => {
        element.removeEventListener("mouseenter", handleInteraction);
        element.removeEventListener("focus", handleInteraction);
        element.removeEventListener("mousedown", handleInteraction);
        element.removeEventListener("touchstart", handleInteraction);
      };
    },
    [
      getReducedMotion,
      options.animationName,
      options.animationDuration,
      resetIdleTimeout,
    ]
  );

  return {
    setWillChange,
    removeWillChange,
    resetIdleTimeout,
    setupVisibilityHandler,
    setupInteractionHandler,
    isReducedMotion: getReducedMotion(),
  };
};
