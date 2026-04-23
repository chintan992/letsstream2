import { StreamResponse, StreamSource } from "@/utils/types/plugin";

/**
 * Build stream URL for movies based on Stremio plugin format
 */
export function buildMovieStreamUrl(baseUrl: string, tmdbId: number): string {
  const cleanBaseUrl = baseUrl.replace(/\/manifest\.json$/, "");
  return `${cleanBaseUrl}/stream/movie/${tmdbId}.json`;
}

/**
 * Build stream URL for TV series based on Stremio plugin format
 */
export function buildSeriesStreamUrl(
  baseUrl: string,
  tmdbId: number,
  season: number,
  episode: number
): string {
  const cleanBaseUrl = baseUrl.replace(/\/manifest\.json$/, "");
  const encodedId = `${tmdbId}%3A${season}%3A${episode}`;
  return `${cleanBaseUrl}/stream/series/${encodedId}.json`;
}

/**
 * Parse and validate stream response from plugin API
 */
export function parseStreamResponse(data: unknown): StreamSource[] {
  if (typeof data !== "object" || data === null) {
    throw new Error("Invalid response: expected object");
  }

  if (!("streams" in data) || !Array.isArray((data as any).streams)) {
    throw new Error("Invalid response: missing streams array");
  }

  const streams = (data as StreamResponse).streams;

  // Validate each stream has required fields
  const validStreams = streams.filter(
    (stream): stream is StreamSource =>
      typeof stream === "object" &&
      stream !== null &&
      typeof (stream as StreamSource).url === "string" &&
      typeof (stream as StreamSource).name === "string" &&
      (stream as StreamSource).url.length > 0
  );

  if (validStreams.length === 0) {
    throw new Error("No valid streaming links found");
  }

  return validStreams;
}

/**
 * Fetch movie streams from a plugin
 */
export async function getMovieStreams(
  pluginBaseUrl: string,
  tmdbId: number
): Promise<StreamSource[]> {
  const url = buildMovieStreamUrl(pluginBaseUrl, tmdbId);

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Plugin returned ${response.status}: ${response.statusText}`
    );
  }

  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("Plugin did not return JSON");
  }

  const data = await response.json();
  return parseStreamResponse(data);
}

/**
 * Fetch TV series streams from a plugin
 */
export async function getSeriesStreams(
  pluginBaseUrl: string,
  tmdbId: number,
  season: number,
  episode: number
): Promise<StreamSource[]> {
  const url = buildSeriesStreamUrl(pluginBaseUrl, tmdbId, season, episode);

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Plugin returned ${response.status}: ${response.statusText}`
    );
  }

  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("Plugin did not return JSON");
  }

  const data = await response.json();
  return parseStreamResponse(data);
}
