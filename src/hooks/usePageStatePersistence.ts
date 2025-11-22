import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Type definition for the setState function that can accept either a new state
 * or a function that takes the previous state and returns a new state
 */
type SetStateAction<T> = React.Dispatch<React.SetStateAction<T>>;

/**
 * Options for the usePageStatePersistence hook
 */
interface UsePageStatePersistenceOptions<T> {
  /**
   * Callback function that validates the restored state
   * Returns true if the state is valid and can be used
   */
  validate?: (state: T) => boolean;
  /**
   * Time in milliseconds to debounce state updates to sessionStorage
   * @default 100
   */
  debounceTime?: number;
  /**
   * Maximum number of entries to keep for this key prefix
   * Older entries will be automatically removed when quota is exceeded
   * @default 10
   */
  maxEntries?: number;
  /**
   * Callback function called when sessionStorage usage exceeds 80% of quota
   * @param usage - Current usage as a percentage (0-1)
   */
  onQuotaWarning?: (usage: number) => void;
}

/**
 * A custom hook that provides state persistence using sessionStorage
 * @param key - The key to use for storing the state in sessionStorage
 * @param initialState - The initial state value
 * @param options - Optional configuration for the hook
 * @returns An array containing [state, setState, clearState]
 */
function usePageStatePersistence<T>(
  key: string,
  initialState: T,
  options?: UsePageStatePersistenceOptions<T>
): [T, SetStateAction<T>, () => void] {
  const {
    validate,
    debounceTime = 100,
    maxEntries = 10,
    onQuotaWarning,
  } = options || {};
  const [state, setState] = useState<T>(() => {
    try {
      const item = window.sessionStorage.getItem(key);
      if (item) {
        const parsedItem = JSON.parse(item);
        // Check if the stored item has the new format with data and timestamp
        const stateToValidate =
          parsedItem.data !== undefined ? parsedItem.data : parsedItem;
        if (!validate || validate(stateToValidate)) {
          return stateToValidate;
        }
      }
    } catch (error) {
      console.warn(
        `Failed to restore state from sessionStorage with key: ${key}`,
        error
      );
    }
    return initialState;
  });

  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  // Function to get current sessionStorage usage percentage
  const getSessionStorageUsage = useCallback((): number => {
    try {
      let totalSize = 0;
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          totalSize += sessionStorage.getItem(key)?.length || 0;
        }
      }
      // Estimate max size (usually ~5-10MB depending on browser)
      // Using 5MB as a conservative estimate
      const estimatedMaxSize = 5 * 1024 * 1024; // 5MB in bytes
      return totalSize / estimatedMaxSize;
    } catch (error) {
      return 0; // Return 0 if we can't determine usage
    }
  }, []);

  // Function to clean up old entries for key prefix
  const cleanupOldEntries = useCallback(
    (keyPrefix: string) => {
      try {
        // Get all keys that match the prefix
        const matchingKeys: string[] = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && key.startsWith(keyPrefix)) {
            matchingKeys.push(key);
          }
        }

        // Sort keys by timestamp if they contain timestamps (format key-timestamp)
        // Otherwise, just keep the first maxEntries keys
        if (maxEntries > 0 && matchingKeys.length > maxEntries) {
          // Remove oldest entries
          const keysToRemove = matchingKeys.slice(
            0,
            matchingKeys.length - maxEntries
          );
          keysToRemove.forEach(k => {
            sessionStorage.removeItem(k);
          });
          console.log(
            `Cleaned up ${keysToRemove.length} old entries for prefix: ${keyPrefix}`
          );
        }
      } catch (error) {
        console.warn(
          `Failed to cleanup old entries for prefix: ${keyPrefix}`,
          error
        );
      }
    },
    [maxEntries]
  );

  // Function to save state to sessionStorage with quota error handling
  const saveState = useCallback(
    (stateToSave: T) => {
      try {
        // Check storage usage and warn if needed
        const usage = getSessionStorageUsage();
        if (usage > 0.8 && onQuotaWarning) {
          onQuotaWarning(usage);
        }

        const serializedState = JSON.stringify({
          data: stateToSave,
          timestamp: Date.now(),
        });

        window.sessionStorage.setItem(key, serializedState);

        // Clean up old entries for this key's prefix if needed
        const keyPrefix = key.split("-").slice(0, -1).join("-") || key; // Remove the last part if it looks like an id
        cleanupOldEntries(keyPrefix);
      } catch (error) {
        if (
          error instanceof DOMException &&
          (error.name === "QuotaExceededError" ||
            error.name === "NS_ERROR_DOM_QUOTA_REACHED")
        ) {
          console.warn(
            `SessionStorage quota exceeded for key: ${key}, attempting cleanup...`
          );

          // Attempt to clean up old entries
          const keyPrefix = key.split("-").slice(0, -1).join("-") || key;
          cleanupOldEntries(keyPrefix);

          try {
            // Try saving again after cleanup
            const serializedState = JSON.stringify({
              data: stateToSave,
              timestamp: Date.now(),
            });
            window.sessionStorage.setItem(key, serializedState);
            console.log(
              `Successfully saved state after cleanup for key: ${key}`
            );
          } catch (retryError) {
            console.error(
              `Failed to save state after cleanup for key: ${key}`,
              retryError
            );
          }
        } else {
          console.warn(
            `Failed to save state to sessionStorage with key: ${key}`,
            error
          );
        }
      }
    },
    [key, getSessionStorageUsage, onQuotaWarning, cleanupOldEntries]
  );

  // Debounced version of saveState
  const debouncedSaveState = useCallback(
    (stateToSave: T) => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }

      timeoutIdRef.current = setTimeout(() => {
        saveState(stateToSave);
      }, debounceTime);
    },
    [saveState, debounceTime]
  );

  // Cleanup function to clear timeout
  const cleanup = useCallback(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  }, []);

  // Effect to save state to sessionStorage when it changes
  useEffect(() => {
    debouncedSaveState(state);

    // Cleanup on unmount
    return () => {
      cleanup();
    };
  }, [state, debouncedSaveState, cleanup]);

  // Effect to save state immediately on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      saveState(state);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [state, saveState]);

  // Function to clear the persisted state
  const clearState = useCallback(() => {
    try {
      window.sessionStorage.removeItem(key);
    } catch (error) {
      console.warn(
        `Failed to clear state from sessionStorage with key: ${key}`,
        error
      );
    }
  }, [key]);

  // Set state function that also triggers persistence via the debounced effect
  const setStateAndPersist = useCallback<SetStateAction<T>>(newState => {
    setState(prevState => {
      const newStateValue =
        typeof newState === "function" ? newState(prevState) : newState;
      return newStateValue;
    });
  }, []);

  return [state, setStateAndPersist, clearState];
}

export default usePageStatePersistence;
