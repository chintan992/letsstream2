import { Media } from "@/utils/types";
import { TMDBEpisodeInfo } from "./tmdb-search";
import { ChatbotMedia } from "./types/chatbot-types";

interface ParsedMediaItem {
  title: string;
  year?: string;
  description?: string;
  genres?: string[];
  rating?: string;
  tmdbId?: number;
  type?: "movie" | "tv";
  episode?: TMDBEpisodeInfo;
}

/**
 * Extracts potential movie/TV show recommendations from AI response text
 * @param text The AI response text
 * @returns Array of extracted media items
 */
/**
 * Extracts media items from AI response text and creates ChatbotMedia objects
 */
export const extractMediaFromResponse = (text: string): ChatbotMedia[] => {
  const parsedItems = extractMediaItems(text);
  return createMediaObjects(parsedItems);
};

/**
 * Extract raw media items from text (internal helper)
 */
const extractMediaItems = (text: string): ParsedMediaItem[] => {
  const mediaItems: ParsedMediaItem[] = [];

  // First attempt: Try to find numbered items (1., 2., etc.)
  let items = text.match(/(\d+\.\s+[^\d]+(?=\d+\.\s+|$))/gs) || [];

  if (
    items.length === 0 ||
    (items.length === 1 && !items[0].includes("(") && !items[0].includes("**"))
  ) {
    const titleYearPattern =
      /(?:\*\*)?([^*\n(]+)(?:\*\*)?\s*\((\d{4}(?:-\d{4}|\s*-\s*Present)?)\)/g;
    const matches = [...text.matchAll(titleYearPattern)];

    if (matches.length > 0) {
      items = matches.map(match => {
        const startIdx = match.index || 0;
        let endIdx = text.indexOf("\n\n", startIdx + match[0].length);
        if (endIdx === -1) endIdx = text.length;
        return text.substring(startIdx, endIdx);
      });
    }
  }

  items.forEach(item => {
    // Look for title patterns: bold text or text with year in parentheses
    // Support both Markdown bold (**Title**) and plain text with year
    const titleMatch = item.match(
      /(?:\*\*)?([^*\n(]+)(?:\*\*)?\s*\((\d{4}(?:-\d{4}|\s*-\s*Present)?)\)/
    );

    if (titleMatch) {
      const mediaItem: ParsedMediaItem = {
        title: titleMatch[1].trim(),
        year: titleMatch[2],
      };

      // Extract description (text after the title until next section)
      const titleEndIndex = item.indexOf(titleMatch[0]) + titleMatch[0].length;
      let descriptionText = item.substring(titleEndIndex).trim();

      // Remove any prefix dash or colon
      descriptionText = descriptionText.replace(/^[-:]\s*/, "");

      // Extract until the first metadata label
      const metadataStart = descriptionText.search(
        /\b(Genre|Type|Rating|TMDB_ID|Season|Episode)s?:/i
      );
      if (metadataStart > 0) {
        mediaItem.description = descriptionText
          .substring(0, metadataStart)
          .trim();
      } else {
        // If no metadata found, use the first paragraph
        const firstParagraphEnd = descriptionText.indexOf("\n\n");
        mediaItem.description =
          firstParagraphEnd > 0
            ? descriptionText.substring(0, firstParagraphEnd).trim()
            : descriptionText;
      }

      // Extract genres
      const genreMatch = item.match(/Genre(?:s)?:\s*([^]+?)(?:\n|$)/i);
      if (genreMatch) {
        mediaItem.genres = genreMatch[1].split(/,\s*/).map(g => g.trim());
      }

      // Extract rating
      const ratingMatch = item.match(
        /(?:IMDb|Rotten Tomatoes|Rating):\s*([\d.]+)(?:\/10|%)/i
      );
      if (ratingMatch) {
        mediaItem.rating = ratingMatch[0].trim();
      }

      // Extract TMDB ID
      const tmdbIdMatch = item.match(/TMDB_ID:\s*(\d+)/i);
      if (tmdbIdMatch) {
        mediaItem.tmdbId = parseInt(tmdbIdMatch[1]);
      }

      // Extract media type and episode info
      const typeMatch = item.match(/Type:\s*(movie|tv|series|show)/i);
      if (typeMatch) {
        const typeText = typeMatch[1].toLowerCase();
        mediaItem.type =
          typeText === "series" || typeText === "show"
            ? "tv"
            : (typeText as "movie" | "tv");

        // If it's a TV show, look for season and episode numbers
        if (mediaItem.type === "tv") {
          const seasonMatch = item.match(/Season:\s*(\d+)/i);
          const episodeMatch = item.match(/Episode:\s*(\d+)/i);

          if (seasonMatch || episodeMatch) {
            mediaItem.episode = {
              seasonNumber: seasonMatch ? parseInt(seasonMatch[1]) : 1,
              episodeNumber: episodeMatch ? parseInt(episodeMatch[1]) : 1,
            };
          }
        }
      } else if (
        item.toLowerCase().includes("tv series") ||
        item.toLowerCase().includes("tv show") ||
        mediaItem.title.includes("Season")
      ) {
        mediaItem.type = "tv";
        // Default to season 1, episode 1 if not specified
        mediaItem.episode = { seasonNumber: 1, episodeNumber: 1 };
      } else {
        mediaItem.type = "movie";
      }

      // Look for episode information in description
      if (
        mediaItem.type === "tv" &&
        !mediaItem.episode &&
        mediaItem.description
      ) {
        const seasonEpisodeMatch = mediaItem.description.match(
          /(?:start|begin|watch).*?(?:season|s)[.\s]*(\d+).*?(?:episode|ep?)[.\s]*(\d+)/i
        );
        if (seasonEpisodeMatch) {
          mediaItem.episode = {
            seasonNumber: parseInt(seasonEpisodeMatch[1]),
            episodeNumber: parseInt(seasonEpisodeMatch[2]),
          };
        }
      }

      // If no TMDB ID was found, generate a temporary one based on title
      if (!mediaItem.tmdbId) {
        // Create a simple hash from the title string
        const tempId =
          Math.abs(
            mediaItem.title.split("").reduce((acc, char) => {
              return acc + char.charCodeAt(0);
            }, 0)
          ) % 1000000;
        mediaItem.tmdbId = tempId;
      }

      mediaItems.push(mediaItem);
    }
  });

  // Log extracted items for debugging
  console.log("Extracted media items:", mediaItems);

  return mediaItems;
};

/**
 * Create temporary Media objects from parsed items
 * Used for displaying in the chatbot UI
 */
export const createMediaObjects = (
  parsedItems: ParsedMediaItem[]
): ChatbotMedia[] => {
  return parsedItems.map(item => {
    const media: ChatbotMedia = {
      id: item.tmdbId || 0,
      media_id: item.tmdbId || 0,
      title: item.title,
      name: item.title,
      overview: item.description || "",
      poster_path: "",
      backdrop_path: "",
      vote_average: 0,
      media_type: item.type || "movie",
      genre_ids: [],
      // Include episode information if available
      season_number: item.episode?.seasonNumber || undefined,
      episode_number: item.episode?.episodeNumber || undefined,
    };

    // Add year and air dates
    if (item.year) {
      // Handle ranges like "2022-Present" by just using the start year
      const yearStart = item.year.split("-")[0].trim();
      if (item.type === "tv") {
        media.first_air_date = `${yearStart}-01-01`;
      } else {
        media.release_date = `${yearStart}-01-01`;
      }
    }

    return media;
  });
};
