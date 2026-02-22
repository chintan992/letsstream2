import { VideoSource } from "./types";

interface JsonVideoSource {
  key: string;
  name: string;
  movieUrlPattern: string;
  tvUrlPattern: string;
  isApiSource?: boolean;
  requiresAuth?: boolean;
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

export async function fetchVideoSources(): Promise<VideoSource[]> {
  try {
    const apiUrl = import.meta.env.VITE_VIDEO_SOURCE_API;
    if (!apiUrl) {
      console.error("VITE_VIDEO_SOURCE_API environment variable is not defined");
      return [];
    }

    const response = await fetch(apiUrl, {
      headers: {
        Origin: window.location.origin,
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch video sources: ${response.statusText}`);
    }
    const data = await response.json();
    return (data.sources as JsonVideoSource[]).map(createVideoSource);
  } catch (error) {
    console.error("Error loading video sources:", error);
    return [];
  }
}
