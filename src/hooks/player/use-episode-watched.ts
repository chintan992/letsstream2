import { useMemo } from "react";
import { useWatchHistory } from "@/hooks/watch-history";

const COMPLETION_THRESHOLD = 0.9;

/**
 * Real per-episode watched state for a TV show, derived from the user's
 * watch history (`episodes_watched` on the history entry).
 *
 * Returns watched "season-episode" keys and whether a history entry exists.
 * An episode counts as watched when
 * it was started (watch_position > 0) or completed (>= 90% of duration).
 * The history indicator remains true when an entry exists but has no watched
 * episodes, distinguishing that case from missing history.
 */
export function useEpisodeWatched(showId: number) {
  const { watchHistory } = useWatchHistory();

  return useMemo(() => {
    const watched = new Set<string>();
    const entry = watchHistory.find(
      item => item.media_id === showId && item.media_type === "tv"
    );
    if (!entry?.episodes_watched) {
      return { watchedEpisodes: watched, hasHistory: !!entry };
    }

    for (const ep of entry.episodes_watched) {
      const started = ep.watch_position > 0;
      const completed =
        ep.duration > 0 && ep.watch_position / ep.duration >= COMPLETION_THRESHOLD;
      if (started || completed) {
        watched.add(`${ep.season}-${ep.episode}`);
      }
    }
    return { watchedEpisodes: watched, hasHistory: true };
  }, [watchHistory, showId]);
}
