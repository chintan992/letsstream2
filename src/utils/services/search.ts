import { tmdb } from "./tmdb";
import { trackEvent } from "@/lib/analytics";
import { Media } from "../types";
import { TMDBMovieResult, TMDBTVResult } from "../types/tmdb";
import { formatMediaResult } from "./media";

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
