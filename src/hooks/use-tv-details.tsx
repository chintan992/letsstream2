import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getTVDetails,
  getTVRecommendations,
  getSeasonDetails,
  getTVTrailer,
  getTVCast,
  getTVEpisode,
  getTVShowCreators,
  getTVShowImages,
  getTVShowKeywords,
  getTVShowNetworks,
  getTVShowContentRatings,
  getTVEpisodeWithGuests,
} from "@/utils/api";
import { TVDetails, Episode, Media, CastMember } from "@/utils/types";
import { useWatchHistory } from "@/hooks/watch-history";
import { useToast } from "@/hooks/use-toast";

interface Creator {
  id: number;
  name: string;
}

interface Images {
  backdrops: { file_path: string }[];
  posters: { file_path: string }[];
}

interface Keyword {
  id: number;
  name: string;
}

interface Network {
  id: number;
  name: string;
  logo_path: string;
  origin_country: string;
}

interface ContentRating {
  iso_3166_1: string;
  rating: string;
}

interface GuestStar {
  id: number;
  name: string;
}

export const useTVDetails = (id: string | undefined) => {
  const [tvShow, setTVShow] = useState<TVDetails | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "episodes" | "about" | "cast" | "reviews"
  >("episodes");
  const [recommendations, setRecommendations] = useState<Media[]>([]);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isInMyWatchlist, setIsInMyWatchlist] = useState(false);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [images, setImages] = useState<Images | null>(null);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [networks, setNetworks] = useState<Network[]>([]);
  const [contentRatings, setContentRatings] = useState<ContentRating[]>([]);
  const [guestStars, setGuestStars] = useState<GuestStar[]>([]);

  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    watchHistory,
    addToFavorites,
    addToWatchlist,
    removeFromFavorites,
    removeFromWatchlist,
    isInFavorites,
    isInWatchlist,
  } = useWatchHistory();

  useEffect(() => {
    const fetchTVData = async () => {
      if (!id) {
        setError("TV show ID is required");
        setIsLoading(false);
        return;
      }

      const tvId = parseInt(id, 10);
      if (isNaN(tvId)) {
        setError("Invalid TV show ID");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const [
          tvData,
          recommendationsData,
          castData,
          creatorsData,
          imagesData,
          keywordsData,
          networksData,
          contentRatingsData,
        ] = await Promise.all([
          getTVDetails(tvId),
          getTVRecommendations(tvId),
          getTVCast(tvId),
          getTVShowCreators(tvId),
          getTVShowImages(tvId),
          getTVShowKeywords(tvId),
          getTVShowNetworks(tvId),
          getTVShowContentRatings(tvId),
        ]);

        if (!tvData) {
          setError("TV show not found");
          return;
        }

        setTVShow(tvData);
        setRecommendations(recommendationsData);
        setCast(castData);
        setCreators(creatorsData);
        setImages(imagesData);
        setKeywords(keywordsData);
        setNetworks(networksData);
        setContentRatings(contentRatingsData);

        if (tvData.seasons && tvData.seasons.length > 0) {
          const firstSeason = tvData.seasons.find(s => s.season_number > 0);
          if (firstSeason) {
            setSelectedSeason(firstSeason.season_number);
          }
        }
      } catch (error) {
        console.error("Error fetching TV show data:", error);
        setError("Failed to load TV show data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTVData();
  }, [id]);

  useEffect(() => {
    const fetchEpisodes = async () => {
      if (!tvShow || !selectedSeason) return;

      try {
        const episodesData = await getSeasonDetails(tvShow.id, selectedSeason);
        setEpisodes(episodesData);

        // Fetch guest stars for the episodes in the selected season
        if (episodesData.length > 0) {
          const guestStarsPromises = episodesData.map(episode =>
            getTVEpisodeWithGuests(
              tvShow.id,
              selectedSeason,
              episode.episode_number
            )
          );

          const episodesWithCredits = await Promise.all(guestStarsPromises);

          // Create a mapping of episode numbers to their guest stars
          const episodeGuestStarsMap: Record<number, any[]> = {};
          episodesWithCredits.forEach((episodeData, index) => {
            if (
              episodeData &&
              episodeData.credits &&
              episodeData.credits.guest_stars
            ) {
              const episodeNumber = episodesData[index].episode_number;
              episodeGuestStarsMap[episodeNumber] =
                episodeData.credits.guest_stars;
            }
          });

          setGuestStars(episodeGuestStarsMap);
        }
      } catch (error) {
        console.error("Error fetching episodes:", error);
      }
    };

    fetchEpisodes();
  }, [tvShow, selectedSeason]);

  useEffect(() => {
    const fetchTrailer = async () => {
      if (tvShow?.id) {
        try {
          const trailerData = await getTVTrailer(tvShow.id);
          setTrailerKey(trailerData);
        } catch (error) {
          console.error("Error fetching trailer:", error);
        }
      }
    };

    fetchTrailer();
  }, [tvShow?.id]);

  useEffect(() => {
    if (tvShow?.id) {
      setIsFavorite(isInFavorites(tvShow.id, "tv"));
      setIsInMyWatchlist(isInWatchlist(tvShow.id, "tv"));
    }
  }, [tvShow?.id, isInFavorites, isInWatchlist]);

  const handlePlayEpisode = (seasonNumber: number, episodeNumber: number) => {
    if (tvShow) {
      navigate(`/watch/tv/${tvShow.id}/${seasonNumber}/${episodeNumber}`);
    }
  };

  const handleToggleFavorite = () => {
    if (!tvShow) return;

    if (isFavorite) {
      removeFromFavorites(tvShow.id, "tv");
      setIsFavorite(false);
    } else {
      addToFavorites({
        media_id: tvShow.id,
        media_type: "tv",
        title: tvShow.name,
        poster_path: tvShow.poster_path,
        backdrop_path: tvShow.backdrop_path,
        overview: tvShow.overview,
        rating: tvShow.vote_average,
      });
      setIsFavorite(true);
    }
  };

  const handleToggleWatchlist = () => {
    if (!tvShow) return;

    if (isInMyWatchlist) {
      removeFromWatchlist(tvShow.id, "tv");
      setIsInMyWatchlist(false);
    } else {
      addToWatchlist({
        media_id: tvShow.id,
        media_type: "tv",
        title: tvShow.name,
        poster_path: tvShow.poster_path,
        backdrop_path: tvShow.backdrop_path,
        overview: tvShow.overview,
        rating: tvShow.vote_average,
      });
      setIsInMyWatchlist(true);
    }
  };

  const getLastWatchedEpisode = useCallback(async (): Promise<{
    season: number;
    episode: number;
    progress: number;
    episodeTitle: string;
    episodeThumbnail: string | null;
    timeRemaining: number;
    watchPosition: number;
    duration: number;
  } | null> => {
    if (!tvShow || !watchHistory.length) return null;

    const tvWatchHistory = watchHistory.filter(
      item => item.media_id === tvShow.id && item.media_type === "tv"
    );

    if (!tvWatchHistory.length) return null;

    const lastWatched = tvWatchHistory.reduce((latest, current) => {
      return new Date(current.created_at) > new Date(latest.created_at)
        ? current
        : latest;
    });

    // Check if lastWatched and its season/episode exist before proceeding
    if (
      !lastWatched ||
      lastWatched.season === undefined ||
      lastWatched.episode === undefined
    ) {
      // If no specific season/episode data (e.g., from old entries), return null
      return null;
    }

    try {
      // Fetch episode details
      const episodeData = await getTVEpisode(
        tvShow.id,
        lastWatched.season,
        lastWatched.episode
      );

      // Calculate time remaining
      const timeRemaining = Math.max(
        0,
        lastWatched.duration - lastWatched.watch_position
      );

      // Guard for division by zero and clamp progress to [0, 100]
      const progress =
        lastWatched.duration > 0
          ? Math.min(
              100,
              Math.max(
                0,
                Math.round(
                  (lastWatched.watch_position / lastWatched.duration) * 100
                )
              )
            )
          : 0;

      return {
        season: lastWatched.season || 0,
        episode: lastWatched.episode || 0,
        progress,
        episodeTitle: episodeData.name || `Episode ${lastWatched.episode || 0}`,
        episodeThumbnail: episodeData.still_path,
        timeRemaining,
        watchPosition: lastWatched.watch_position,
        duration: lastWatched.duration,
      };
    } catch (error) {
      console.error("Error fetching episode details:", error);
      // Return basic data with fallback values if episode fetch fails
      // Guard for division by zero and clamp progress to [0, 100]
      const progress =
        lastWatched.duration > 0
          ? Math.min(
              100,
              Math.max(
                0,
                Math.round(
                  (lastWatched.watch_position / lastWatched.duration) * 100
                )
              )
            )
          : 0;

      return {
        season: lastWatched.season || 0,
        episode: lastWatched.episode || 0,
        progress,
        episodeTitle: `Episode ${lastWatched.episode || 0}`,
        episodeThumbnail: null,
        timeRemaining: Math.max(
          0,
          lastWatched.duration - lastWatched.watch_position
        ),
        watchPosition: lastWatched.watch_position,
        duration: lastWatched.duration,
      };
    }
  }, [tvShow, watchHistory]);

  return {
    tvShow,
    episodes,
    selectedSeason,
    setSelectedSeason,
    isLoading,
    error,
    activeTab,
    setActiveTab,
    recommendations,
    cast,
    trailerKey,
    isFavorite,
    isInMyWatchlist,
    handlePlayEpisode,
    handleToggleFavorite,
    handleToggleWatchlist,
    getLastWatchedEpisode,
    navigate,
    creators,
    images,
    keywords,
    networks,
    contentRatings,
    guestStars,
  };
};

export default useTVDetails;
