import { Media } from "@/utils/types";
import env from "@/config/env";

interface TMDBSearchResult {
  id: number;
  title?: string;
  name?: string;
  media_type: "movie" | "tv";
  release_date?: string;
  first_air_date?: string;
  overview: string;
}

interface TMDBEpisodeInfo {
  seasonNumber: number;
  episodeNumber: number;
}

interface TMDBValidatedContent {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  confidence: number;
  episode?: TMDBEpisodeInfo;
}

/**
 * Search TMDB for a specific title and validate against provided media info
 */
async function searchAndValidateTMDB(
  media: Media
): Promise<TMDBValidatedContent | null> {
  try {
    const query = encodeURIComponent(media.title || media.name || "");
    const searchResponse = await fetch(
      `https://api.themoviedb.org/3/search/multi?api_key=${env.TMDB_API_KEY}&query=${query}`
    );

    if (!searchResponse.ok) {
      throw new Error("TMDB search failed");
    }

    const data = await searchResponse.json();
    if (data.errors) {
      console.error("TMDB API errors:", data.errors);
      return null;
    }

    let results: TMDBSearchResult[] = data.results || [];

    // First try exact title match
    const exactMatch = results.find(
      result =>
        (result.title?.toLowerCase() === media.title?.toLowerCase() ||
          result.name?.toLowerCase() === media.name?.toLowerCase()) &&
        (result.media_type === "movie" || result.media_type === "tv")
    );

    if (exactMatch) {
      return {
        tmdbId: exactMatch.id,
        mediaType: exactMatch.media_type,
        title: exactMatch.title || exactMatch.name || "",
        confidence: 1.0,
      };
    }

    // Filter and score results
    const mediaYear = getYear(media.release_date || media.first_air_date);
    results = results.filter(
      result => result.media_type === "movie" || result.media_type === "tv"
    );

    if (results.length === 0) {
      // Try a second search with just the title
      const fallbackQuery = encodeURIComponent(
        (media.title || media.name || "").split("(")[0].trim()
      );
      const fallbackResponse = await fetch(
        `https://api.themoviedb.org/3/search/multi?api_key=${env.TMDB_API_KEY}&query=${fallbackQuery}`
      );

      if (!fallbackResponse.ok) {
        return null;
      }

      const fallbackData = await fallbackResponse.json();
      results =
        fallbackData.results?.filter(
          result => result.media_type === "movie" || result.media_type === "tv"
        ) || [];
    }

    // Score all results
    const scoredResults = results.map(result => ({
      result,
      score: calculateSimilarityScore(media, result),
    }));

    // Sort by score and get the best match
    scoredResults.sort((a, b) => b.score - a.score);
    const bestMatch = scoredResults[0];

    // Return if we have a good match
    if (bestMatch && bestMatch.score >= 0.5) {
      return {
        tmdbId: bestMatch.result.id,
        mediaType: bestMatch.result.media_type,
        title: bestMatch.result.title || bestMatch.result.name || "",
        confidence: bestMatch.score,
      };
    }

    return null;
  } catch (error) {
    console.error("Error searching TMDB:", error);
    return null;
  }
}

/**
 * Calculate similarity score between chatbot recommendation and TMDB result
 */
function calculateSimilarityScore(
  media: Media,
  tmdbResult: TMDBSearchResult
): number {
  let score = 0;
  let factors = 0;

  // Title similarity (most important)
  const mediaTitle = (media.title || media.name || "").toLowerCase();
  const tmdbTitle = (tmdbResult.title || tmdbResult.name || "").toLowerCase();
  const titleSimilarity = calculateStringSimilarity(mediaTitle, tmdbTitle);
  score += titleSimilarity * 0.6;
  factors += 0.6;

  // Release year similarity
  const mediaYear = getYear(media.release_date || media.first_air_date);
  const tmdbYear = getYear(
    tmdbResult.release_date || tmdbResult.first_air_date
  );
  if (mediaYear && tmdbYear) {
    const yearDiff = Math.abs(mediaYear - tmdbYear);
    const yearSimilarity = yearDiff === 0 ? 1 : yearDiff === 1 ? 0.8 : 0;
    score += yearSimilarity * 0.4;
    factors += 0.4;
  }

  return factors > 0 ? score / factors : 0;
}

/**
 * Calculate string similarity using Levenshtein distance with a threshold
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1;

  const threshold = Math.floor(maxLength * 0.3); // Allow 30% difference
  const distance = levenshteinDistance(str1, str2, threshold);

  return distance === -1 ? 0 : 1 - distance / maxLength;
}

/**
 * Calculate Levenshtein distance with threshold for early exit
 */
function levenshteinDistance(
  str1: string,
  str2: string,
  threshold: number
): number {
  if (Math.abs(str1.length - str2.length) > threshold) return -1;

  const matrix: number[][] = Array(str1.length + 1)
    .fill(null)
    .map(() => Array(str2.length + 1).fill(0));

  for (let i = 0; i <= str1.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= str2.length; j++) matrix[0][j] = j;

  let minDistanceInRow;
  for (let i = 1; i <= str1.length; i++) {
    minDistanceInRow = threshold + 1;

    for (let j = 1; j <= str2.length; j++) {
      matrix[i][j] =
        str1[i - 1] === str2[j - 1]
          ? matrix[i - 1][j - 1]
          : 1 +
            Math.min(matrix[i - 1][j], matrix[i][j - 1], matrix[i - 1][j - 1]);

      minDistanceInRow = Math.min(minDistanceInRow, matrix[i][j]);
    }

    if (minDistanceInRow > threshold) return -1;
  }

  return matrix[str1.length][str2.length];
}

/**
 * Extract year from date string
 */
function getYear(dateStr?: string): number {
  if (!dateStr) return 0;
  const match = dateStr.match(/\d{4}/);
  return match ? parseInt(match[0]) : 0;
}

/**
 * Get correct route for media content after TMDB validation
 */
async function getValidatedRoute(
  media: Media,
  type: "details" | "watch" = "details"
): Promise<string> {
  try {
    const episodeInfo = extractEpisodeInfo(media);
    const validatedContent = await searchAndValidateTMDB(media);

    if (!validatedContent) {
      console.error("Could not validate content:", media.title || media.name);
      return "/not-found";
    }

    if (type === "details") {
      return `/${validatedContent.mediaType}/${validatedContent.tmdbId}`;
    } else {
      if (validatedContent.mediaType === "tv") {
        try {
          // Verify season exists
          const seasonData = await fetch(
            `https://api.themoviedb.org/3/tv/${validatedContent.tmdbId}/season/${episodeInfo?.seasonNumber || 1}?api_key=${env.TMDB_API_KEY}`
          );

          if (!seasonData.ok) {
            return `/watch/tv/${validatedContent.tmdbId}/1/1`;
          }

          const { seasonNumber, episodeNumber } = episodeInfo || {
            seasonNumber: 1,
            episodeNumber: 1,
          };
          return `/watch/tv/${validatedContent.tmdbId}/${seasonNumber}/${episodeNumber}`;
        } catch (error) {
          console.error("Error validating season:", error);
          return `/watch/tv/${validatedContent.tmdbId}/1/1`;
        }
      } else {
        return `/watch/movie/${validatedContent.tmdbId}`;
      }
    }
  } catch (error) {
    console.error("Error validating route:", error);
    return "/not-found";
  }
}

/**
 * Extract season and episode info from media metadata
 */
function extractEpisodeInfo(media: Media): TMDBEpisodeInfo | null {
  const titleStr = media.title || media.name || "";
  const overviewStr = media.overview || "";

  // Common patterns for episode information
  const patterns = [
    // "Season X Episode Y" or "SxEY" formats
    /season[.\s]*(\d+)[.\s]*episode[.\s]*(\d+)/i,
    /s(\d+)[.\s]*e(\d+)/i,
    // "Episode Y of Season X" format
    /episode[.\s]*(\d+)[.\s]*(?:of)?[.\s]*season[.\s]*(\d+)/i,
    // Standalone episode number (assumes season 1)
    /episode[.\s]*(\d+)/i,
  ];

  for (const pattern of patterns) {
    for (const text of [titleStr, overviewStr]) {
      const match = text.match(pattern);
      if (match) {
        if (match.length >= 3) {
          return {
            seasonNumber: parseInt(match[1]),
            episodeNumber: parseInt(match[2]),
          };
        } else if (pattern.source.includes("episode")) {
          return {
            seasonNumber: 1,
            episodeNumber: parseInt(match[1]),
          };
        }
      }
    }
  }

  return null;
}

export { getValidatedRoute, type TMDBEpisodeInfo };
