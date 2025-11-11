import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks";
import { useWatchHistory } from "@/hooks/watch-history";
import { useUserPreferences } from "@/hooks/user-preferences";
import { Media } from "@/utils/types";

export interface ProfileStats {
  totalWatchTime: number;
  totalWatched: number;
  favoriteGenres: string[];
  watchStreak: number;
  averageRating: number;
}

export const useProfileData = () => {
  const { user } = useAuth();
  const { watchHistory, favorites, watchlist } = useWatchHistory();
  const { userPreferences } = useUserPreferences();

  // Memoized watch history conversion to Media format
  const watchHistoryMedia = useMemo(() => {
    return watchHistory.map(item => ({
      id: item.media_id,
      media_id: item.media_id,
      title: item.title,
      name: item.title,
      poster_path: item.poster_path,
      backdrop_path: item.backdrop_path,
      overview: item.overview || "",
      vote_average: item.rating || 0,
      media_type: item.media_type,
      genre_ids: [],
      watch_position: item.watch_position,
      duration: item.duration,
      created_at: item.created_at,
    })) as Media[];
  }, [watchHistory]);

  // Memoized profile statistics
  const profileStats = useMemo((): ProfileStats => {
    const totalWatchTime = watchHistory.reduce(
      (total, item) => total + (item.duration || 0),
      0
    );
    const totalWatched = watchHistory.length;

    // Calculate favorite genres from watch history
    const genreCount: Record<string, number> = {};
    watchHistory.forEach(item => {
      // This would need genre data from TMDB API in a real implementation
      // For now, we'll use a placeholder
    });

    const favoriteGenres = Object.entries(genreCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([genre]) => genre);

    // Calculate watch streak (simplified)
    const watchStreak = Math.min(totalWatched, 30); // Placeholder

    // Calculate average rating
    const averageRating =
      watchHistory.length > 0
        ? watchHistory.reduce((sum, item) => sum + (item.rating || 0), 0) /
          watchHistory.length
        : 0;

    return {
      totalWatchTime,
      totalWatched,
      favoriteGenres,
      watchStreak,
      averageRating,
    };
  }, [watchHistory]);

  // Memoized user display info
  const userDisplayInfo = useMemo(
    () => ({
      name: user?.displayName || user?.email?.split("@")[0] || "User",
      email: user?.email || "",
      avatar: user?.photoURL || "",
      initials: user?.email ? user.email.substring(0, 2).toUpperCase() : "U",
    }),
    [user]
  );

  return {
    user,
    userDisplayInfo,
    watchHistoryMedia,
    favorites,
    watchlist,
    userPreferences,
    profileStats,
    isLoading: !user,
  };
};
