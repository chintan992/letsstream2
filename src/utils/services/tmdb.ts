import axios from "axios";
import { TMDB } from "../config/constants";

// Create axios instance for TMDB
export const tmdb = axios.create({
  baseURL: TMDB.BASE_URL,
  params: {
    api_key: TMDB.API_KEY,
    language: "en-US",
  },
});

// Helper function to get full image URL
export const getImageUrl = (
  path: string | null,
  size: string
): string | null => {
  if (!path) return null;
  return `${TMDB.IMAGE_BASE_URL}/${size}${path}`;
};
