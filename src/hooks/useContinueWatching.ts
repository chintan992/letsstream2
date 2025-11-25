import { useMemo } from "react";
import { WatchHistoryItem } from "@/contexts/types/watch-history";

export const useContinueWatching = (watchHistory: WatchHistoryItem[]) => {
  return useMemo(() => {
    if (watchHistory.length === 0) return [];

    // First, filter out invalid dates
    const validItems = watchHistory.filter(item => {
      if (!item.created_at) return false;
      try {
        const date = new Date(item.created_at);
        return !isNaN(date.getTime());
      } catch {
        return false;
      }
    });

    // Create a map to store the most recent item for each unique media
    const uniqueMediaMap = new Map<string, WatchHistoryItem>();

    validItems.forEach(item => {
      // Create a unique key for each media
      // For movies: media_type-media_id
      // For TV shows: media_type-media_id (only one entry per show now)
      const key = `${item.media_type}-${item.media_id}`;

      // If we haven't seen this item yet, or if this item is more recent than what we have, update the map
      if (
        !uniqueMediaMap.has(key) ||
        new Date(item.created_at) >
          new Date(uniqueMediaMap.get(key)!.created_at)
      ) {
        uniqueMediaMap.set(key, item);
      }
    });

    // Convert the map values back to an array and sort by most recent
    return Array.from(uniqueMediaMap.values()).sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [watchHistory]);
};
