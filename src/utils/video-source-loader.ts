import { VideoSource } from "./types";

const VIDEO_SOURCES_CACHE_KEY = "video_sources_cache";
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

interface JsonVideoSource {
  key: string;
  name: string;
  movieUrlPattern: string;
  tvUrlPattern: string;
  isApiSource?: boolean;
  requiresAuth?: boolean;
}

interface CachedVideoSources {
  sources: JsonVideoSource[];
  timestamp: number;
  endpoint: string;
}

function createVideoSource(source: JsonVideoSource): VideoSource {
  return {
    key: source.key,
    name: source.name,
    isApiSource: source.isApiSource || false,
    requiresAuth: source.requiresAuth || false,
    getMovieUrl: (id: number) =>
      source.movieUrlPattern.replace("{id}", id.toString()),
    getTVUrl: (id: number, season: number, episode: number) =>
      source.tvUrlPattern
        .replace("{id}", id.toString())
        .replace("{season}", season.toString())
        .replace("{episode}", episode.toString()),
  };
}

function getCachedSources(): VideoSource[] | null {
  try {
    const endpoint = import.meta.env.VITE_VIDEO_SOURCE_API;
    if (!endpoint) return null;
    const cached = localStorage.getItem(VIDEO_SOURCES_CACHE_KEY);
    if (!cached) return null;

    const parsed: CachedVideoSources = JSON.parse(cached);
    const now = Date.now();

    if (
      !Number.isFinite(parsed.timestamp) ||
      parsed.timestamp < now - CACHE_TTL ||
      parsed.timestamp > now ||
      parsed.endpoint !== endpoint
    ) {
      localStorage.removeItem(VIDEO_SOURCES_CACHE_KEY);
      return null;
    }

    return parsed.sources.map(createVideoSource);
  } catch (error) {
    console.error("Error reading video sources cache:", error);
    try {
      localStorage.removeItem(VIDEO_SOURCES_CACHE_KEY);
    } catch (removeError) {
      console.error("Error removing video sources cache:", removeError);
    }
    return null;
  }
}

function setCachedSources(sources: JsonVideoSource[], endpoint: string): void {
  try {
    const data: CachedVideoSources = {
      sources,
      timestamp: Date.now(),
      endpoint,
    };
    localStorage.setItem(VIDEO_SOURCES_CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Error saving video sources cache:", error);
  }
}

export async function fetchVideoSources(): Promise<VideoSource[]> {
  const apiUrl = import.meta.env.VITE_VIDEO_SOURCE_API;
  if (!apiUrl) {
    console.error("VITE_VIDEO_SOURCE_API environment variable is not defined");
    return [];
  }

  const cached = getCachedSources();
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(apiUrl, {
      headers: {
        Origin: window.location.origin,
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch video sources: ${response.statusText}`);
    }
    const data = await response.json();
    const sources = (data.sources as JsonVideoSource[]).map(createVideoSource);
    setCachedSources(data.sources as JsonVideoSource[], apiUrl);
    return sources;
  } catch (error) {
    console.error("Error loading video sources:", error);
    return [];
  }
}

export function clearVideoSourcesCache(): void {
  try {
    localStorage.removeItem(VIDEO_SOURCES_CACHE_KEY);
  } catch (error) {
    console.error("Error removing video sources cache:", error);
  }
}

export function preloadVideoSources(): Promise<VideoSource[]> | null {
  const cached = getCachedSources();
  if (cached) {
    return Promise.resolve(cached);
  }
  return fetchVideoSources();
}
