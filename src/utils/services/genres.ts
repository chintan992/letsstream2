import { tmdb } from "./tmdb";
import { Media } from "../types";
import { TMDBMovieResult } from "../types/tmdb";
import { formatMediaResult } from "./media";

// Genre IDs
const GENRES = {
  ACTION: 28,
  DRAMA: 18,
  COMEDY: 35,
  HORROR: 27,
  ROMANCE: 10749,
  SCIFI: 878,
  THRILLER: 53,
  ANIMATION: 16,
  FAMILY: 10751,
  DOCUMENTARY: 99,
  MYSTERY: 9648,
  FANTASY: 14,
} as const;

// Helper function for genre content
const getGenreContent = async (
  genreId: number,
  page: number = 1
): Promise<Media[]> => {
  try {
    const response = await tmdb.get("/discover/movie", {
      params: {
        with_genres: genreId,
        sort_by: "popularity.desc",
        page,
      },
    });
    return response.data.results.map((item: TMDBMovieResult) =>
      formatMediaResult({ ...item, media_type: "movie" })
    );
  } catch (error) {
    console.error(`Error fetching genre ${genreId} content:`, error);
    return [];
  }
};

// Action movies (genre id: 28)
export const getActionMovies = (page: number = 1) =>
  getGenreContent(GENRES.ACTION, page);
// Drama movies (genre id: 18)
export const getDramaMovies = (page: number = 1) =>
  getGenreContent(GENRES.DRAMA, page);
// Comedy movies (genre id: 35)
export const getComedyMovies = (page: number = 1) =>
  getGenreContent(GENRES.COMEDY, page);
// Horror movies (genre id: 27)
export const getHorrorMovies = (page: number = 1) =>
  getGenreContent(GENRES.HORROR, page);
// Romance movies (genre id: 10749)
export const getRomanceMovies = (page: number = 1) =>
  getGenreContent(GENRES.ROMANCE, page);
// Sci-Fi movies (genre id: 878)
export const getSciFiMovies = (page: number = 1) =>
  getGenreContent(GENRES.SCIFI, page);
// Thriller movies (genre id: 53)
export const getThrillerMovies = (page: number = 1) =>
  getGenreContent(GENRES.THRILLER, page);
// Animation movies (genre id: 16)
export const getAnimationMovies = (page: number = 1) =>
  getGenreContent(GENRES.ANIMATION, page);
// Family movies (genre id: 10751)
export const getFamilyMovies = (page: number = 1) =>
  getGenreContent(GENRES.FAMILY, page);
// Documentary movies (genre id: 99)
export const getDocumentaryMovies = (page: number = 1) =>
  getGenreContent(GENRES.DOCUMENTARY, page);
// Mystery movies (genre id: 9648)
export const getMysteryMovies = (page: number = 1) =>
  getGenreContent(GENRES.MYSTERY, page);
// Fantasy movies (genre id: 14)
export const getFantasyMovies = (page: number = 1) =>
  getGenreContent(GENRES.FANTASY, page);

// Bollywood: Hindi language movies (India)
export const getBollywoodMovies = async (
  page: number = 1
): Promise<Media[]> => {
  try {
    const response = await tmdb.get("/discover/movie", {
      params: {
        with_original_language: "hi",
        region: "IN",
        sort_by: "popularity.desc",
        page,
      },
    });
    return response.data.results.map((item: TMDBMovieResult) =>
      formatMediaResult({ ...item, media_type: "movie" })
    );
  } catch (error) {
    console.error("Error fetching Bollywood movies:", error);
    return [];
  }
};

// --- Thematic/Curated Rows ---
export const getRecentlyAdded = async (page: number = 1): Promise<Media[]> => {
  try {
    const response = await tmdb.get("/discover/movie", {
      params: {
        sort_by: "release_date.desc",
        page,
      },
    });
    return response.data.results.map((item: TMDBMovieResult) =>
      formatMediaResult({ ...item, media_type: "movie" })
    );
  } catch (error) {
    console.error("Error fetching Recently Added:", error);
    return [];
  }
};

export const getAwardWinners = async (page: number = 1): Promise<Media[]> => {
  // TMDB does not have a direct filter for award winners; this is a placeholder (could use vote_average or a custom list)
  try {
    const response = await tmdb.get("/discover/movie", {
      params: {
        "vote_average.gte": 8,
        "vote_count.gte": 1000,
        sort_by: "vote_average.desc",
        page,
      },
    });
    return response.data.results.map((item: TMDBMovieResult) =>
      formatMediaResult({ ...item, media_type: "movie" })
    );
  } catch (error) {
    console.error("Error fetching Award Winners:", error);
    return [];
  }
};

export const getCriticallyAcclaimed = getAwardWinners;

export const getEditorsPicks = getAwardWinners; // Placeholder, could be a custom curated list

export const getMostWatchedThisWeek = async (
  page: number = 1
): Promise<Media[]> => {
  // TMDB does not provide direct viewership data; using popularity as an estimate
  try {
    const response = await tmdb.get("/discover/movie", {
      params: {
        sort_by: "popularity.desc",
        page,
      },
    });
    return response.data.results.map((item: TMDBMovieResult) =>
      formatMediaResult({ ...item, media_type: "movie" })
    );
  } catch (error) {
    console.error("Error fetching Most Watched This Week:", error);
    return [];
  }
};

export const getHiddenGems = async (page: number = 1): Promise<Media[]> => {
  // Lower vote count but high rating
  try {
    const response = await tmdb.get("/discover/movie", {
      params: {
        "vote_average.gte": 7.5,
        "vote_count.lte": 500,
        sort_by: "vote_average.desc",
        page,
      },
    });
    return response.data.results.map((item: TMDBMovieResult) =>
      formatMediaResult({ ...item, media_type: "movie" })
    );
  } catch (error) {
    console.error("Error fetching Hidden Gems:", error);
    return [];
  }
};

export const getClassics = async (page: number = 1): Promise<Media[]> => {
  // Movies released before 2000
  try {
    const response = await tmdb.get("/discover/movie", {
      params: {
        "primary_release_date.lte": "2000-01-01",
        sort_by: "popularity.desc",
        page,
      },
    });
    return response.data.results.map((item: TMDBMovieResult) =>
      formatMediaResult({ ...item, media_type: "movie" })
    );
  } catch (error) {
    console.error("Error fetching Classics:", error);
    return [];
  }
};

export const getMoviesForKids = (page: number = 1) =>
  getGenreContent(GENRES.FAMILY, page);

export const getBingeWorthySeries = async (
  page: number = 1
): Promise<Media[]> => {
  // TV shows with high episode count and popularity (using TV endpoint)
  try {
    const response = await tmdb.get("/discover/tv", {
      params: {
        with_type: 2, // Scripted
        sort_by: "popularity.desc",
        page,
      },
    });
    return response.data.results.map((item: TMDBMovieResult) =>
      formatMediaResult({ ...item, media_type: "tv" })
    );
  } catch (error) {
    console.error("Error fetching Binge-Worthy Series:", error);
    return [];
  }
};

export const getBasedOnTrueStories = async (
  page: number = 1
): Promise<Media[]> => {
  // No direct filter; could use keyword 9672 ("based on true story")
  try {
    const response = await tmdb.get("/discover/movie", {
      params: {
        with_keywords: 9672,
        sort_by: "popularity.desc",
        page,
      },
    });
    return response.data.results.map((item: TMDBMovieResult) =>
      formatMediaResult({ ...item, media_type: "movie" })
    );
  } catch (error) {
    console.error("Error fetching Based on True Stories:", error);
    return [];
  }
};

// --- Regional/Language Rows ---
export const getHollywoodMovies = async (
  page: number = 1
): Promise<Media[]> => {
  // English language, US region
  try {
    const response = await tmdb.get("/discover/movie", {
      params: {
        with_original_language: "en",
        region: "US",
        sort_by: "popularity.desc",
        page,
      },
    });
    return response.data.results.map((item: TMDBMovieResult) =>
      formatMediaResult({ ...item, media_type: "movie" })
    );
  } catch (error) {
    console.error("Error fetching Hollywood movies:", error);
    return [];
  }
};

export const getKoreanDramas = async (page: number = 1): Promise<Media[]> => {
  // Korean language, TV shows
  try {
    const response = await tmdb.get("/discover/tv", {
      params: {
        with_original_language: "ko",
        sort_by: "popularity.desc",
        page,
      },
    });
    return response.data.results.map((item: TMDBMovieResult) =>
      formatMediaResult({ ...item, media_type: "tv" })
    );
  } catch (error) {
    console.error("Error fetching Korean Dramas:", error);
    return [];
  }
};

export const getJapaneseAnime = async (page: number = 1): Promise<Media[]> => {
  // Japanese language, Animation genre
  try {
    const response = await tmdb.get("/discover/tv", {
      params: {
        with_original_language: "ja",
        with_genres: GENRES.ANIMATION,
        sort_by: "popularity.desc",
        page,
      },
    });
    return response.data.results.map((item: TMDBMovieResult) =>
      formatMediaResult({ ...item, media_type: "tv" })
    );
  } catch (error) {
    console.error("Error fetching Japanese Anime:", error);
    return [];
  }
};

export const getEuropeanCinema = async (page: number = 1): Promise<Media[]> => {
  // European region, various languages (using region: 'FR' as example)
  try {
    const response = await tmdb.get("/discover/movie", {
      params: {
        region: "FR",
        sort_by: "popularity.desc",
        page,
      },
    });
    return response.data.results.map((item: TMDBMovieResult) =>
      formatMediaResult({ ...item, media_type: "movie" })
    );
  } catch (error) {
    console.error("Error fetching European Cinema:", error);
    return [];
  }
};

// --- Platform/Provider Rows ---
// Note: TMDB uses 'with_watch_providers' and 'watch_region' for streaming providers. Provider IDs are examples and may need to be updated.
const PROVIDERS = {
  YOUTUBE: 192,
  HBOMAX: 384,
  PEACOCK: 386,
  CRUNCHYROLL: 283,
};

const getProviderContent = async (
  providerId: number,
  page: number = 1
): Promise<Media[]> => {
  try {
    const response = await tmdb.get("/discover/movie", {
      params: {
        with_watch_providers: providerId,
        watch_region: "US",
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

export const getYouTubeOriginals = (page: number = 1) =>
  getProviderContent(PROVIDERS.YOUTUBE, page);
export const getHBOMax = (page: number = 1) =>
  getProviderContent(PROVIDERS.HBOMAX, page);
export const getPeacock = (page: number = 1) =>
  getProviderContent(PROVIDERS.PEACOCK, page);
export const getCrunchyroll = (page: number = 1) =>
  getProviderContent(PROVIDERS.CRUNCHYROLL, page);
