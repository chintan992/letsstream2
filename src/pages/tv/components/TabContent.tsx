import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPopularTVShows,
  getTopRatedTVShows,
  getTrendingTVShows,
} from "@/utils/api";
import { Media, ensureExtendedMediaArray } from "@/utils/types";
import MediaGrid from "@/components/MediaGrid";
import { MediaGridSkeleton } from "@/components/MediaSkeleton";
import ShowMoreButton from "./ShowMoreButton";
import useFilteredShows from "../hooks/useFilteredShows";

const ITEMS_PER_PAGE = 20;

interface TabContentProps {
  type: "popular" | "top_rated" | "trending";
  viewMode: "grid" | "list";
  sortBy: "default" | "name" | "first_air_date" | "rating";
  genreFilter: string;
  platformFilters: string[];
}

const TabContent = ({
  type,
  viewMode,
  sortBy,
  genreFilter,
  platformFilters,
}: TabContentProps) => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [allShows, setAllShows] = useState<Media[]>([]);

  // Determine which query to use based on type
  const getQueryFn = () => {
    switch (type) {
      case "popular":
        return () => getPopularTVShows(page);
      case "top_rated":
        return () => getTopRatedTVShows(page);
      case "trending":
        return () => getTrendingTVShows("week", page);
      default:
        return () => getPopularTVShows(page);
    }
  };

  const showsQuery = useQuery({
    queryKey: [
      type === "popular"
        ? "popularTV"
        : type === "top_rated"
          ? "topRatedTV"
          : "trendingTV",
      page,
    ],
    queryFn: getQueryFn(),
  });

  // Filter shows based on current criteria
  const filteredShows = useFilteredShows(
    allShows,
    sortBy,
    genreFilter,
    platformFilters
  );

  // Effect to update the collection of all shows when new data is fetched
  useEffect(() => {
    if (showsQuery.data) {
      console.log(`Raw ${type} TV Data:`, showsQuery.data);
      setAllShows(prev => {
        const newShows = showsQuery.data
          .filter(show => !prev.some(p => p.id === (show.id || show.media_id)))
          .map(show => {
            return {
              ...show,
              id: show.id || show.media_id || 0,
              media_id: show.id || show.media_id || 0,
              media_type: "tv" as "tv",
            };
          });
        return [...prev, ...newShows];
      });
    }
  }, [showsQuery.data, type]);

  // Prefetch next page
  useEffect(() => {
    if (showsQuery.data?.length === ITEMS_PER_PAGE) {
      queryClient.prefetchQuery({
        queryKey: [
          type === "popular"
            ? "popularTV"
            : type === "top_rated"
              ? "topRatedTV"
              : "trendingTV",
          page + 1,
        ],
        queryFn: () => {
          switch (type) {
            case "popular":
              return getPopularTVShows(page + 1);
            case "top_rated":
              return getTopRatedTVShows(page + 1);
            case "trending":
              return getTrendingTVShows("week", page + 1);
            default:
              return getPopularTVShows(page + 1);
          }
        },
      });
    }
  }, [page, queryClient, showsQuery.data, type]);

  // Loading state handler
  if (showsQuery.isLoading) {
    return <MediaGridSkeleton listView={viewMode === "list"} />;
  }

  // Error state handler
  if (showsQuery.isError) {
    return (
      <div className="py-12 text-center text-white">
        Error loading TV shows. Please try again.
      </div>
    );
  }

  // Determine if there are more shows to fetch
  const hasMoreShows = showsQuery.data?.length === ITEMS_PER_PAGE;

  // Determine the title based on the type
  const title =
    type === "popular"
      ? "Popular TV Shows"
      : type === "top_rated"
        ? "Top Rated TV Shows"
        : "Trending TV Shows";

  return (
    <>
      <MediaGrid
        media={ensureExtendedMediaArray(filteredShows)}
        title={title}
        listView={viewMode === "list"}
      />
      {hasMoreShows && (
        <ShowMoreButton
          onClick={() => setPage(prev => prev + 1)}
          isLoading={showsQuery.isFetching}
        />
      )}
    </>
  );
};

export default TabContent;
