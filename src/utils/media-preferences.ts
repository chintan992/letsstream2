import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

export interface MediaStats {
  total: number;
  favorited: number;
  watched: number;
  completed: number;
  avgWatchTime: number;
}

export interface MediaPreferenceStats {
  movies: MediaStats;
  tv: MediaStats;
}

export type ContentPreference = "movie" | "tv" | "balanced";

export type PreferenceTimePeriod = "all" | "week" | "month" | "year";

export interface MediaPreferencesResponse {
  stats: MediaPreferenceStats;
  preference: ContentPreference;
  moviePercentage: number;
  tvPercentage: number;
  favoriteStats: {
    movies: number;
    tv: number;
  };
  completionStats: {
    movies: {
      total: number;
      completed: number;
      rate: number;
    };
    tv: {
      total: number;
      completed: number;
      rate: number;
    };
  };
}

export async function analyzeUserPreferences(
  userId: string,
  period: PreferenceTimePeriod = "all"
): Promise<MediaPreferenceStats> {
  const stats: MediaPreferenceStats = {
    movies: {
      total: 0,
      favorited: 0,
      watched: 0,
      completed: 0,
      avgWatchTime: 0,
    },
    tv: {
      total: 0,
      favorited: 0,
      watched: 0,
      completed: 0,
      avgWatchTime: 0,
    },
  };

  try {
    // Get favorites
    const favoritesRef = collection(db, "favorites");
    const favoritesQuery = query(favoritesRef, where("user_id", "==", userId));
    const favoritesSnapshot = await getDocs(favoritesQuery);

    favoritesSnapshot.forEach(doc => {
      const item = doc.data();
      if (item.media_type === "movie") {
        stats.movies.favorited++;
      } else if (item.media_type === "tv") {
        stats.tv.favorited++;
      }
    });

    // Get watch history
    const historyRef = collection(db, "watchHistory");
    const historyQuery = query(historyRef, where("user_id", "==", userId));
    const historySnapshot = await getDocs(historyQuery);

    let movieWatchTime = 0;
    let tvWatchTime = 0;
    let movieCount = 0;
    let tvCount = 0;

    historySnapshot.forEach(doc => {
      const item = doc.data();
      if (item.media_type === "movie") {
        stats.movies.watched++;
        if (item.watch_position / item.duration >= 0.9) {
          stats.movies.completed++;
        }
        movieWatchTime += item.watch_position;
        movieCount++;
      } else if (item.media_type === "tv") {
        stats.tv.watched++;
        if (item.watch_position / item.duration >= 0.9) {
          stats.tv.completed++;
        }
        tvWatchTime += item.watch_position;
        tvCount++;
      }
    });

    // Calculate averages
    stats.movies.avgWatchTime =
      movieCount > 0 ? movieWatchTime / movieCount : 0;
    stats.tv.avgWatchTime = tvCount > 0 ? tvWatchTime / tvCount : 0;

    // Get total counts
    stats.movies.total = movieCount;
    stats.tv.total = tvCount;

    return stats;
  } catch (error) {
    console.error("Error analyzing user preferences:", error);
    throw error;
  }
}

function calculatePreferenceScore(
  stats: MediaPreferenceStats
): ContentPreference {
  // Calculate preference scores
  const movieScore =
    (stats.movies.favorited * 2 + // Favorites are weighted more heavily
      stats.movies.completed * 1.5 + // Completed views are also important
      stats.movies.watched * 1) / // Regular views have base weight
    stats.movies.total;

  const tvScore =
    (stats.tv.favorited * 2 + stats.tv.completed * 1.5 + stats.tv.watched * 1) /
    stats.tv.total;

  // Compare scores with a threshold for "balanced"
  const threshold = 0.2; // 20% difference threshold
  const scoreDiff = Math.abs(movieScore - tvScore);

  if (scoreDiff < threshold) {
    return "balanced";
  }
  return movieScore > tvScore ? "movie" : "tv";
}

export function calculateMediaStats(
  stats: MediaPreferenceStats
): MediaPreferencesResponse {
  const total = stats.movies.total + stats.tv.total;
  const moviePercentage = total > 0 ? (stats.movies.total / total) * 100 : 0;
  const tvPercentage = total > 0 ? (stats.tv.total / total) * 100 : 0;

  return {
    stats,
    preference: calculatePreferenceScore(stats),
    moviePercentage,
    tvPercentage,
    favoriteStats: {
      movies: stats.movies.favorited,
      tv: stats.tv.favorited,
    },
    completionStats: {
      movies: {
        total: stats.movies.watched,
        completed: stats.movies.completed,
        rate:
          stats.movies.watched > 0
            ? (stats.movies.completed / stats.movies.watched) * 100
            : 0,
      },
      tv: {
        total: stats.tv.watched,
        completed: stats.tv.completed,
        rate:
          stats.tv.watched > 0
            ? (stats.tv.completed / stats.tv.watched) * 100
            : 0,
      },
    },
  };
}
