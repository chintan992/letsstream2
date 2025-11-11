import { tmdb } from "./tmdb";
import { trackEvent } from "@/lib/analytics";
import { Media } from "../types";
import { TMDBMovieResult, TMDBTVResult } from "../types/tmdb";
import { formatMediaResult } from "./media";

export async function searchAll(query: string, page = 1): Promise<Media[]> {
  const response = await tmdb.get<{
    results: (TMDBMovieResult | TMDBTVResult)[];
  }>("/search/multi", {
    params: { query, page },
  });
  return response.data.results
    .filter(
      result => result.media_type === "movie" || result.media_type === "tv"
    )
    .map(formatMediaResult);
}

export async function searchMovies(query: string, page = 1): Promise<Media[]> {
  const response = await tmdb.get<{ results: TMDBMovieResult[] }>(
    "/search/movie",
    {
      params: { query, page },
    }
  );
  return response.data.results.map(result =>
    formatMediaResult({ ...result, media_type: "movie" })
  );
}

export async function searchTVShows(query: string, page = 1): Promise<Media[]> {
  const response = await tmdb.get<{ results: TMDBTVResult[] }>("/search/tv", {
    params: { query, page },
  });
  return response.data.results.map(result =>
    formatMediaResult({ ...result, media_type: "tv" })
  );
}

// Search for movies and TV shows
export const searchMedia = async (
  query: string,
  page: number = 1
): Promise<Media[]> => {
  try {
    const response = await tmdb.get("/search/multi", {
      params: {
        query: encodeURIComponent(query),
        page,
        include_adult: false,
      },
    });
    return response.data.results
      .filter(
        (item: TMDBMovieResult | TMDBTVResult) =>
          item.media_type === "movie" || item.media_type === "tv"
      )
      .map(formatMediaResult);
  } catch (error) {
    console.error("Error searching media:", error);
    // Log API error to analytics
    await trackEvent({
      name: "api_error",
      params: {
        api: "tmdb/search/multi",
        error: error instanceof Error ? error.message : String(error),
      },
    });
    return [];
  }
};
