import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getMovieDetails, getTVDetails, getSeasonDetails } from "@/utils/api";
// Custom API references removed
import { MovieDetails, TVDetails, VideoSource, Episode } from "@/utils/types";
import { fetchVideoSources } from "@/utils/video-source-loader";
import { useWatchHistory } from "@/hooks/watch-history";
import { useAuth } from "@/hooks";
import { useUserPreferences } from "@/hooks/user-preferences";
import { useToast } from "@/hooks/use-toast";
import { useStreamFlixApi } from "@/hooks/use-streamflix-api";

export const useMediaPlayer = (
  id: string | undefined,
  season: string | undefined,
  episode: string | undefined,
  type: string | undefined
) => {
  const { userPreferences, updatePreferences } = useUserPreferences();
  const { user } = useAuth();

  const { data: fetchedSources = [], isLoading: isSourcesLoading } = useQuery({
    queryKey: ["videoSources"],
    queryFn: fetchVideoSources,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  // ---------------------------------------------------------------------------
  // Movie / TV media fetch queries (react‑query) — keepPreviousData prevents
  // the loading flicker when navigating between episodes.
  // ---------------------------------------------------------------------------

  const movieQuery = useQuery({
    queryKey: ["movie-media", id],
    queryFn: async () => {
      if (!id || type !== "movie") return null;
      const mediaId = parseInt(id, 10);
      return await getMovieDetails(mediaId);
    },
    enabled: !!id && type === "movie",
    staleTime: 1000 * 60 * 60 * 24,
    placeholderData: keepPreviousData,
  });

  const tvQuery = useQuery({
    queryKey: ["tv-media", id, season, episode],
    queryFn: async () => {
      if (!id || type !== "tv" || !season || !episode) return null;
      const mediaId = parseInt(id, 10);
      const tvDetails = await getTVDetails(mediaId);
      if (!tvDetails) return null;
      const seasonData = await getSeasonDetails(
        mediaId,
        parseInt(season, 10)
      );
      const currentEpisodeNumber = parseInt(episode, 10);
      const episodeIndex = seasonData.findIndex(
        ep => ep.episode_number === currentEpisodeNumber
      );
      const episodeTitle =
        seasonData.find(
          ep => ep.episode_number === currentEpisodeNumber
        )?.name || "";
      return {
        ...tvDetails,
        episodes: seasonData,
        currentEpisodeIndex:
          episodeIndex !== -1 ? episodeIndex : 0,
        title: `${tvDetails.name || "Untitled Show"} - Season ${season} Episode ${episode}${
          episodeTitle ? ": " + episodeTitle : ""
        }`,
      };
    },
    enabled: !!id && type === "tv" && !!season && !!episode,
    staleTime: 1000 * 60 * 60 * 24,
    placeholderData: keepPreviousData,
  });

  // ---------------------------------------------------------------------------
  // Derived media state from queries
  // ---------------------------------------------------------------------------

  const mediaDetails = useMemo(() => {
    if (type === "movie" && movieQuery.data) return movieQuery.data;
    if (type === "tv" && tvQuery.data) return tvQuery.data as TVDetails;
    return null;
  }, [type, movieQuery.data, tvQuery.data]);

  const title = useMemo(() => {
    if (type === "movie" && movieQuery.data)
      return movieQuery.data.title || "Untitled Movie";
    if (type === "tv" && tvQuery.data) return tvQuery.data.title || "Untitled Show";
    return "";
  }, [type, movieQuery.data, tvQuery.data]);

  const episodes = useMemo(() => {
    if (type === "tv" && tvQuery.data?.episodes) return tvQuery.data.episodes;
    return [] as Episode[];
  }, [type, tvQuery.data]);

  const currentEpisodeIndex = useMemo(() => {
    if (type === "tv" && tvQuery.data?.currentEpisodeIndex !== undefined)
      return tvQuery.data.currentEpisodeIndex;
    return 0;
  }, [type, tvQuery.data]);

  const isMediaLoading = movieQuery.isLoading || tvQuery.isLoading || isSourcesLoading;

  // Filter sources: hide requiresAuth sources from unauthenticated users
  const videoSources = useMemo(() => {
    return fetchedSources.filter(src => {
      if (src.requiresAuth && !user) return false;
      return true;
    });
  }, [fetchedSources, user]);

  // Selected source: manual override wins, otherwise user preference, otherwise
  // the first available source. Derived — no effect needed to keep it in sync.
  const [sourceOverride, setSourceOverride] = useState<string | null>(null);
  const selectedSource =
    sourceOverride ??
    userPreferences?.preferred_source ??
    (videoSources.length > 0 ? videoSources[0].key : "");

  const mediaType: "movie" | "tv" = type === "tv" ? "tv" : "movie";

  // iframe URL derived directly from route params + selected source.
  // Recomputes on source change; VideoPlayer remounts via key={iframeUrl}.
  const iframeUrl = useMemo(() => {
    if (!id) return "";
    const source = videoSources.find(src => src.key === selectedSource);
    if (!source) return "";
    const mediaId = parseInt(id, 10);
    if (mediaType === "movie") {
      return source.getMovieUrl(mediaId);
    }
    if (mediaType === "tv" && season && episode) {
      return source.getTVUrl(mediaId, parseInt(season, 10), parseInt(episode, 10));
    }
    return "";
  }, [id, mediaType, season, episode, selectedSource, videoSources]);
  const [isPlayerLoaded, setIsPlayerLoaded] = useState(false);
  const watchHistoryRecorded = useRef<string | null>(null);
  // Removed custom source state
  // Custom API state removed

  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    addToWatchHistory,
    addToFavorites,
    addToWatchlist,
    removeFromFavorites,
    removeFromWatchlist,
    isInFavorites,
    isInWatchlist,
  } = useWatchHistory();

  // Detect if current source is an API source
  const currentSource = useMemo(
    () => videoSources.find(src => src.key === selectedSource),
    [selectedSource, videoSources]
  );
  const isApiSource = currentSource?.isApiSource || false;

  // Compute the API URL for StreamFlix sources
  const apiUrl = useMemo(() => {
    if (!isApiSource || !currentSource || !id) return null;
    const mediaId = parseInt(id, 10);
    if (mediaType === "movie") {
      return currentSource.getMovieUrl(mediaId) as string;
    } else if (mediaType === "tv" && season && episode) {
      return currentSource.getTVUrl(
        mediaId,
        parseInt(season, 10),
        parseInt(episode, 10)
      ) as string;
    }
    return null;
  }, [isApiSource, currentSource, id, mediaType, season, episode]);

  // Fetch streaming links when using an API source
  const {
    links: streamLinks,
    isLoading: apiLoading,
    error: apiError,
  } = useStreamFlixApi(apiUrl);

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

  // Custom API effect removed

  // Custom API stream fetching effect removed

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
    id,
    mediaType,
    season,
    episode,
    selectedSource,
    addToWatchHistory,
    routeKey,
  ]);

  // Derive the next available season from media details (memoized, no setState)
  const nextSeasonCandidate = useMemo(() => {
    if (mediaType !== "tv" || !mediaDetails || !season) return null;
    const tvDetails = mediaDetails as TVDetails;
    if (!tvDetails.seasons) return null;
    const currentSeasonNumber = parseInt(season, 10);
    const sortedSeasons = [...tvDetails.seasons].sort(
      (a, b) => a.season_number - b.season_number
    );
    return (
      sortedSeasons.find(s => s.season_number > currentSeasonNumber) ?? null
    );
  }, [mediaType, mediaDetails, season]);

  // Validate the next season actually has episodes (react-query, cached)
  const { data: nextSeasonEpisodes } = useQuery({
    queryKey: ["tv-season-episodes", id, nextSeasonCandidate?.season_number],
    queryFn: async () => {
      if (!id || !nextSeasonCandidate) return [];
      return await getSeasonDetails(
        parseInt(id, 10),
        nextSeasonCandidate.season_number
      );
    },
    enabled: !!id && !!nextSeasonCandidate,
    staleTime: 1000 * 60 * 60 * 24,
  });

  const nextSeasonNumber = nextSeasonCandidate?.season_number ?? null;
  const nextSeasonHasEpisodes =
    !!nextSeasonEpisodes && nextSeasonEpisodes.length > 0;
  const hasNextSeason = nextSeasonNumber !== null && nextSeasonHasEpisodes;

  const handleSourceChange = (sourceKey: string) => {
    setSourceOverride(sourceKey);
    setIsPlayerLoaded(false);
    watchHistoryRecorded.current = null;
  };

  const goToDetails = () => {
    if (id) {
      navigate(`/${mediaType}/${id}`);
    }
  };

  const goToNextEpisode = async () => {
    if (mediaType !== "tv" || !id || !season || episodes.length === 0) {
      return;
    }

    // Check if we're at the last episode of the current season
    const isLastEpisodeOfSeason = currentEpisodeIndex >= episodes.length - 1;

    if (!isLastEpisodeOfSeason) {
      // Normal next episode within current season
      const nextEpisode = episodes[currentEpisodeIndex + 1];
      navigate(`/watch/tv/${id}/${season}/${nextEpisode.episode_number}`);
      return;
    }

    // We're at the last episode of the season, check for next season
    try {
      const currentSeasonNumber = parseInt(season, 10);
      const tvDetails = mediaDetails as TVDetails;

      if (!tvDetails?.seasons) {
        toast({
          title: "Final Episode",
          description: "You've reached the final episode",
          variant: "destructive",
        });
        return;
      }

      // Sort seasons by season_number to handle non-sequential numbering
      const sortedSeasons = [...tvDetails.seasons].sort(
        (a, b) => a.season_number - b.season_number
      );
      const nextSeason = sortedSeasons.find(
        seasonData => seasonData.season_number > currentSeasonNumber
      );

      if (!nextSeason) {
        toast({
          title: "Final Episode",
          description: "You've reached the final episode of the series",
          variant: "destructive",
        });
        return;
      }

      // Fetch episodes for the next season
      const nextSeasonDetails = await getSeasonDetails(
        parseInt(id, 10),
        nextSeason.season_number
      );

      if (!nextSeasonDetails || nextSeasonDetails.length === 0) {
        toast({
          title: "Season Not Available",
          description: "The next season doesn't have episodes available yet",
          variant: "destructive",
        });
        return;
      }

      // Navigate to the first episode of the next season
      const firstEp = nextSeasonDetails[0];
      navigate(
        `/watch/tv/${id}/${nextSeason.season_number}/${firstEp.episode_number}`
      );
    } catch (error) {
      console.error("Error fetching next season:", error);
      toast({
        title: "Navigation Error",
        description: "Unable to fetch the next season. Please try again.",
        variant: "destructive",
      });
    }
  };

  const goToPreviousEpisode = () => {
    if (
      mediaType !== "tv" ||
      !id ||
      !season ||
      episodes.length === 0 ||
      currentEpisodeIndex <= 0
    ) {
      return;
    }

    const prevEpisode = episodes[currentEpisodeIndex - 1];
    navigate(`/watch/tv/${id}/${season}/${prevEpisode.episode_number}`);
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
    isLoading: isMediaLoading,
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
