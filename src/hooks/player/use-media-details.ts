import { useMemo } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getMovieDetails, getTVDetails, getSeasonDetails } from "@/utils/api";
import { TVDetails, Episode } from "@/utils/types";

/**
 * Fetches and derives core media data (details, episodes, title) using
 * react-query. `keepPreviousData` keeps the previous episode's data visible
 * while the next one loads — no full-page loading flicker.
 */
export function useMediaDetails(
  id: string | undefined,
  season: string | undefined,
  episode: string | undefined,
  type: string | undefined
) {
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
      const seasonData = await getSeasonDetails(mediaId, parseInt(season, 10));
      const currentEpisodeNumber = parseInt(episode, 10);
      const episodeIndex = seasonData.findIndex(
        ep => ep.episode_number === currentEpisodeNumber
      );
      const episodeTitle =
        seasonData.find(ep => ep.episode_number === currentEpisodeNumber)
          ?.name || "";
      return {
        ...tvDetails,
        episodes: seasonData,
        currentEpisodeIndex: episodeIndex !== -1 ? episodeIndex : 0,
        title: `${tvDetails.name || "Untitled Show"} - Season ${season} Episode ${episode}${
          episodeTitle ? ": " + episodeTitle : ""
        }`,
      };
    },
    enabled: !!id && type === "tv" && !!season && !!episode,
    staleTime: 1000 * 60 * 60 * 24,
    placeholderData: keepPreviousData,
  });

  const mediaDetails = useMemo(() => {
    if (type === "movie" && movieQuery.data) return movieQuery.data;
    if (type === "tv" && tvQuery.data) return tvQuery.data as TVDetails;
    return null;
  }, [type, movieQuery.data, tvQuery.data]);

  const title = useMemo(() => {
    if (type === "movie" && movieQuery.data)
      return movieQuery.data.title || "Untitled Movie";
    if (type === "tv" && tvQuery.data)
      return tvQuery.data.title || "Untitled Show";
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

  const isMediaLoading = movieQuery.isLoading || tvQuery.isLoading;
  const isPlaceholderData =
    type === "movie" ? movieQuery.isPlaceholderData : tvQuery.isPlaceholderData;

  return {
    title,
    mediaDetails,
    episodes,
    currentEpisodeIndex,
    isMediaLoading,
    isPlaceholderData,
  };
}
