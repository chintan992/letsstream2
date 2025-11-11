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

// Netflix (provider id: 8)
export const getNetflixContent = (page: number = 1) =>
  getProviderContent(PROVIDERS.NETFLIX, page);

// Hulu (provider id: 15)
export const getHuluContent = (page: number = 1) =>
  getProviderContent(PROVIDERS.HULU, page);

// Prime Video (provider id: 119)
export const getPrimeContent = (page: number = 1) =>
  getProviderContent(PROVIDERS.PRIME, page);

// Paramount+ (provider id: 531)
export const getParamountContent = (page: number = 1) =>
  getProviderContent(PROVIDERS.PARAMOUNT, page);

// Disney+ (provider id: 337)
export const getDisneyContent = (page: number = 1) =>
  getProviderContent(PROVIDERS.DISNEY, page);

// Hotstar (provider id: 122)
export const getHotstarContent = (page: number = 1) =>
  getProviderContent(PROVIDERS.HOTSTAR, page, "IN");

// Apple TV+ (provider id: 350)
export const getAppleTVContent = (page: number = 1) =>
  getProviderContent(PROVIDERS.APPLE_TV, page);

// JioCinema (provider id: 970)
export const getJioCinemaContent = (page: number = 1) =>
  getProviderContent(PROVIDERS.JIO_CINEMA, page, "IN");

// Sony Liv (provider id: 237)
export const getSonyLivContent = (page: number = 1) =>
  getProviderContent(PROVIDERS.SONY_LIV, page, "IN");
