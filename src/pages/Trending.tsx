import { useState, useEffect } from "react";
import { useScrollRestoration, usePageStatePersistence } from "@/hooks";
import {
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { getTrending } from "@/utils/api";
import { Media, ensureExtendedMediaArray } from "@/utils/types";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MediaGrid from "@/components/MediaGrid";
import { MediaGridSkeleton } from "@/components/MediaSkeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { TrendingUp, ChevronDown } from "lucide-react";

const ITEMS_PER_PAGE = 20;

// Define the interface for the persisted state
interface TrendingPageState {
  timeWindow: "day" | "week";
  page: number;
  trendingIds: number[]; // Store only IDs to minimize storage
}

const Trending = () => {
  // State for hydration tracking
  const [isHydrated, setIsHydrated] = useState(false);

  // Use page state persistence hook
  const [persistedState, setPersistedState] = usePageStatePersistence<TrendingPageState>(
    "trending-page-state",
    {
      timeWindow: "week",
      page: 1,
      trendingIds: [],
    }
  );

  // Initialize state from persisted state
  const [timeWindow, setTimeWindow] = useState<"day" | "week">(persistedState.timeWindow);
  const [page, setPage] = useState(persistedState.page);
  const queryClient = useQueryClient();
  const [allTrending, setAllTrending] = useState<Media[]>([]);

  // Apply scroll restoration only after hydration
  useScrollRestoration({ enabled: isHydrated });

  const trendingQuery = useQuery({
    queryKey: ["trending", timeWindow, page],
    queryFn: () => getTrending(timeWindow, page),
    placeholderData: keepPreviousData,
  });

  // Effect to hydrate data from persisted state
  useEffect(() => {
    // Only run once on mount to restore from persistence
    if (isHydrated || persistedState.trendingIds.length === 0) {
      // If no persisted data or already hydrated, just mark as hydrated
      if (!isHydrated) {
        setIsHydrated(true);
      }
      return;
    }

    // Hydrate trending items if we have persisted IDs
    if (persistedState.trendingIds.length > 0) {
      // Fetch all pages needed to get all persisted items
      const totalPagesNeeded = Math.ceil(persistedState.trendingIds.length / ITEMS_PER_PAGE);
      for (let page = 1; page <= totalPagesNeeded; page++) {
        queryClient.prefetchQuery({
          queryKey: ["trending", timeWindow, page],
          queryFn: () => getTrending(timeWindow, page),
        });
      }
    }
  }, [isHydrated, persistedState, timeWindow, queryClient]);

  // Effect to restore trending items from cache once they're available
  useEffect(() => {
    if (persistedState.trendingIds.length > 0 && !isHydrated) {
      // Check if all required pages are in cache
      const totalPagesNeeded = Math.ceil(persistedState.trendingIds.length / ITEMS_PER_PAGE);
      let allPagesCached = true;

      for (let page = 1; page <= totalPagesNeeded; page++) {
        if (!queryClient.getQueryData(["trending", timeWindow, page])) {
          allPagesCached = false;
          break;
        }
      }

      if (allPagesCached) {
        // Build the complete array from cached pages
        let accumulatedItems: Media[] = [];
        for (let page = 1; page <= totalPagesNeeded; page++) {
          const pageData: any[] = queryClient.getQueryData(["trending", timeWindow, page]) || [];
          const mappedItems = pageData.map(item => ({
            ...item,
            media_type: item.media_type as "movie" | "tv",
          }));
          accumulatedItems = [...accumulatedItems, ...mappedItems];
        }

        // Filter to only the items we need based on persisted IDs
        const filteredItems = accumulatedItems.filter(
          item => persistedState.trendingIds.includes(item.id)
        );

        setAllTrending(filteredItems);
        setIsHydrated(true);
      }
    }
  }, [persistedState.trendingIds, timeWindow, queryClient, isHydrated]);

  // Update accumulated trending items when new data arrives
  useEffect(() => {
    if (trendingQuery.data) {
      setAllTrending(prev => {
        const newItems = trendingQuery.data
          .filter(item => !prev.some(p => p.id === item.id))
          .map(item => ({
            ...item,
            media_type: item.media_type as "movie" | "tv",
          }));
        return [...prev, ...newItems];
      });
    }
  }, [trendingQuery.data]);

  // Prefetch next page
  useEffect(() => {
    if (trendingQuery.data?.length === ITEMS_PER_PAGE) {
      queryClient.prefetchQuery({
        queryKey: ["trending", timeWindow, page + 1],
        queryFn: () => getTrending(timeWindow, page + 1),
      });
    }
  }, [page, timeWindow, queryClient, trendingQuery.data]);

  // Effect to update persisted state when trending items change
  useEffect(() => {
    setPersistedState(prevState => ({
      ...prevState,
      timeWindow,
      page,
      trendingIds: allTrending.map(item => item.id),
    }));
  }, [timeWindow, page, allTrending, setPersistedState]);

  const handleShowMore = () => {
    setPage(prev => {
      const newPage = prev + 1;
      // Update the persisted state when page changes
      setPersistedState(prevState => ({
        ...prevState,
        page: newPage
      }));
      return newPage;
    });
  };

  // Check if there are more items to load
  const hasMore = trendingQuery.data?.length === ITEMS_PER_PAGE;

  // Reset accumulated data when changing time window
  const handleTimeWindowChange = (value: "day" | "week") => {
    setTimeWindow(value);
    setPage(1);
    setAllTrending([]);
    // Update the persisted state when time window changes
    setPersistedState(prevState => ({
      ...prevState,
      timeWindow: value,
      page: 1, // Reset page to 1
      trendingIds: [], // Clear the IDs since content will change
    }));
  };

  // Convert Media[] to ExtendedMedia[] for MediaGrid
  const extendedMedia = ensureExtendedMediaArray(allTrending);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <div className="container px-4 py-8">
          <div className="mb-8 flex items-center gap-3 pt-10">
            <TrendingUp className="h-8 w-8 text-accent" />
            <h1 className="text-3xl font-bold text-white">Trending</h1>
          </div>

          <Tabs
            defaultValue="week"
            onValueChange={value =>
              handleTimeWindowChange(value as "day" | "week")
            }
          >
            <TabsList className="mb-8">
              <TabsTrigger value="day">Today</TabsTrigger>
              <TabsTrigger value="week">This Week</TabsTrigger>
            </TabsList>

            <TabsContent value="day">
              {trendingQuery.isLoading ? (
                <MediaGridSkeleton />
              ) : trendingQuery.isError ? (
                <div className="py-12 text-center text-white">
                  Error loading trending content. Please try again.
                </div>
              ) : (
                <>
                  <MediaGrid media={extendedMedia} title="Trending Today" />

                  {hasMore && (
                    <div className="my-8 flex justify-center">
                      <Button
                        onClick={handleShowMore}
                        variant="outline"
                        className="hover:bg-accent/20 hover:border-accent/50 border-white/10 text-white transition-all duration-300 hover:text-white"
                      >
                        {trendingQuery.isFetching ? (
                          <>Loading...</>
                        ) : (
                          <>
                            Show More{" "}
                            <ChevronDown className="ml-2 h-4 w-4 animate-bounce" />
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="week">
              {trendingQuery.isLoading ? (
                <MediaGridSkeleton />
              ) : trendingQuery.isError ? (
                <div className="py-12 text-center text-white">
                  Error loading trending content. Please try again.
                </div>
              ) : (
                <>
                  <MediaGrid media={extendedMedia} title="Trending This Week" />

                  {hasMore && (
                    <div className="my-8 flex justify-center">
                      <Button
                        onClick={handleShowMore}
                        variant="outline"
                        className="hover:bg-accent/20 hover:border-accent/50 border-white/10 text-white transition-all duration-300 hover:text-white"
                      >
                        {trendingQuery.isFetching ? (
                          <>Loading...</>
                        ) : (
                          <>
                            Show More{" "}
                            <ChevronDown className="ml-2 h-4 w-4 animate-bounce" />
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Trending;
