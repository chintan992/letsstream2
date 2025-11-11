import { useEffect, useRef } from "react";

/**
 * Hook to manage will-change property for animated elements.
 * Sets will-change before animation starts and removes it after animation completes.
 *
 * @param elementRef - Reference to the DOM element to apply will-change to
 * @param properties - The CSS properties to indicate will-change for (e.g. 'transform, opacity')
 */
export const useAnimationWillChange = (
  elementRef: React.RefObject<HTMLElement>,
  properties: string = "auto"
) => {
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Set will-change when component mounts
    element.style.willChange = properties;

    // Function to remove will-change on animation end
    const handleAnimationEnd = (e: AnimationEvent | TransitionEvent) => {
      // Only reset if this is the animation we're tracking
      if (e.type === "animationend" || e.type === "transitionend") {
        element.style.willChange = "auto";
      }
    };

    // Add event listeners to remove will-change after animation completes
    element.addEventListener("animationend", handleAnimationEnd);
    element.addEventListener("transitionend", handleAnimationEnd);

    // Clean up: remove will-change when component unmounts
    return () => {
      element.removeEventListener("animationend", handleAnimationEnd);
      element.removeEventListener("transitionend", handleAnimationEnd);
      element.style.willChange = "auto";
    };
  }, [elementRef, properties]);
};
