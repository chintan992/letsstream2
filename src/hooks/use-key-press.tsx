import { useEffect, useCallback } from "react";

/**
 * A hook that executes a callback when a specific key is pressed
 *
 * @param key - The key to listen for (e.g. "ArrowRight")
 * @param callback - The function to execute when the key is pressed
 * @param preventDefault - Whether to prevent the default action of the key
 */
const useKeyPress = (
  key: string,
  callback: () => void,
  preventDefault: boolean = true
): void => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === key) {
        // Harden Space handling: ignore when an interactive element is focused
        if (key === " ") {
          const active = (document.activeElement as HTMLElement) ?? null;
          const isInteractive =
            !!active &&
            (active.tagName.toUpperCase() === "A" ||
              active.tagName === "BUTTON" ||
              active.tagName === "INPUT" ||
              active.tagName === "SELECT" ||
              active.tagName === "TEXTAREA" ||
              active.isContentEditable ||
              [
                "button",
                "link",
                "tab",
                "menuitem",
                "option",
                "checkbox",
                "radio",
                "switch",
              ].includes((active.getAttribute("role") || "").toLowerCase()));
          if (isInteractive) {
            return;
          }
        }
        if (preventDefault) {
          event.preventDefault();
        }
        callback();
      }
    },
    [key, callback, preventDefault]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);

    // Cleanup function
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);
};

export default useKeyPress;
