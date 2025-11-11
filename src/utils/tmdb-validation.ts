import { Media } from "@/utils/types";
import env from "@/config/env";

interface TMDBValidationResult {
  isValid: boolean;
  mediaType: "movie" | "tv" | null;
  tmdbId: number | null;
  error?: string;
}

/**
 * Validates and verifies TMDB content existence and type
 */
async function validateTMDBContent(
  mediaId: number,
  expectedType?: "movie" | "tv"
): Promise<TMDBValidationResult> {
  try {
    // First try the expected type if provided
    if (expectedType) {
      const response = await fetch(
        `https://api.themoviedb.org/3/${expectedType}/${mediaId}?api_key=${env.TMDB_API_KEY}`
      );

      if (response.ok) {
        return {
          isValid: true,
          mediaType: expectedType,
          tmdbId: mediaId,
        };
      }
    }

    // If no type provided or expected type failed, try both types
    const movieResponse = await fetch(
      `https://api.themoviedb.org/3/movie/${mediaId}?api_key=${env.TMDB_API_KEY}`
    );

    if (movieResponse.ok) {
      return {
        isValid: true,
        mediaType: "movie",
        tmdbId: mediaId,
      };
    }

    const tvResponse = await fetch(
      `https://api.themoviedb.org/3/tv/${mediaId}?api_key=${env.TMDB_API_KEY}`
    );

    if (tvResponse.ok) {
      return {
        isValid: true,
        mediaType: "tv",
        tmdbId: mediaId,
      };
    }

    return {
      isValid: false,
      mediaType: null,
      tmdbId: null,
      error: "Content not found in TMDB",
    };
  } catch (error) {
    console.error("Error validating TMDB content:", error);
    return {
      isValid: false,
      mediaType: null,
      tmdbId: null,
      error: "Error validating content",
    };
  }
}

/**
 * Determines the correct route for a media item
 */
async function getMediaRoute(media: Media): Promise<string> {
  const validation = await validateTMDBContent(
    media.id,
    media.media_type as "movie" | "tv"
  );

  if (!validation.isValid || !validation.mediaType) {
    console.error(`Invalid media route for ID ${media.id}:`, validation.error);
    return "/not-found";
  }

  if (validation.mediaType === "movie") {
    return `/movie/${validation.tmdbId}`;
  } else {
    return `/tv/${validation.tmdbId}`;
  }
}

/**
 * Determines the correct watch route for a media item
 */
async function getWatchRoute(media: Media): Promise<string> {
  const validation = await validateTMDBContent(
    media.id,
    media.media_type as "movie" | "tv"
  );

  if (!validation.isValid || !validation.mediaType) {
    console.error(`Invalid watch route for ID ${media.id}:`, validation.error);
    return "/not-found";
  }

  return `/watch/${validation.mediaType}/${validation.tmdbId}`;
}

/**
 * Safely navigate to media content with validation
 */
async function navigateToContent(
  media: Media,
  navigate: (path: string) => void,
  type: "details" | "watch" = "details"
): Promise<void> {
  try {
    const route =
      type === "details"
        ? await getMediaRoute(media)
        : await getWatchRoute(media);

    navigate(route);
  } catch (error) {
    console.error("Error navigating to content:", error);
    navigate("/not-found");
  }
}

export {
  validateTMDBContent,
  getMediaRoute,
  getWatchRoute,
  navigateToContent,
  type TMDBValidationResult,
};
