import { tmdb } from "./tmdb";
import { Media } from "../types";
import { TMDBMovieResult } from "../types/tmdb";
import { formatMediaResult } from "./media";

// Provider IDs
const PROVIDERS = {
  NETFLIX: 8,
  HULU: 15,
  HOTSTAR: 122,
  PRIME: 119,
  PARAMOUNT: 531,
  DISNEY: 337,
  APPLE_TV: 350,
  JIO_CINEMA: 970,
  SONY_LIV: 237,
} as const;

// Helper function for provider content
const getProviderContent = async (
  providerId: number,
  page: number = 1,
  region: string = "US"
): Promise<Media[]> => {
  try {
    const response = await tmdb.get("/discover/movie", {
      params: {
        with_watch_providers: providerId,
        watch_region: region,
        sort_by: "popularity.desc",
        page,
      },
    });
    return response.data.results.map((item: TMDBMovieResult) =>
      formatMediaResult({ ...item, media_type: "movie" })
    );
  } catch (error) {
    console.error(`Error fetching provider ${providerId} content:`, error);
    return [];
  }
};
