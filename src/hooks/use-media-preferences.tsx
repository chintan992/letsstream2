import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks";
import {
  analyzeUserPreferences,
  calculateMediaStats,
  type MediaPreferenceStats,
  type MediaPreferencesResponse,
  type PreferenceTimePeriod,
  type ContentPreference,
} from "@/utils/media-preferences";

interface UseMediaPreferencesOptions {
  period?: PreferenceTimePeriod;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseMediaPreferencesReturn extends MediaPreferencesResponse {
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setTimePeriod: (period: PreferenceTimePeriod) => void;
}

export function useMediaPreferences(
  options: UseMediaPreferencesOptions = {}
): UseMediaPreferencesReturn {
  const {
    period: initialPeriod = "all",
    autoRefresh = false,
    refreshInterval = 5 * 60 * 1000, // 5 minutes
  } = options;

  const { user } = useAuth();
  const [stats, setStats] = useState<MediaPreferenceStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<PreferenceTimePeriod>(initialPeriod);

  const fetchPreferences = useCallback(async () => {
    if (!user) {
      setStats(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const preferences = await analyzeUserPreferences(user.uid, period);
      setStats(preferences);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load preferences"
      );
      console.error("Error loading media preferences:", err);
    } finally {
      setLoading(false);
    }
  }, [user, period]);

  // Initial fetch
  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh || !user) return;

    const intervalId = setInterval(() => {
      fetchPreferences();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, fetchPreferences, user]);

  const defaultResponse: MediaPreferencesResponse = {
    stats: {
      movies: {
        total: 0,
        favorited: 0,
        watched: 0,
        completed: 0,
        avgWatchTime: 0,
      },
      tv: { total: 0, favorited: 0, watched: 0, completed: 0, avgWatchTime: 0 },
    },
    preference: "balanced",
    moviePercentage: 0,
    tvPercentage: 0,
    favoriteStats: { movies: 0, tv: 0 },
    completionStats: {
      movies: { total: 0, completed: 0, rate: 0 },
      tv: { total: 0, completed: 0, rate: 0 },
    },
  };

  const response = stats ? calculateMediaStats(stats) : defaultResponse;

  return {
    ...response,
    loading,
    error,
    refresh: fetchPreferences,
    setTimePeriod: setPeriod,
  };
}
