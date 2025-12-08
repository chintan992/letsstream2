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
        const pageHasAlreadyBeenForceRefreshed = JSON.parse(
            window.sessionStorage.getItem("page-has-been-force-refreshed") || "false"
        );

        try {
            const component = await componentImport();
            window.sessionStorage.setItem("page-has-been-force-refreshed", "false");
            return component;
        } catch (error) {
            if (!pageHasAlreadyBeenForceRefreshed) {
                // Assuming that the user is not on the latest version of the application.
                // Let's refresh the page immediately.
                console.error("Chunk load failed, reloading page...", error);
                window.sessionStorage.setItem("page-has-been-force-refreshed", "true");
                window.location.reload();
            }

            // The page has already been reloaded
            // Assuming that user is already using the latest version of the application.
            // Let's let the application crash and raise the error.
            console.error("Chunk load failed after reload", error);
            throw error;
        }
    });
};
