const TMDB = {
  API_KEY: import.meta.env.VITE_TMDB_API_KEY as string,
  BASE_URL: "https://api.themoviedb.org/3",
  IMAGE_BASE_URL: "https://image.tmdb.org/t/p",
  posterSizes: {
    small: "w185",
    medium: "w342",
    large: "w500",
    original: "original",
  },
  backdropSizes: {
    small: "w300",
    medium: "w780",
    large: "w1280",
    original: "original",
  },
};

// Export individual constants for easier imports
export const TMDB_API_KEY = TMDB.API_KEY;
export const BASE_URL = TMDB.BASE_URL;
export { TMDB };
export const { posterSizes, backdropSizes } = TMDB;
