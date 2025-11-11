import { BASE_URL, TMDB_API_KEY } from "../config/constants";

/**
 * Validates if a TMDB ID exists
 * @param mediaType Movie or TV
 * @param id TMDB ID
 * @returns Boolean indicating if ID is valid
 */
export async function validateTMDBId(
  mediaType: string | undefined,
  id: number
): Promise<boolean> {
  if (!mediaType || !id) return false;

  try {
    const type = mediaType === "movie" ? "movie" : "tv";
    const response = await fetch(
      `${BASE_URL}/${type}/${id}?api_key=${TMDB_API_KEY}&language=en-US`
    );

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return !!data.id;
  } catch (error) {
    console.error("Error validating TMDB ID:", error);
    return false;
  }
}
