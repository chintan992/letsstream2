/// <reference lib="webworker" />
/// <reference path="./workbox.d.ts" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";
import pkg from "./package.json";

declare const self: ServiceWorkerGlobalScope;

// Define types for response data
interface TMDBResponse {
  error?: {
    message: string;
  };
  data: unknown;
}

// Cache version based on package version
const CACHE_VERSION = `v${pkg.version}`;

// Cache names with versioning
const CACHE_NAMES = {
  pages: `pages-cache-${CACHE_VERSION}`,
  static: `static-assets-${CACHE_VERSION}`,
  images: `images-cache-${CACHE_VERSION}`,
  tmdbApi: `tmdb-api-${CACHE_VERSION}`,
  tmdbImages: `tmdb-images-${CACHE_VERSION}`,
  firebaseData: `firebase-data-${CACHE_VERSION}`,
  googleApis: `google-apis-${CACHE_VERSION}`,
};

// Import RuntimeCaching type from the workbox-build module
import type { RuntimeCaching } from "workbox-build";

export default defineConfig(({ mode }) => ({
  base: "/",
  server: {
    host: "::",
    port: 8080,
    mimeTypes: {
      ".js": "application/javascript",
      ".json": "application/json",
    },
  },
  build: {
    target: ["es2020", "edge88", "firefox78", "chrome87", "safari14"],
    // Increase the warning limit to reduce unnecessary warnings
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Implement manual chunks to better organize and optimize bundle size
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-components": [
            "@radix-ui/react-accordion",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-aspect-ratio",
            "@radix-ui/react-avatar",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-collapsible",
            "@radix-ui/react-context-menu",
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-hover-card",
            "@radix-ui/react-label",
            "@radix-ui/react-menubar",
            "@radix-ui/react-navigation-menu",
            "@radix-ui/react-popover",
            "@radix-ui/react-progress",
            "@radix-ui/react-radio-group",
            "@radix-ui/react-scroll-area",
            "@radix-ui/react-select",
            "@radix-ui/react-separator",
            "@radix-ui/react-slider",
            "@radix-ui/react-slot",
            "@radix-ui/react-switch",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
            "@radix-ui/react-toggle",
            "@radix-ui/react-toggle-group",
          ],
          "firebase-auth": ["firebase/auth", "@firebase/auth"],
          "data-visualization": ["recharts"],
          icons: ["lucide-react", "react-icons", "react-feather"],
        },
      },
    },
    outDir: "dist",
    emptyOutDir: true,
    // Cloudflare Pages specific output configuration
    cssCodeSplit: false, // Recommended for Cloudflare Pages
  },
  plugins: [
    react(),
    VitePWA({
      strategies: "generateSW",
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.ico",
        "apple-icon-180.png",
        "manifest-icon-192.maskable.png",
        "manifest-icon-512.maskable.png",
        "offline.html",
      ],
      manifest: {
        name: "Let's Stream V2.0",
        short_name: "Let's Stream",
        description: "Watch movies and TV shows online",
        theme_color: "#3b82f6",
        background_color: "#0f0f0f",
        display: "fullscreen",
        display_override: ["fullscreen"],
        scope: "/",
        start_url: "/",
        orientation: "any",
        icons: [
          {
            src: "icons/icon-48x48.png",
            sizes: "48x48",
            type: "image/png",
          },
          {
            src: "icons/icon-72x72.png",
            sizes: "72x72",
            type: "image/png",
          },
          {
            src: "icons/icon-96x96.png",
            sizes: "96x96",
            type: "image/png",
          },
          {
            src: "icons/icon-128x128.png",
            sizes: "128x128",
            type: "image/png",
          },
          {
            src: "icons/icon-144x144.png",
            sizes: "144x144",
            type: "image/png",
          },
          {
            src: "icons/icon-152x152.png",
            sizes: "152x152",
            type: "image/png",
          },
          {
            src: "icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icons/icon-256x256.png",
            sizes: "256x256",
            type: "image/png",
          },
          {
            src: "icons/icon-384x384.png",
            sizes: "384x384",
            type: "image/png",
          },
          {
            src: "icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
        screenshots: [
          {
            src: "/screenshots/1.png",
            sizes: "1280x720",
            type: "image/png",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,json,woff2,ttf}"],
        maximumFileSizeToCacheInBytes: 5000000,
        runtimeCaching: [
          // SPA Navigation Routes
          {
            urlPattern: ({ request }: { request: Request }) =>
              request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: CACHE_NAMES.pages,
              networkTimeoutSeconds: 3,
              plugins: [
                {
                  requestWillFetch: async ({
                    event,
                  }: {
                    event: FetchEvent & { preloadResponse?: Promise<Response> };
                  }) => {
                    try {
                      if (event.preloadResponse) {
                        const preloadResponse = await event.preloadResponse;
                        if (preloadResponse) {
                          return preloadResponse;
                        }
                      }
                      return event.request;
                    } catch (error) {
                      console.error("Error handling preload response:", error);
                      return event.request;
                    }
                  },
                  handlerDidError: async ({
                    request,
                  }: {
                    request: Request;
                  }) => {
                    try {
                      const cache = await self.caches.open(CACHE_NAMES.pages);
                      const response = await cache.match("/offline.html");
                      if (response) return response;

                      // If offline.html is not in cache, try to fetch it
                      const offlineResponse = await fetch("/offline.html");
                      if (offlineResponse.ok) {
                        await cache.put(
                          "/offline.html",
                          offlineResponse.clone()
                        );
                        return offlineResponse;
                      }
                      return undefined;
                    } catch (error) {
                      console.error("Error serving offline page:", error);
                      return undefined;
                    }
                  },
                },
              ],
            },
          },
          // Static Assets
          {
            urlPattern: /\.(css|js|woff2|ttf)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: CACHE_NAMES.static,
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: CACHE_NAMES.images,
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              plugins: [
                {
                  handlerDidError: async ({
                    request,
                  }: {
                    request: Request;
                  }) => {
                    // Return placeholder image on error
                    const cache = await self.caches.open(CACHE_NAMES.static);
                    return cache.match("/placeholder.svg");
                  },
                },
              ],
            },
          },
          {
            urlPattern: /^https:\/\/api\.themoviedb\.org\/3\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: CACHE_NAMES.tmdbApi,
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 1 * 24 * 60 * 60,
              },
              plugins: [
                {
                  cacheWillUpdate: async ({
                    response,
                  }: {
                    response: Response;
                  }) => {
                    if (response && response.status === 200) {
                      try {
                        const clonedResponse = response.clone();
                        const data =
                          (await clonedResponse.json()) as TMDBResponse;
                        // Only cache successful responses without errors
                        if (data && !data.error) {
                          return response;
                        }
                      } catch (error) {
                        console.error("Error parsing TMDB response:", error);
                      }
                    }
                    return null;
                  },
                },
              ],
            },
          },
          {
            urlPattern: /^https:\/\/image\.tmdb\.org\/t\/p\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: CACHE_NAMES.tmdbImages,
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              matchOptions: {
                ignoreVary: true,
              },
              plugins: [
                {
                  handlerDidError: async () => {
                    // Return placeholder image on error
                    const cache = await self.caches.open(CACHE_NAMES.static);
                    return cache.match("/placeholder.svg");
                  },
                },
              ],
            },
          },
          {
            urlPattern: ({ url }: { url: URL }) => {
              return (
                url.hostname.includes("firestore.googleapis.com") ||
                url.hostname.includes("firebase.googleapis.com") ||
                url.hostname.includes("firebaseio.com")
              );
            },
            handler: "NetworkOnly",
            options: {
              plugins: [
                {
                  fetchDidFail: async () => {
                    console.error(
                      "Firebase request failed - network only strategy"
                    );
                  },
                },
              ],
            },
          },
          {
            urlPattern:
              /^https:\/\/(apis\.google\.com|www\.googleapis\.com)\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: CACHE_NAMES.googleApis,
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
              plugins: [
                {
                  handlerDidError: async ({
                    request,
                  }: {
                    request: Request;
                  }) => {
                    console.error("Google API request failed:", request.url);
                    return undefined;
                  },
                },
              ],
            },
          },
        ] as RuntimeCaching[],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        navigationPreload: true,
      },
      devOptions: {
        enabled: true,
        type: "module",
        navigateFallback: "index.html",
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
