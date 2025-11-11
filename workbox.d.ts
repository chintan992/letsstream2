/// <reference types="@types/workbox-build" />

// Additional types for workbox-build that might not be included in the standard type definitions
declare module "workbox-build" {
  export interface CustomPluginAPI {
    handlerDidError?: (details: {
      request: Request;
    }) => Promise<Response | undefined>;
    cacheWillUpdate?: (details: {
      response: Response;
    }) => Promise<Response | null>;
    cacheDidUpdate?: (details: {
      cacheName: string;
      request: Request;
      oldResponse?: Response;
      newResponse: Response;
    }) => Promise<void>;
    requestWillFetch?: (details: {
      event: FetchEvent & { preloadResponse?: Promise<Response> };
    }) => Promise<Request | Response>;
    fetchDidFail?: (details: any) => Promise<void>;
  }

  export interface RuntimeCaching {
    urlPattern:
      | RegExp
      | string
      | ((options: { url: URL } | { request: Request }) => boolean);
    handler: string;
    options?: {
      cacheName?: string;
      expiration?: {
        maxEntries?: number;
        maxAgeSeconds?: number;
      };
      cacheableResponse?: {
        statuses?: number[];
        headers?: {
          [key: string]: string;
        };
      };
      matchOptions?: {
        ignoreVary?: boolean;
      };
      networkTimeoutSeconds?: number;
      plugins?: Array<Partial<CustomPluginAPI>>;
    };
  }
}
