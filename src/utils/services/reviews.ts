import { tmdb } from "./tmdb";
import { Review } from "../types";

// Get reviews for movie or TV show
export const getReviews = async (
  id: number,
  mediaType: "movie" | "tv"
): Promise<Review[]> => {
  try {
    const response = await tmdb.get(`/${mediaType}/${id}/reviews`);
    return response.data.results;
  } catch (error) {
    console.error(`Error fetching reviews for ${mediaType} ${id}:`, error);
    return [];
  }
};
