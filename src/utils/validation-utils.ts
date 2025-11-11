import { getMovieDetails, getTVDetails } from "./api";

export const validateMediaId = async (
  mediaId: number,
  mediaType: "movie" | "tv"
): Promise<boolean> => {
  try {
    const details =
      mediaType === "movie"
        ? await getMovieDetails(mediaId)
        : await getTVDetails(mediaId);

    return details !== null;
  } catch (error) {
    console.error(`Error validating media ID ${mediaId}:`, error);
    return false;
  }
};
