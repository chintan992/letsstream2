import { useState, useEffect } from "react";
import { usePageStatePersistence } from "@/hooks";
import { useInfiniteQuery } from "@tanstack/react-query";
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

// Define the interface for the persisted state
interface TabContentState {
  // We only persist the page number to know how much to fetch if needed,
  // but for now we'll just rely on infinite query's internal state and cache.
  // Keeping it simple.
}

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
  // Determine which query to use based on type
  const getQueryFn = ({ pageParam = 1 }) => {
    switch (type) {
      case "popular":
        return getPopularTVShows(pageParam);
      case "top_rated":
        return getTopRatedTVShows(pageParam);
      case "trending":
        return getTrendingTVShows("week", pageParam);
      default:
        return getPopularTVShows(pageParam);
    }
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: [
      type === "popular"
        ? "popularTV"
        : type === "top_rated"
          ? "topRatedTV"
          : "trendingTV",
    ],
    queryFn: getQueryFn,
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      // Assuming API returns empty array or less than 20 items when no more pages
      return lastPage.length === 20 ? allPages.length + 1 : undefined;
    },
  });

  // Flatten the pages into a single array of shows
  const allShows = data?.pages.flatMap(page => page) || [];

  // Filter shows based on current criteria
  const filteredShows = useFilteredShows(
    allShows,
    sortBy,
    genreFilter,
    platformFilters
  );

  // Loading state handler
  if (isLoading) {
    return <MediaGridSkeleton listView={viewMode === "list"} />;
  }

  // Error state handler
  if (isError) {
    return (
      <div className="py-12 text-center text-white">
        Error loading TV shows. Please try again.
      </div>
    );
  }

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
      {hasNextPage && (
        <ShowMoreButton
          onClick={() => fetchNextPage()}
          isLoading={isFetchingNextPage}
        />
      )}
    </>
  );
};

export default TabContent;
