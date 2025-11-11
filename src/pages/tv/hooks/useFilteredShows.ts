import { useCallback } from "react";
import { Media } from "@/utils/types";
import { STREAMING_PLATFORMS } from "../constants/streamingPlatforms";

const useFilteredShows = (
  shows: Media[],
  sortBy: "default" | "name" | "first_air_date" | "rating",
  genreFilter: string,
  platformFilters: string[]
) => {
  const filterShows = useCallback(() => {
    let filteredShows = [...shows];

    // Apply genre filter
    if (genreFilter !== "all") {
      filteredShows = filteredShows.filter(show =>
        show.genre_ids?.includes(parseInt(genreFilter))
      );
    }

    // Apply platform filters
    if (platformFilters.length > 0) {
      filteredShows = filteredShows.filter(show =>
        // This is a simplified version for demo purposes
        // In a real app, we would use actual streaming data
        platformFilters.some(platformId => {
          const platformIndex = STREAMING_PLATFORMS.findIndex(
            p => p.id === platformId
          );
          return (
            show.id % (STREAMING_PLATFORMS.length + platformIndex) ===
            platformIndex
          );
        })
      );
    }

    // Apply sorting
    switch (sortBy) {
      case "name":
        filteredShows.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "first_air_date":
        filteredShows.sort(
          (a, b) =>
            new Date(b.first_air_date).getTime() -
            new Date(a.first_air_date).getTime()
        );
        break;
      case "rating":
        filteredShows.sort((a, b) => b.vote_average - a.vote_average);
        break;
      default:
        break;
    }

    return filteredShows;
  }, [shows, sortBy, genreFilter, platformFilters]);

  return filterShows();
};

export default useFilteredShows;
