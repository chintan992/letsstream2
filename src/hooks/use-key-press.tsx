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
