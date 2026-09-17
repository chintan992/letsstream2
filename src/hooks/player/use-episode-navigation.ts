import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getSeasonDetails } from "@/utils/api";
import { TVDetails, Episode } from "@/utils/types";
import { useToast } from "@/hooks/use-toast";

/**
 * Episode navigation: prev/next episode within a season, seamless jump into
 * the next season, and derived next-season availability (validated via a
 * cached react-query fetch).
 */
export function useEpisodeNavigation(
  id: string | undefined,
  season: string | undefined,
  episodes: Episode[],
  currentEpisodeIndex: number,
  mediaDetails: TVDetails | null,
  mediaType: "movie" | "tv"
) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const goToNextEpisode = async () => {
    if (mediaType !== "tv" || !id || !season || episodes.length === 0) {
      return;
    }

    // Check if we're at the last episode of the current season
    const isLastEpisodeOfSeason = currentEpisodeIndex >= episodes.length - 1;

    if (!isLastEpisodeOfSeason) {
      const nextEpisode = episodes[currentEpisodeIndex + 1];
      navigate(`/watch/tv/${id}/${season}/${nextEpisode.episode_number}`);
      return;
    }

    // We're at the last episode of the season, check for next season
    try {
      const currentSeasonNumber = parseInt(season, 10);

      if (!mediaDetails?.seasons) {
        toast({
          title: "Final Episode",
          description: "You've reached the final episode",
          variant: "destructive",
        });
        return;
      }

      // Sort seasons by season_number to handle non-sequential numbering
      const sortedSeasons = [...mediaDetails.seasons].sort(
        (a, b) => a.season_number - b.season_number
      );
      const nextSeason = sortedSeasons.find(
        s => s.season_number > currentSeasonNumber
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

  // Derive the next available season from media details (memoized, no setState)
  const nextSeasonCandidate = useMemo(() => {
    if (mediaType !== "tv" || !mediaDetails || !season) return null;
    if (!mediaDetails.seasons) return null;
    const currentSeasonNumber = parseInt(season, 10);
    const sortedSeasons = [...mediaDetails.seasons].sort(
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

  return {
    goToNextEpisode,
    goToPreviousEpisode,
    hasNextSeason,
    nextSeasonNumber,
    nextSeasonHasEpisodes,
  };
}
