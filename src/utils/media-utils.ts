import { Media } from "@/utils/types";

// Helper function to transform API data into the correct Media format
export const transformApiMediaToMedia = (item: any): Media => {
  return {
    id: item.id || item.media_id || 0,
    media_id: item.id || item.media_id || 0,
    title: item.title || item.name || "Unknown",
    name: item.name || item.title || "Unknown",
    poster_path: item.poster_path || "",
    backdrop_path: item.backdrop_path || "",
    overview: item.overview || "",
    vote_average: item.vote_average || 0,
    media_type:
      item.media_type === "movie" || item.media_type === "tv"
        ? item.media_type
        : item.title
          ? "movie"
          : "tv",
    release_date: item.release_date || undefined,
    first_air_date: item.first_air_date || undefined,
    genre_ids: Array.isArray(item.genre_ids) ? item.genre_ids : [],
  };
};

// Helper function to transform an array of API items into Media[]
export const transformApiMediaArrayToMediaArray = (items: any[]): Media[] => {
  return items.map(transformApiMediaToMedia);
};
