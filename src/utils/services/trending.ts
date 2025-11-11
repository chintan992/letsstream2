import { tmdb } from "./tmdb";
import { Media } from "../types";
import { TMDBMovieResult, TMDBTVResult } from "../types/tmdb";
import { formatMediaResult } from "./media";

// Get trending movies and TV shows
export async function getTrending(
  timeWindow: "day" | "week" = "week",
  page = 1
): Promise<Media[]> {
  try {
    const [moviesResponse, tvShowsResponse] = await Promise.all([
      tmdb.get<{ results: TMDBMovieResult[] }>(
        `/trending/movie/${timeWindow}`,
        {
          params: { page },
        }
      ),
      tmdb.get<{ results: TMDBTVResult[] }>(`/trending/tv/${timeWindow}`, {
        params: { page },
      }),
    ]);

    // Combine and format all results
    const movies = moviesResponse.data.results.map(item =>
      formatMediaResult({ ...item, media_type: "movie" })
    );
    const tvShows = tvShowsResponse.data.results.map(item =>
      formatMediaResult({ ...item, media_type: "tv" })
    );

    // Merge and sort by popularity (vote_average)
    const combined = [...movies, ...tvShows]
      .sort((a, b) => b.vote_average - a.vote_average)
      // Take top ITEMS_PER_PAGE items to maintain consistent pagination
      .slice(0, 20);

    return combined;
  } catch (error) {
    console.error("Error fetching trending content:", error);
    return [];
  }
}
