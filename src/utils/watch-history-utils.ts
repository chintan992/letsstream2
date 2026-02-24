import { WatchHistoryItem } from "@/contexts/types/watch-history";

/**
 * Deduplicates watch history items by merging duplicates
 * For TV shows, consolidates all episodes under a single entry with episode tracking
 */
export const deduplicateWatchHistory = (
  items: WatchHistoryItem[]
): WatchHistoryItem[] => {
  if (!items || items.length === 0) return [];

  // Filter out invalid dates first
  const validItems = items.filter(item => {
    if (!item.created_at) return false;
    try {
      const date = new Date(item.created_at);
      return !isNaN(date.getTime());
    } catch {
      return false;
    }
  });

  // Create a map to deduplicate by unique media identifiers
  const mediaMap = new Map<string, WatchHistoryItem>();

  validItems.forEach(item => {
    // Create a unique key based on media type and id only (no season/episode for TV shows)
    const key = `${item.media_type}-${item.media_id}`;

    if (item.media_type === "tv") {
      // For TV shows, consolidate episodes
      if (mediaMap.has(key)) {
        // Existing TV show entry found, merge with it
        const existingItem = mediaMap.get(key)!;

        // Update the consolidated entry with the most recent episode data
        if (!existingItem.episodes_watched) {
          existingItem.episodes_watched = [];
        }

        // Add the current episode to the episodes_watched array
        const episodeAlreadyTracked = existingItem.episodes_watched.some(
          ep => ep.season === item.season && ep.episode === item.episode
        );

        if (!episodeAlreadyTracked) {
          existingItem.episodes_watched.push({
            season: item.season || 0,
            episode: item.episode || 0,
            watch_position: item.watch_position,
            duration: item.duration,
            watched_at: item.created_at,
          });
        }

        // Update latest episode if this one is more recent
        const existingDateTime = new Date(existingItem.created_at).getTime();
        const currentDateTime = new Date(item.created_at).getTime();

        if (currentDateTime > existingDateTime) {
          // Update the main entry with the latest episode's data
          existingItem.season = item.season;
          existingItem.episode = item.episode;
          existingItem.watch_position = item.watch_position;
          existingItem.duration = item.duration;
          existingItem.created_at = item.created_at;
          if (
            !existingItem.last_watched_at ||
            currentDateTime > new Date(existingItem.last_watched_at).getTime()
          ) {
            existingItem.last_watched_at = item.created_at;
          }
          existingItem.preferred_source = item.preferred_source;
        }

        // Keep track of the most recent episode as the "current" one for display purposes
        if (
          !existingItem.last_watched_at ||
          currentDateTime > new Date(existingItem.last_watched_at).getTime()
        ) {
          existingItem.last_watched_at = item.created_at;
        }
      } else {
        // First time seeing this TV show, create entry with episode tracking
        const newItem = { ...item };
        newItem.episodes_watched = [
          {
            season: item.season || 0,
            episode: item.episode || 0,
            watch_position: item.watch_position,
            duration: item.duration,
            watched_at: item.created_at,
          },
        ];
        if (!newItem.last_watched_at) {
          newItem.last_watched_at = item.created_at;
        }
        mediaMap.set(key, newItem);
      }
    } else {
      // For movies, keep the existing logic
      if (mediaMap.has(key)) {
        const existingItem = mediaMap.get(key)!;
        const existingDate = new Date(existingItem.created_at).getTime();
        const currentDate = new Date(item.created_at).getTime();

        // If this item is more recent, replace the existing one
        if (currentDate > existingDate) {
          mediaMap.set(key, item);
        }
      } else {
        // If not in map yet, add it
        mediaMap.set(key, item);
      }
    }
  });

  // Convert map values back to array and sort by most recent
  return Array.from(mediaMap.values()).sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
};

/**
 * Determines if two watch history items refer to the same media content
 * For TV shows, checks only media type and ID (not season/episode)
 */
const isSameMedia = (
  item1: WatchHistoryItem,
  item2: WatchHistoryItem
): boolean => {
  // Different media types or IDs means different media
  if (
    item1.media_type !== item2.media_type ||
    item1.media_id !== item2.media_id
  ) {
    return false;
  }

  // For TV shows, they're the same if media_type and media_id match (ignore season/episode)
  if (item1.media_type === "tv") {
    return true;
  }

  // For movies, they're the same if media_id and media_type match
  return true;
};

/**
 * Filters watch history entries and adds new episode to existing TV show entry
 * For TV shows: adds episode to episodes_watched array in existing entry
 * For movies: keeps existing behavior
 */
export const filterWatchHistoryDuplicates = (
  watchHistory: WatchHistoryItem[],
  newItem: WatchHistoryItem
): { items: WatchHistoryItem[]; existingItem?: WatchHistoryItem } => {
  // Look for an existing item that matches the new one (same media type and ID)
  const existingItemIndex = watchHistory.findIndex(item =>
    isSameMedia(item, newItem)
  );

  // If no existing item found, just add the new one
  if (existingItemIndex === -1) {
    if (newItem.media_type === "tv") {
      // Initialize episodes_watched for new TV show entry
      const newTVItem = {
        ...newItem,
        episodes_watched: [
          {
            season: newItem.season || 0,
            episode: newItem.episode || 0,
            watch_position: newItem.watch_position,
            duration: newItem.duration,
            watched_at: newItem.created_at,
          },
        ],
        last_watched_at: newItem.created_at,
      };
      return { items: [newTVItem, ...watchHistory] };
    }
    return { items: [newItem, ...watchHistory] };
  }

  // If found, handle based on media type
  const existingItem = watchHistory[existingItemIndex];
  const filteredItems = [
    ...watchHistory.slice(0, existingItemIndex),
    ...watchHistory.slice(existingItemIndex + 1),
  ];

  if (newItem.media_type === "tv") {
    // For TV shows, we need to merge the episode into the existing item
    const updatedItem = { ...existingItem };

    // Initialize episodes_watched if it doesn't exist
    if (!updatedItem.episodes_watched) {
      updatedItem.episodes_watched = [];
    }

    // Check if this episode is already tracked
    const episodeAlreadyTracked = updatedItem.episodes_watched.some(
      ep => ep.season === newItem.season && ep.episode === newItem.episode
    );

    if (!episodeAlreadyTracked) {
      // Add the new episode to the episodes_watched array
      updatedItem.episodes_watched.push({
        season: newItem.season || 0,
        episode: newItem.episode || 0,
        watch_position: newItem.watch_position,
        duration: newItem.duration,
        watched_at: newItem.created_at,
      });
    }

    // Update the main entry with the new episode's data (the latest watched)
    const newDateTime = new Date(newItem.created_at).getTime();
    const existingDateTime = new Date(updatedItem.created_at).getTime();

    if (newDateTime > existingDateTime) {
      updatedItem.season = newItem.season;
      updatedItem.episode = newItem.episode;
      updatedItem.watch_position = newItem.watch_position;
      updatedItem.duration = newItem.duration;
      updatedItem.created_at = newItem.created_at;
      updatedItem.last_watched_at = newItem.created_at;
      updatedItem.preferred_source = newItem.preferred_source;
    } else if (
      !updatedItem.last_watched_at ||
      newDateTime > new Date(updatedItem.last_watched_at).getTime()
    ) {
      updatedItem.last_watched_at = newItem.created_at;
    }

    return {
      items: [updatedItem, ...filteredItems],
      existingItem: updatedItem,
    };
  } else {
    // For movies, keep the original behavior
    return { items: [newItem, ...filteredItems], existingItem };
  }
};

/**
 * Determines if a watch position update represents significant progress
 */
export const isSignificantProgress = (
  oldPosition: number,
  newPosition: number,
  minProgressDiff: number = 60 // 60 seconds by default
): boolean => {
  return Math.abs(newPosition - oldPosition) >= minProgressDiff;
};

/**
 * Finds a specific episode in a TV show's episodes_watched array
 */
export const findEpisodeInHistory = (
  historyItem: WatchHistoryItem,
  season: number,
  episode: number
):
  | {
      season: number;
      episode: number;
      watch_position: number;
      duration: number;
      watched_at: string;
    }
  | undefined => {
  if (!historyItem.episodes_watched) return undefined;

  return historyItem.episodes_watched.find(
    ep => ep.season === season && ep.episode === episode
  );
};

/**
 * Updates a specific episode's watch position in a TV show's episodes_watched array
 */
export const updateEpisodeInHistory = (
  historyItem: WatchHistoryItem,
  season: number,
  episode: number,
  watch_position: number,
  duration: number
): WatchHistoryItem => {
  const updatedItem = { ...historyItem };

  if (!updatedItem.episodes_watched) {
    updatedItem.episodes_watched = [];
  }

  const episodeIndex = updatedItem.episodes_watched.findIndex(
    ep => ep.season === season && ep.episode === episode
  );

  if (episodeIndex !== -1) {
    // Update existing episode
    updatedItem.episodes_watched[episodeIndex] = {
      ...updatedItem.episodes_watched[episodeIndex],
      watch_position,
      duration,
    };
  } else {
    // Add new episode
    updatedItem.episodes_watched.push({
      season,
      episode,
      watch_position,
      duration,
      watched_at: new Date().toISOString(),
    });
  }

  // Update the main entry to reflect the latest episode watched
  updatedItem.season = season;
  updatedItem.episode = episode;
  updatedItem.watch_position = watch_position;
  updatedItem.duration = duration;
  updatedItem.created_at = new Date().toISOString();
  updatedItem.last_watched_at = new Date().toISOString();

  return updatedItem;
};
