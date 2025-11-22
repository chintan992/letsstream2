import { useState, useRef, useEffect, useCallback } from "react";
import { useScrollRestoration } from "@/hooks";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { History, Clock, Trash2, Bookmark, Heart, Loader2 } from "lucide-react";
import { useWatchHistory } from "@/hooks/watch-history";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MediaGrid from "@/components/MediaGrid";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks";

const WatchHistory = () => {
  const {
    watchHistory,
    clearWatchHistory,
    favorites,
    watchlist,
    deleteWatchHistoryItem,
    deleteSelectedWatchHistory,
    deleteFavoriteItem,
    deleteSelectedFavorites,
    deleteWatchlistItem,
    deleteSelectedWatchlist,
    removeFromFavorites,
    removeFromWatchlist,
    hasMore,
    isLoading,
    loadMore,
  } = useWatchHistory();
  const [activeTab, setActiveTab] = useState<
    "history" | "favorites" | "watchlist"
  >("history");
  const [isContentHydrated, setIsContentHydrated] = useState(false);

  // Reset hydration state when tab changes and set it after content loads
  useEffect(() => {
    setIsContentHydrated(false);
    const timer = setTimeout(() => {
      // Set hydrated state based on the current tab's data availability
      let isTabDataReady = false;
      if (activeTab === "history") {
        isTabDataReady = !isLoading && watchHistory.length > 0;
      } else if (activeTab === "favorites") {
        isTabDataReady = favorites.length > 0;
      } else if (activeTab === "watchlist") {
        isTabDataReady = watchlist.length > 0;
      }

      // Mark as hydrated when data is loaded for the active tab
      setIsContentHydrated(isTabDataReady);
    }, 100); // Small delay to ensure content renders

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [
    activeTab,
    isLoading,
    watchHistory.length,
    favorites.length,
    watchlist.length,
  ]);

  // Update hydration state when data changes after initial check
  useEffect(() => {
    if (isContentHydrated) {
      // Re-evaluate hydration state if data changes after being hydrated
      let isTabDataReady = false;
      if (activeTab === "history") {
        isTabDataReady = !isLoading && watchHistory.length > 0;
      } else if (activeTab === "favorites") {
        isTabDataReady = favorites.length > 0;
      } else if (activeTab === "watchlist") {
        isTabDataReady = watchlist.length > 0;
      }
      setIsContentHydrated(isTabDataReady);
    }
  }, [
    activeTab,
    isLoading,
    watchHistory.length,
    favorites.length,
    watchlist.length,
    isContentHydrated,
  ]);

  // Use tab-specific scroll restoration with hydration check
  useScrollRestoration({
    storageKey: `scroll-watch-history-${activeTab}`,
    enabled: isContentHydrated,
  });
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loader = useRef(null);

  const handleLoadMore = useCallback(async () => {
    setIsLoadingMore(true);
    await loadMore();
    setIsLoadingMore(false);
  }, [loadMore]);

  useEffect(() => {
    const currentLoader = loader.current;
    const currentObserver = new IntersectionObserver(
      entries => {
        const target = entries[0];
        if (
          target.isIntersecting &&
          hasMore &&
          !isLoadingMore &&
          activeTab === "history" &&
          watchHistory.length > 0
        ) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (currentLoader) {
      currentObserver.observe(currentLoader);
    }

    return () => {
      if (currentLoader) {
        currentObserver.unobserve(currentLoader);
      }
    };
  }, [hasMore, isLoadingMore, activeTab, handleLoadMore]);

  const handleClearHistory = () => {
    clearWatchHistory();
    toast({
      title: "Watch history cleared",
      description: "Your watch history has been successfully cleared.",
    });
  };

  const handleDeleteWatchHistoryItem = (id: string) => {
    deleteWatchHistoryItem(id);
  };

  const handleDeleteSelectedWatchHistory = (ids: string[]) => {
    deleteSelectedWatchHistory(ids);
  };

  const handleDeleteFavoriteItem = (id: string) => {
    deleteFavoriteItem(id);
  };

  const handleDeleteSelectedFavorites = (ids: string[]) => {
    deleteSelectedFavorites(ids);
  };

  const handleDeleteWatchlistItem = (id: string) => {
    deleteWatchlistItem(id);
  };

  const handleDeleteSelectedWatchlist = (ids: string[]) => {
    deleteSelectedWatchlist(ids);
  };

  // Sort watch history based on selected option (only for current page)
  const sortedWatchHistory = [...watchHistory].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
  });

  // Convert watch history items to Media format for the MediaGrid
  const watchHistoryMedia = sortedWatchHistory.map(item => ({
    id: item.media_id, // Use media_id for navigation
    media_id: item.media_id,
    title: item.title,
    name: item.title,
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    overview: item.overview || "",
    vote_average: item.rating || 0,
    media_type: item.media_type,
    genre_ids: [],
    // Additional watch info to display
    watch_position: item.watch_position,
    duration: item.duration,
    created_at: item.created_at,
    docId: item.id, // Store document ID separately for deletion
    // TV show specific info
    season: item.season,
    episode: item.episode,
    last_watched_at: item.last_watched_at,
    episodes_watched: item.episodes_watched,
  }));

  // Convert favorites to Media format
  const favoritesMedia = favorites.map(item => ({
    id: item.media_id, // Use media_id for navigation
    media_id: item.media_id,
    title: item.title,
    name: item.title,
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    overview: item.overview || "",
    vote_average: item.rating || 0,
    media_type: item.media_type,
    genre_ids: [],
    added_at: item.added_at,
    docId: item.id, // Store document ID separately for deletion
  }));

  // Convert watchlist to Media format
  const watchlistMedia = watchlist.map(item => ({
    id: item.media_id, // Use media_id for navigation
    media_id: item.media_id,
    title: item.title,
    name: item.title,
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    overview: item.overview || "",
    vote_average: item.rating || 0,
    media_type: item.media_type,
    genre_ids: [],
    added_at: item.added_at,
    docId: item.id, // Store document ID separately for deletion
  }));

  const handleTabChange = (value: string) => {
    setActiveTab(value as "history" | "favorites" | "watchlist");
  };

  const handleItemRemove = (mediaId: number, mediaType: "movie" | "tv") => {
    if (activeTab === "favorites") {
      removeFromFavorites(mediaId, mediaType);
      toast({
        title: "Removed from favorites",
        description: "The item has been removed from your favorites.",
      });
    } else if (activeTab === "watchlist") {
      removeFromWatchlist(mediaId, mediaType);
      toast({
        title: "Removed from watchlist",
        description: "The item has been removed from your watchlist.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <Navbar />

      <motion.div
        className="container mx-auto px-4 pt-24"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="glass mb-8 rounded-lg p-6">
          <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center">
              {activeTab === "history" && (
                <History className="mr-3 h-6 w-6 text-accent" />
              )}
              {activeTab === "favorites" && (
                <Heart className="mr-3 h-6 w-6 text-accent" />
              )}
              {activeTab === "watchlist" && (
                <Bookmark className="mr-3 h-6 w-6 text-accent" />
              )}
              <h1 className="text-2xl font-bold text-white">
                {activeTab === "history" && "Your Watch History"}
                {activeTab === "favorites" && "Your Favorites"}
                {activeTab === "watchlist" && "Your Watchlist"}
              </h1>
            </div>

            <div className="flex flex-wrap gap-2">
              {activeTab === "history" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSortOrder(sortOrder === "newest" ? "oldest" : "newest")
                  }
                  className="border-white/20 bg-black/50 text-white hover:bg-black/70"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  {sortOrder === "newest" ? "Newest First" : "Oldest First"}
                </Button>
              )}

              {activeTab === "history" && watchHistory.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearHistory}
                  className="border-white/20 bg-black/50 text-white hover:bg-black/70"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear History
                </Button>
              )}
            </div>
          </div>

          <Tabs
            defaultValue="history"
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="mb-4 grid grid-cols-3 border border-white/10 bg-black/20">
              <TabsTrigger
                value="history"
                className="data-[state=active]:bg-accent"
              >
                <History className="mr-2 h-4 w-4" />
                History
              </TabsTrigger>
              <TabsTrigger
                value="favorites"
                className="data-[state=active]:bg-accent"
              >
                <Heart className="mr-2 h-4 w-4" />
                Favorites
              </TabsTrigger>
              <TabsTrigger
                value="watchlist"
                className="data-[state=active]:bg-accent"
              >
                <Bookmark className="mr-2 h-4 w-4" />
                Watchlist
              </TabsTrigger>
            </TabsList>

            <TabsContent value="history" className="mt-0">
              {watchHistory.length > 0 ? (
                <>
                  <MediaGrid
                    media={watchHistoryMedia}
                    listView
                    selectable
                    onDelete={handleDeleteWatchHistoryItem}
                    onDeleteSelected={handleDeleteSelectedWatchHistory}
                  />
                  {(hasMore || isLoadingMore) && (
                    <div
                      ref={loader}
                      className="flex w-full justify-center py-4"
                    >
                      <Loader2 className="h-6 w-6 animate-spin text-accent" />
                    </div>
                  )}
                </>
              ) : (
                <div className="glass rounded-lg p-8 text-center">
                  <History className="mx-auto mb-4 h-12 w-12 text-white/50" />
                  <h3 className="mb-2 text-lg font-medium text-white">
                    No watch history yet
                  </h3>
                  <p className="mb-4 text-white/70">
                    Start watching movies and shows to build your history.
                  </p>
                  <Button onClick={() => navigate("/")}>Browse Content</Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="favorites" className="mt-0">
              {favorites.length > 0 ? (
                <MediaGrid
                  media={favoritesMedia}
                  listView
                  selectable
                  onDelete={handleDeleteFavoriteItem}
                  onDeleteSelected={handleDeleteSelectedFavorites}
                />
              ) : (
                <div className="glass rounded-lg p-8 text-center">
                  <Heart className="mx-auto mb-4 h-12 w-12 text-white/50" />
                  <h3 className="mb-2 text-lg font-medium text-white">
                    No favorites yet
                  </h3>
                  <p className="mb-4 text-white/70">
                    Add movies and shows to your favorites for quick access.
                  </p>
                  <Button onClick={() => navigate("/")}>Browse Content</Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="watchlist" className="mt-0">
              {watchlist.length > 0 ? (
                <MediaGrid
                  media={watchlistMedia}
                  listView
                  selectable
                  onDelete={handleDeleteWatchlistItem}
                  onDeleteSelected={handleDeleteSelectedWatchlist}
                />
              ) : (
                <div className="glass rounded-lg p-8 text-center">
                  <Bookmark className="mx-auto mb-4 h-12 w-12 text-white/50" />
                  <h3 className="mb-2 text-lg font-medium text-white">
                    Your watchlist is empty
                  </h3>
                  <p className="mb-4 text-white/70">
                    Add movies and shows to your watchlist to watch later.
                  </p>
                  <Button onClick={() => navigate("/")}>Browse Content</Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>

      <Footer />
    </div>
  );
};

export default WatchHistory;
