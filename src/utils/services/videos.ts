import { tmdb } from "./tmdb";
import { TMDBVideoResponse } from "../types/tmdb";

export const getMovieTrailer = async (
  movieId: number
): Promise<string | null> => {
  try {
    const response = await tmdb.get<TMDBVideoResponse>(
      `/movie/${movieId}/videos`
    );
    const videos = response.data.results;

    // Try to find official trailer first
    const trailer =
      videos.find(
        video =>
          video.type === "Trailer" &&
          video.site === "YouTube" &&
          video.official === true
      ) ||
      // Fallback to any trailer
      videos.find(
        video => video.type === "Trailer" && video.site === "YouTube"
      ) ||
      // Last resort: any video
      videos.find(video => video.site === "YouTube");

    return trailer ? trailer.key : null;
  } catch (error) {
    console.error("Error fetching movie trailer:", error);
    return null;
  }
};

export const getTVTrailer = async (tvId: number): Promise<string | null> => {
  try {
    const response = await tmdb.get<TMDBVideoResponse>(`/tv/${tvId}/videos`);
    const videos = response.data.results;

    // Try to find official trailer first
    const trailer =
      videos.find(
        video =>
          video.type === "Trailer" &&
          video.site === "YouTube" &&
          video.official === true
      ) ||
      // Fallback to any trailer
      videos.find(
        video => video.type === "Trailer" && video.site === "YouTube"
      ) ||
      // Last resort: any video
      videos.find(video => video.site === "YouTube");

    return trailer ? trailer.key : null;
  } catch (error) {
    console.error("Error fetching TV trailer:", error);
    return null;
  }
};
