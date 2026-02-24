import { lazy, ComponentType, LazyExoticComponent } from "react";

/**
 * A wrapper around React.lazy that attempts to reload the page when a chunk fails to load.
 * This is useful for handling Service Worker updates where old chunks might be deleted.
 *
 * @param componentImport The import function for the component (e.g., () => import('./MyComponent'))
 * @returns A React.lazy component
 */
export const lazyLoadWithRetry = <T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
): LazyExoticComponent<T> => {
  return lazy(async () => {
    // Defensive guards for session storage access
    let pageHasAlreadyBeenForceRefreshed = false;
    try {
      if (typeof window !== "undefined" && (window as any).sessionStorage) {
        const raw = (window as any).sessionStorage.getItem(
          "page-has-been-force-refreshed"
        );
        pageHasAlreadyBeenForceRefreshed = raw ? JSON.parse(raw) : false;
      }
    } catch {
      pageHasAlreadyBeenForceRefreshed = false;
    }

    try {
      const component = await componentImport();
      if (typeof window !== "undefined" && (window as any).sessionStorage) {
        try {
          (window as any).sessionStorage.setItem(
            "page-has-been-force-refreshed",
            "false"
          );
        } catch {
          // Ignore sessionStorage errors
        }
      }
      return component;
    } catch (error) {
      if (!pageHasAlreadyBeenForceRefreshed) {
        // Attempt to recover by forcing a page reload once
        console.error("Chunk load failed, reloading page...", error);
        if (typeof window !== "undefined" && (window as any).sessionStorage) {
          try {
            (window as any).sessionStorage.setItem(
              "page-has-been-force-refreshed",
              "true"
            );
          } catch {
            // Ignore sessionStorage errors
          }
        }
        if (typeof window !== "undefined") {
          window.location.reload();
          // Never resolve while the page reloads
          return new Promise<any>(() => {});
        }
        return Promise.reject(
          new Error("Failed to load component after reload")
        );
      }

      // Already retried; bubble the error
      console.error("Chunk load failed after reload", error);
      throw error;
    }
  });
};
