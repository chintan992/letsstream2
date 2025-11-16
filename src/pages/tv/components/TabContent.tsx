import { useState, useEffect } from "react";
import { usePageStatePersistence } from "@/hooks";
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

// Define the interface for the persisted state
interface TabContentState {
  page: number;
  showIds: number[];
}

interface TabContentProps {
  type: "popular" | "top_rated" | "trending";
  viewMode: "grid" | "list";
  sortBy: "default" | "name" | "first_air_date" | "rating";
  genreFilter: string;
  platformFilters: string[];
  onHydrationComplete?: () => void;  // Callback to notify parent when hydration is complete
  setClearState?: (clearState: () => void) => void; // Callback to register clearState function with parent
}

const TabContent = ({
  type,
  viewMode,
  sortBy,
  genreFilter,
  platformFilters,
  onHydrationComplete,
  setClearState,
}: TabContentProps) => {
  const queryClient = useQueryClient();

  // State for hydration tracking
  const [isHydrated, setIsHydrated] = useState(false);

  // Use page state persistence hook with type-specific key
  const [persistedState, setPersistedState, clearPersistedState] = usePageStatePersistence<TabContentState>(
    `tv-${type}-state`,
    {
      page: 1,
      showIds: [],
    }
  );

  // Initialize state from persisted state
  const [page, setPage] = useState(persistedState.page);
  const [allShows, setAllShows] = useState<Media[]>([]);

  // Register the clearState function with parent on mount
  useEffect(() => {
    if (setClearState) {
      setClearState(clearPersistedState);
    }
  }, [setClearState, clearPersistedState]);

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

  // Effect to hydrate data from persisted state
  useEffect(() => {
    // Only run once on mount to restore from persistence
    if (isHydrated || persistedState.showIds.length === 0) {
      // If no persisted data or already hydrated, just mark as hydrated
      if (!isHydrated) {
        setIsHydrated(true);
        if (onHydrationComplete) {
          onHydrationComplete();
        }
      }
      return;
    }

    // Hydrate shows if we have persisted IDs
    if (persistedState.showIds.length > 0) {
      // Fetch all pages needed to get all persisted shows
      const totalPagesNeeded = Math.ceil(persistedState.showIds.length / ITEMS_PER_PAGE);
      for (let pageNum = 1; pageNum <= totalPagesNeeded; pageNum++) {
        queryClient.prefetchQuery({
          queryKey: [
            type === "popular"
              ? "popularTV"
              : type === "top_rated"
                ? "topRatedTV"
                : "trendingTV",
            pageNum,
          ],
          queryFn: () => {
            switch (type) {
              case "popular":
                return getPopularTVShows(pageNum);
              case "top_rated":
                return getTopRatedTVShows(pageNum);
              case "trending":
                return getTrendingTVShows("week", pageNum);
              default:
                return getPopularTVShows(pageNum);
            }
          },
        });
      }
    }
  }, [isHydrated, persistedState, type, queryClient]);

  // Effect to restore shows from cache once they're available
  useEffect(() => {
    if (persistedState.showIds.length > 0 && !isHydrated) {
      // Check if all required pages are in cache
      const totalPagesNeeded = Math.ceil(persistedState.showIds.length / ITEMS_PER_PAGE);
      let allPagesCached = true;

      for (let pageNum = 1; pageNum <= totalPagesNeeded; pageNum++) {
        if (!queryClient.getQueryData([
          type === "popular"
            ? "popularTV"
            : type === "top_rated"
              ? "topRatedTV"
              : "trendingTV",
          pageNum,
        ])) {
          allPagesCached = false;
          break;
        }
      }

      if (allPagesCached) {
        // Build the complete array from cached pages
        let accumulatedShows: Media[] = [];
        for (let pageNum = 1; pageNum <= totalPagesNeeded; pageNum++) {
          const pageData: any[] = queryClient.getQueryData([
            type === "popular"
              ? "popularTV"
              : type === "top_rated"
                ? "topRatedTV"
                : "trendingTV",
            pageNum,
          ]) || [];
          const mappedShows = pageData.map(show => ({
            ...show,
            id: show.id || show.media_id || 0,
            media_id: show.id || show.media_id || 0,
            media_type: "tv" as "tv",
          }));
          accumulatedShows = [...accumulatedShows, ...mappedShows];
        }

        // Filter to only the shows we need based on persisted IDs
        const filteredShows = accumulatedShows.filter(
          show => persistedState.showIds.includes(show.id)
        );

        setAllShows(filteredShows);
        setIsHydrated(true);
        if (onHydrationComplete) {
          onHydrationComplete();
        }
      }
    }
  }, [persistedState.showIds, type, queryClient, isHydrated, onHydrationComplete]);

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

  // Effect to update persisted state when shows change
  useEffect(() => {
    setPersistedState(prevState => ({
      ...prevState,
      page,
      showIds: allShows.map(show => show.id),
    }));
  }, [page, allShows, setPersistedState]);

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
          onClick={() => {
            setPage(prev => {
              const newPage = prev + 1;
              // Update the persisted state when page changes
              setPersistedState(prevState => ({
                ...prevState,
                page: newPage
              }));
              return newPage;
            });
          }}
          isLoading={showsQuery.isFetching}
        />
      )}
    </>
  );
};

export default TabContent;
