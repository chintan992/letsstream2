import { lazy, ComponentType, LazyExoticComponent } from "react";

/**
 * A wrapper around React.lazy that attempts to reload the page when a chunk fails to load.
 * This is useful for handling Service Worker updates where old chunks might be deleted.
 *
 * @param componentImport The import function for the component (e.g., () => import('./MyComponent'))
 * @returns A React.lazy component
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const lazyLoadWithRetry = <T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
): LazyExoticComponent<T> => {
  return lazy(async () => {
    let pageHasAlreadyBeenForceRefreshed = false;
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        const raw = window.sessionStorage.getItem(
          "page-has-been-force-refreshed"
        );
        pageHasAlreadyBeenForceRefreshed = raw ? JSON.parse(raw) : false;
      }
    } catch {
      pageHasAlreadyBeenForceRefreshed = false;
    }

    try {
      const component = await componentImport();
      if (typeof window !== "undefined" && window.sessionStorage) {
        try {
          window.sessionStorage.setItem(
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
        console.error("Chunk load failed, reloading page...", error);
        if (typeof window !== "undefined" && window.sessionStorage) {
          try {
            window.sessionStorage.setItem(
              "page-has-been-force-refreshed",
              "true"
            );
          } catch {
            // Ignore sessionStorage errors
          }
        }
        if (typeof window !== "undefined") {
          window.location.reload();
          return new Promise<never>(() => {});
        }
        return Promise.reject(
          new Error("Failed to load component after reload")
        );
      }

      console.error("Chunk load failed after reload", error);
      throw error;
    }
  });
};
