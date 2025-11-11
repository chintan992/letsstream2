import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getMovieDetails, getTVDetails, getSeasonDetails } from "@/utils/api";
// Custom API references removed
import { MovieDetails, TVDetails, VideoSource, Episode } from "@/utils/types";
import { videoSources } from "@/utils/video-sources";
import { useWatchHistory } from "@/hooks/watch-history";
import { useAuth } from "@/hooks";
import { useUserPreferences } from "@/hooks/user-preferences";
import { useToast } from "@/hooks/use-toast";

export const useMediaPlayer = (
  id: string | undefined,
  season: string | undefined,
  episode: string | undefined,
  type: string | undefined
) => {
  const { userPreferences, updatePreferences } = useUserPreferences();
  const [title, setTitle] = useState<string>("");
  const [selectedSource, setSelectedSource] = useState<string>(
    userPreferences?.preferred_source || videoSources[0].key
  );
  const [iframeUrl, setIframeUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [mediaType, setMediaType] = useState<"movie" | "tv">("movie");
  const [mediaDetails, setMediaDetails] = useState<
    MovieDetails | TVDetails | null
  >(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState<number>(0);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isPlayerLoaded, setIsPlayerLoaded] = useState(false);
  const [hasNextSeason, setHasNextSeason] = useState(false);
  const [nextSeasonNumber, setNextSeasonNumber] = useState<number | null>(null);
  const [nextSeasonHasEpisodes, setNextSeasonHasEpisodes] = useState(false);
  const watchHistoryRecorded = useRef(false);
  // Removed custom source state
  // Custom API state removed

  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const {
    addToWatchHistory,
    addToFavorites,
    addToWatchlist,
    removeFromFavorites,
    removeFromWatchlist,
    isInFavorites,
    isInWatchlist,
  } = useWatchHistory();

  const [isFavorite, setIsFavorite] = useState(false);
  const [isInMyWatchlist, setIsInMyWatchlist] = useState(false);

  useEffect(() => {
    if (user && id && mediaType) {
      const mediaId = parseInt(id, 10);
      setIsFavorite(isInFavorites(mediaId, mediaType));
      setIsInMyWatchlist(isInWatchlist(mediaId, mediaType));
    }
  }, [user, id, mediaType, isInFavorites, isInWatchlist]);

  useEffect(() => {
    if (userPreferences?.preferred_source) {
      setSelectedSource(userPreferences.preferred_source);
    }
  }, [userPreferences?.preferred_source]);

  useEffect(() => {
    if (type === "movie" || type === "tv") {
      setMediaType(type);
    }
  }, [type]);

  // Custom API effect removed

  // Custom API stream fetching effect removed

  const updateIframeUrl = useCallback(
    (mediaId: number, seasonNum?: number, episodeNum?: number) => {
      const source = videoSources.find(src => src.key === selectedSource);
      if (!source) return;
      let url;
      if (mediaType === "movie") {
        url = source.getMovieUrl(mediaId);
      } else if (mediaType === "tv" && seasonNum && episodeNum) {
        url = source.getTVUrl(mediaId, seasonNum, episodeNum);
      }
      if (url) {
        setIframeUrl(url);
        setIsPlayerLoaded(true);
      }
    },
    [selectedSource, mediaType]
  );

  useEffect(() => {
    if (
      !isPlayerLoaded ||
      !user ||
      !mediaDetails ||
      !id ||
      watchHistoryRecorded.current
    )
      return;

    if (!watchHistoryRecorded.current) {
      const mediaId = parseInt(id, 10);
      const duration =
        mediaType === "movie"
          ? (mediaDetails as MovieDetails).runtime * 60
          : ((mediaDetails as TVDetails).episode_run_time?.[0] || 30) * 60;

      watchHistoryRecorded.current = true;

      console.log("Recording initial watch history on player load");
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
    }
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
  ]);

  useEffect(() => {
    let isMounted = true;

    setIsPlayerLoaded(false);
    watchHistoryRecorded.current = false;

    const fetchMediaDetails = async () => {
      if (!id || !type) return;

      setIsLoading(true);
      setMediaDetails(null);
      setEpisodes([]);
      setIframeUrl("");
      //setStreamUrl(null);

      try {
        const mediaId = parseInt(id, 10);
        const isTV = type === "tv";

        if (!isTV) {
          const movieDetails = await getMovieDetails(mediaId);
          if (movieDetails && isMounted) {
            setTitle(movieDetails.title || "Untitled Movie");
            setMediaDetails(movieDetails);
          }
        } else if (isTV && season && episode) {
          const tvDetails = await getTVDetails(mediaId);
          if (tvDetails && isMounted) {
            const seasonData = await getSeasonDetails(
              mediaId,
              parseInt(season, 10)
            );
            if (isMounted) {
              setEpisodes(seasonData);
              const currentEpisodeNumber = parseInt(episode, 10);
              const episodeIndex = seasonData.findIndex(
                ep => ep.episode_number === currentEpisodeNumber
              );
              setCurrentEpisodeIndex(episodeIndex !== -1 ? episodeIndex : 0);

              const episodeTitle =
                seasonData.find(
                  ep => ep.episode_number === currentEpisodeNumber
                )?.name || "";
              setTitle(
                `${tvDetails.name || "Untitled Show"} - Season ${season} Episode ${episode}${episodeTitle ? ": " + episodeTitle : ""}`
              );
              setMediaDetails(tvDetails);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching media details:", error);
        if (isMounted) {
          toast({
            title: "Error loading content",
            description:
              "There was a problem loading the media. Please try again.",
            variant: "destructive",
          });
          navigate("/");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setHasInitialized(true);
        }
      }
    };

    fetchMediaDetails();

    return () => {
      isMounted = false;
    };
  }, [id, type, season, episode, navigate, toast]);

  useEffect(() => {
    if (!id || !hasInitialized || !mediaDetails) return;
    const mediaId = parseInt(id, 10);
    if (mediaType === "movie") {
      updateIframeUrl(mediaId);
    } else if (mediaType === "tv" && season && episode) {
      updateIframeUrl(mediaId, parseInt(season, 10), parseInt(episode, 10));
    }
  }, [
    id,
    mediaType,
    season,
    episode,
    hasInitialized,
    mediaDetails,
    selectedSource,
  ]);

  // Calculate next season availability when media details change
  useEffect(() => {
    if (mediaType !== "tv" || !mediaDetails || !season) {
      setHasNextSeason(false);
      setNextSeasonNumber(null);
      setNextSeasonHasEpisodes(false);
      return;
    }

    const tvDetails = mediaDetails as TVDetails;
    const currentSeasonNumber = parseInt(season, 10);

    if (!tvDetails.seasons) {
      setHasNextSeason(false);
      setNextSeasonNumber(null);
      setNextSeasonHasEpisodes(false);
      return;
    }

    // Sort seasons by season_number to handle non-sequential numbering
    const sortedSeasons = [...tvDetails.seasons].sort(
      (a, b) => a.season_number - b.season_number
    );
    const nextSeason = sortedSeasons.find(
      seasonData => seasonData.season_number > currentSeasonNumber
    );

    if (nextSeason) {
      // Validate that the next season actually has episodes
      const validateNextSeason = async () => {
        try {
          const nextSeasonDetails = await getSeasonDetails(
            parseInt(id!, 10),
            nextSeason.season_number
          );
          const hasEpisodes = nextSeasonDetails && nextSeasonDetails.length > 0;

          setHasNextSeason(hasEpisodes);
          setNextSeasonNumber(nextSeason.season_number);
          setNextSeasonHasEpisodes(hasEpisodes);
        } catch (error) {
          console.error("Error validating next season episodes:", error);
          setHasNextSeason(false);
          setNextSeasonNumber(null);
          setNextSeasonHasEpisodes(false);
        }
      };

      validateNextSeason();
    } else {
      setHasNextSeason(false);
      setNextSeasonNumber(null);
      setNextSeasonHasEpisodes(false);
    }
  }, [mediaType, mediaDetails, season, id]);

  const handleSourceChange = (sourceKey: string) => {
    setSelectedSource(sourceKey);
    setIsPlayerLoaded(false);
    watchHistoryRecorded.current = false;
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

      toast({
        title: "Navigation",
        description: `Playing next episode: ${nextEpisode.name}`,
      });
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

      toast({
        title: "New Season",
        description: `Moving to Season ${nextSeason.season_number}, Episode ${firstEp.episode_number}`,
      });
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

    toast({
      title: "Navigation",
      description: `Playing previous episode: ${prevEpisode.name}`,
    });
  };

  const toggleFavorite = () => {
    if (!mediaDetails || !id) return;

    const mediaId = parseInt(id, 10);

    if (isFavorite) {
      removeFromFavorites(mediaId, mediaType);
      setIsFavorite(false);
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
      setIsFavorite(true);
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
      setIsInMyWatchlist(false);
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
      setIsInMyWatchlist(true);
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
    isLoading,
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
  };
};

export default useMediaPlayer;
