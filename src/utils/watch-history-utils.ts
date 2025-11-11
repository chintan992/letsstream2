import { WatchHistoryItem } from "@/contexts/types/watch-history";

/**
 * Deduplicates watch history items by merging duplicates and keeping the most recent one
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
    // Create a unique key based on media type, id, and for TV shows, season and episode
    const key = `${item.media_type}-${item.media_id}${item.media_type === "tv" ? `-s${item.season}-e${item.episode}` : ""}`;

    // Check if we already have this item
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
  });

  // Convert map values back to array and sort by most recent
  return Array.from(mediaMap.values()).sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
};

/**
 * Determines if two watch history items refer to the same media content
 */
export const isSameMedia = (
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

  // For TV shows, check season and episode
  if (item1.media_type === "tv") {
    return item1.season === item2.season && item1.episode === item2.episode;
  }

  // For movies, they're the same if media_id and media_type match
  return true;
};

/**
 * Filters out duplicate watch history entries, keeping only the most recent one for each unique media
 */
export const filterWatchHistoryDuplicates = (
  watchHistory: WatchHistoryItem[],
  newItem: WatchHistoryItem
): { items: WatchHistoryItem[]; existingItem?: WatchHistoryItem } => {
  // Look for an existing item that matches the new one
  const existingItemIndex = watchHistory.findIndex(item =>
    isSameMedia(item, newItem)
  );

  // If no existing item found, just add the new one
  if (existingItemIndex === -1) {
    return { items: [newItem, ...watchHistory] };
  }

  // If found, return the existing item and a filtered list (without the existing item)
  const existingItem = watchHistory[existingItemIndex];
  const filteredItems = [
    ...watchHistory.slice(0, existingItemIndex),
    ...watchHistory.slice(existingItemIndex + 1),
  ];

  // Add the new item at the beginning (most recent)
  return { items: [newItem, ...filteredItems], existingItem };
};

/**
 * Calculate the percentage progress of a watched item
 */
export const calculateProgress = (
  position: number,
  duration: number
): number => {
  if (!duration || duration <= 0) return 0;
  const progress = (position / duration) * 100;
  return Math.min(100, Math.max(0, progress)); // Ensure between 0-100
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
