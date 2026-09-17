import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MovieDetails, TVDetails } from "@/utils/types";
import { useWatchHistory } from "@/hooks/watch-history";
import { useAuth } from "@/hooks";
import { useToast } from "@/hooks/use-toast";
import { useMediaDetails } from "@/hooks/player/use-media-details";
import { useSourceSelection } from "@/hooks/player/use-source-selection";
import { useEpisodeNavigation } from "@/hooks/player/use-episode-navigation";

/**
 * Orchestrates the player page by composing focused hooks:
 * - useMediaDetails: TMDB queries + derived media state
 * - useSourceSelection: sources, selection override, iframe/API URLs
 * - useEpisodeNavigation: prev/next episode + next-season info
 *
 * This hook adds cross-cutting concerns: watch-history recording,
 * favorites/watchlist state, and player-load lifecycle.
 */
export const useMediaPlayer = (
  id: string | undefined,
  season: string | undefined,
  episode: string | undefined,
  type: string | undefined
) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const mediaType: "movie" | "tv" = type === "tv" ? "tv" : "movie";

  const {
    title,
    mediaDetails,
    episodes,
    currentEpisodeIndex,
    isMediaLoading,
    isPlaceholderData,
  } = useMediaDetails(id, season, episode, type);

  const {
    videoSources,
    selectedSource,
    setSelectedSource,
    iframeUrl,
    isApiSource,
    streamLinks,
    apiLoading,
    apiError,
    isSourcesLoading,
  } = useSourceSelection(id, season, episode, mediaType);

  const {
    goToNextEpisode,
    goToPreviousEpisode,
    hasNextSeason,
    nextSeasonNumber,
    nextSeasonHasEpisodes,
  } = useEpisodeNavigation(
    id,
    season,
    episodes,
    currentEpisodeIndex,
    mediaDetails as TVDetails | null,
    mediaType
  );

  const [isPlayerLoaded, setIsPlayerLoaded] = useState(false);
  const watchHistoryRecorded = useRef<string | null>(null);

  const {
    addToWatchHistory,
    addToFavorites,
    addToWatchlist,
    removeFromFavorites,
    removeFromWatchlist,
    isInFavorites,
    isInWatchlist,
  } = useWatchHistory();

  // Favorite / watchlist membership derived from the reactive watch-history
  // context — re-renders automatically when the store updates.
  const mediaIdNumber = id ? parseInt(id, 10) : null;
  const isFavorite =
    !!user && mediaIdNumber !== null
      ? isInFavorites(mediaIdNumber, mediaType)
      : false;
  const isInMyWatchlist =
    !!user && mediaIdNumber !== null
      ? isInWatchlist(mediaIdNumber, mediaType)
      : false;

  // Reset player-load state when the route changes (React "adjust state during
  // render" pattern — no effect needed). Watch-history recording is guarded by
  // storing the recorded route key in the ref instead of a manual reset.
  const routeKey = `${id}/${type}/${season}/${episode}`;
  const [prevRouteKey, setPrevRouteKey] = useState(routeKey);
  if (routeKey !== prevRouteKey) {
    setPrevRouteKey(routeKey);
    setIsPlayerLoaded(false);
  }

  useEffect(() => {
    if (
      !isPlayerLoaded ||
      !user ||
      !mediaDetails ||
      isPlaceholderData ||
      !id ||
      watchHistoryRecorded.current === routeKey
    )
      return;

    const mediaId = parseInt(id, 10);
    const duration =
      mediaType === "movie"
        ? (mediaDetails as MovieDetails).runtime * 60
        : ((mediaDetails as TVDetails).episode_run_time?.[0] || 30) * 60;

    watchHistoryRecorded.current = routeKey;

    addToWatchHistory(
      {
        id: mediaId,
        title:
          (mediaDetails as MovieDetails).title ||
          (mediaDetails as TVDetails).name ||
          "",
        poster_path: mediaDetails.poster_path,
        backdrop_path: mediaDetails.backdrop_path,
        overview: mediaDetails.overview,
        vote_average: mediaDetails.vote_average,
        media_type: mediaType,
        genre_ids: mediaDetails.genres.map(g => g.id),
      },
      0, // Initial position
      duration,
      season ? parseInt(season, 10) : undefined,
      episode ? parseInt(episode, 10) : undefined,
      selectedSource
    );
  }, [
    isPlayerLoaded,
    user,
    mediaDetails,
    isPlaceholderData,
    id,
    mediaType,
    season,
    episode,
    selectedSource,
    addToWatchHistory,
    routeKey,
  ]);

  const handleSourceChange = (sourceKey: string) => {
    setSelectedSource(sourceKey);
    setIsPlayerLoaded(false);
    watchHistoryRecorded.current = null;
  };

  const goToDetails = () => {
    if (id) {
      navigate(`/${mediaType}/${id}`);
    }
  };

  const toggleFavorite = () => {
    if (!mediaDetails || !id) return;

    const mediaId = parseInt(id, 10);

    if (isFavorite) {
      removeFromFavorites(mediaId, mediaType);
      toast({
        title: "Removed from favorites",
        description: `${title} has been removed from your favorites.`,
      });
    } else {
      addToFavorites({
        media_id: mediaId,
        media_type: mediaType,
        title:
          (mediaDetails as MovieDetails).title ||
          (mediaDetails as TVDetails).name ||
          "",
        poster_path: mediaDetails.poster_path,
        backdrop_path: mediaDetails.backdrop_path,
        overview: mediaDetails.overview,
        rating: mediaDetails.vote_average,
      });
      toast({
        title: "Added to favorites",
        description: `${title} has been added to your favorites.`,
      });
    }
  };

  const toggleWatchlist = () => {
    if (!mediaDetails || !id) return;

    const mediaId = parseInt(id, 10);

    if (isInMyWatchlist) {
      removeFromWatchlist(mediaId, mediaType);
      toast({
        title: "Removed from watchlist",
        description: `${title} has been removed from your watchlist.`,
      });
    } else {
      addToWatchlist({
        media_id: mediaId,
        media_type: mediaType,
        title:
          (mediaDetails as MovieDetails).title ||
          (mediaDetails as TVDetails).name ||
          "",
        poster_path: mediaDetails.poster_path,
        backdrop_path: mediaDetails.backdrop_path,
        overview: mediaDetails.overview,
        rating: mediaDetails.vote_average,
      });
      toast({
        title: "Added to watchlist",
        description: `${title} has been added to your watchlist.`,
      });
    }
  };

  const handlePlayerLoaded = () => {
    setIsPlayerLoaded(true);
  };

  const handlePlayerError = (error: string) => {
    setIsPlayerLoaded(false);
    toast({
      title: "Playback Error",
      description: error,
      variant: "destructive",
    });
  };

  return {
    title,
    mediaType,
    mediaDetails,
    episodes,
    currentEpisodeIndex,
    isLoading: isMediaLoading || isSourcesLoading,
    isPlayerLoaded,
    iframeUrl,
    selectedSource,
    isFavorite,
    isInMyWatchlist,
    hasNextSeason,
    nextSeasonNumber,
    nextSeasonHasEpisodes,
    handleSourceChange,
    goToDetails,
    goToNextEpisode,
    goToPreviousEpisode,
    toggleFavorite,
    toggleWatchlist,
    handlePlayerLoaded,
    handlePlayerError,
    goBack: () => navigate(-1),
    // StreamFlix API source state
    isApiSource,
    streamLinks,
    apiLoading,
    apiError,
    videoSources,
  };
};
