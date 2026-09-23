import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { TMDB } from "../config/constants";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  promise?: Promise<AxiosResponse<T>>;
}

interface PendingRequest {
  promise: Promise<AxiosResponse<unknown>>;
  generation: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const pendingRequests = new Map<string, PendingRequest>();
const requestGenerations = new WeakMap<object, number>();
let cacheGeneration = 0;
const CACHE_TTL = 1000 * 60 * 10; // 10 minutes
const MAX_CACHE_ENTRIES = 100;

function generateCacheKey(config: AxiosRequestConfig): string {
  const { url = "", method = "get", params, data } = config;
  return `${method.toUpperCase()}:${url}:${JSON.stringify(params)}:${JSON.stringify(data)}`;
}

function getCachedResponse<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;

  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

function setCachedResponse<T>(key: string, data: T): void {
  cache.delete(key);
  while (cache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey === undefined) break;
    cache.delete(oldestKey);
  }
  cache.set(key, { data, timestamp: Date.now() });
}

export const tmdb = axios.create({
  baseURL: TMDB.BASE_URL,
  params: {
    api_key: TMDB.API_KEY,
    language: "en-US",
  },
});

tmdb.interceptors.request.use(config => {
  const key = generateCacheKey(config);
  const generation = cacheGeneration;
  requestGenerations.set(config, generation);

  const cached = getCachedResponse(key);
  if (cached) {
    config.adapter = () =>
      Promise.resolve({
        data: cached,
        status: 200,
        statusText: "OK",
        headers: {},
        config,
        request: {},
      } as AxiosResponse);
    return config;
  }

  const pending = pendingRequests.get(key);
  if (pending && pending.generation === generation) {
    config.adapter = () => pending.promise as Promise<AxiosResponse>;
    return config;
  }

  let resolvePending!: (response: AxiosResponse<unknown>) => void;
  let rejectPending!: (error: unknown) => void;
  const pendingPromise = new Promise<AxiosResponse<unknown>>(
    (resolve, reject) => {
      resolvePending = resolve;
      rejectPending = reject;
    }
  );
  void pendingPromise.catch(() => undefined);
  pendingRequests.set(key, { promise: pendingPromise, generation });

  const adapter = axios.getAdapter(config.adapter);
  config.adapter = async adapterConfig => {
    try {
      const response = await adapter(adapterConfig);
      resolvePending(response);
      return response;
    } catch (error) {
      rejectPending(error);
      throw error;
    }
  };

  return config;
});

tmdb.interceptors.response.use(
  response => {
    const key = generateCacheKey(response.config);
    const requestGeneration = requestGenerations.get(response.config);
    const pending = pendingRequests.get(key);
    if (
      requestGeneration !== undefined &&
      pending?.generation === requestGeneration
    ) {
      pendingRequests.delete(key);
      setCachedResponse(key, response.data);
    }
    return response;
  },
  error => {
    if (error.config) {
      const key = generateCacheKey(error.config);
      const pending = pendingRequests.get(key);
      const requestGeneration = requestGenerations.get(error.config);
      if (
        requestGeneration !== undefined &&
        pending?.generation === requestGeneration
      ) {
        pendingRequests.delete(key);
      }
    }
    return Promise.reject(error);
  }
);

export const clearTMDBCache = (): void => {
  cacheGeneration += 1;
  cache.clear();
  pendingRequests.clear();
};

export const getImageUrl = (
  path: string | null,
  size: string
): string | null => {
  if (!path) return null;
  return `${TMDB.IMAGE_BASE_URL}/${size}${path}`;
};

export const getResponsiveImageUrls = (
  path: string | null
): { srcset: string; sizes: string } | null => {
  if (!path) return null;

  const baseSizes = [92, 154, 185, 342, 500, 780, 1280];
  const sizes = "(max-width: 640px) 154px, (max-width: 1024px) 342px, 500px";

  const srcset = baseSizes
    .map(size => `${TMDB.IMAGE_BASE_URL}/w${size}${path} ${size}w`)
    .join(", ");

  return { srcset, sizes };
};
