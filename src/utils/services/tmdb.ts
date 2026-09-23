import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { TMDB } from "../config/constants";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  promise?: Promise<AxiosResponse<T>>;
}

const cache = new Map<string, CacheEntry<unknown>>();
const pendingRequests = new Map<string, Promise<AxiosResponse<unknown>>>();
const CACHE_TTL = 1000 * 60 * 10; // 10 minutes

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
  if (pending) {
    config.adapter = () => pending as Promise<AxiosResponse>;
    return config;
  }

  return config;
});

tmdb.interceptors.response.use(
  response => {
    const key = generateCacheKey(response.config);
    pendingRequests.delete(key);
    setCachedResponse(key, response.data);
    return response;
  },
  error => {
    const key = generateCacheKey(error.config);
    pendingRequests.delete(key);
    return Promise.reject(error);
  }
);

const originalRequest = tmdb.request.bind(tmdb);
tmdb.request = async (config: AxiosRequestConfig) => {
  const key = generateCacheKey(config);

  const cached = getCachedResponse(key);
  if (cached) {
    return {
      data: cached,
      status: 200,
      statusText: "OK",
      headers: {},
      config,
      request: {},
    } as AxiosResponse;
  }

  let pending = pendingRequests.get(key);
  if (!pending) {
    pending = originalRequest(config)
      .then(response => {
        setCachedResponse(key, response.data);
        return response;
      })
      .finally(() => {
        pendingRequests.delete(key);
      });
    pendingRequests.set(key, pending);
  }

  return pending;
};

export const clearTMDBCache = (): void => {
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
