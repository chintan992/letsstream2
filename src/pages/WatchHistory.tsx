import { useState, useRef, useEffect, useCallback } from "react";
import { useScrollRestoration } from "@/hooks";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { History, Clock, Trash2, Bookmark, Heart, Loader2, Cloud, RefreshCw } from "lucide-react";
import { useWatchHistory } from "@/hooks/watch-history";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MediaGrid from "@/components/MediaGrid";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks";
import { useUserPreferences } from "@/hooks/user-preferences";
import { SimklService, SimklListItem, getLastWatchedEpisode } from "@/lib/simkl";

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
  const { userPreferences } = useUserPreferences();
  const [activeTab, setActiveTab] = useState<
    "history" | "favorites" | "watchlist" | "simkl"
  >("history");
  const [isContentHydrated, setIsContentHydrated] = useState(false);

  // Simkl watch history state
  const [simklHistory, setSimklHistory] = useState<SimklListItem[]>([]);
  const [isLoadingSimkl, setIsLoadingSimkl] = useState(false);
  const [simklError, setSimklError] = useState<string | null>(null);

  // Fetch Simkl watch history when tab is selected
  const fetchSimklHistory = useCallback(async () => {
    if (!userPreferences?.isSimklEnabled || !userPreferences?.simklToken) {
      return;
    }

    setIsLoadingSimkl(true);
    setSimklError(null);

    try {
      const data = await SimklService.getFullWatchHistory(userPreferences.simklToken);

      // Combine all types into one array
      const allItems = [
        ...data.movies,
        ...data.shows,
        ...data.anime,
      ].sort((a, b) => {
        // Sort by last watched date, newest first
        const dateA = new Date(a.last_watched_at || a.last_watched || 0).getTime();
        const dateB = new Date(b.last_watched_at || b.last_watched || 0).getTime();
        return dateB - dateA;
      });
      setSimklHistory(allItems);


    } catch (error) {
      console.error("Failed to fetch Simkl history:", error);
      setSimklError("Failed to load Simkl watch history");
    } finally {
      setIsLoadingSimkl(false);
    }
  }, [userPreferences?.isSimklEnabled, userPreferences?.simklToken]);

  // Fetch Simkl data when tab is selected
  useEffect(() => {
    if (activeTab === "simkl" && userPreferences?.isSimklEnabled && simklHistory.length === 0 && !isLoadingSimkl) {
      fetchSimklHistory();
    }
  }, [activeTab, userPreferences?.isSimklEnabled, simklHistory.length, isLoadingSimkl, fetchSimklHistory]);

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
      } else if (activeTab === "simkl") {
        isTabDataReady = !isLoadingSimkl && simklHistory.length > 0;
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
    isLoadingSimkl,
    watchHistory.length,
    favorites.length,
    watchlist.length,
    simklHistory.length,
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
      } else if (activeTab === "simkl") {
        isTabDataReady = !isLoadingSimkl && simklHistory.length > 0;
      }
      setIsContentHydrated(isTabDataReady);
    }
  }, [
    activeTab,
    isLoading,
    isLoadingSimkl,
    watchHistory.length,
    favorites.length,
    watchlist.length,
    simklHistory.length,
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

  // Convert Simkl items to Media format
  const simklMedia = simklHistory.map(item => {
    const media = item.movie || item.show || item.anime;
    const isMovie = !!item.movie;

    // Simkl poster: use wsrv.nl CDN. The poster value is a hash.
    const simklPosterUrl = media?.poster
      ? `https://wsrv.nl/?url=https://simkl.in/posters/${media.poster}_m.webp`
      : null;

    // Get last watched episode info for TV shows/anime
    const lastEpisode = !isMovie ? getLastWatchedEpisode(item) : null;

    // Format year as date string for consistency with TMDB format
    const yearStr = media?.year ? `${media.year}-01-01` : undefined;

    return {
      id: media?.ids?.tmdb || media?.ids?.simkl || 0,
      media_id: media?.ids?.tmdb || media?.ids?.simkl || 0,
      title: media?.title || "Unknown",
      name: media?.title || "Unknown",
      // Use custom_poster_url for full external URLs (Simkl CDN)
      poster_path: null,
      custom_poster_url: simklPosterUrl,
      backdrop_path: null,
      overview: "",
      vote_average: item.user_rating || 0,
      media_type: isMovie ? "movie" as const : "tv" as const,
      genre_ids: [],
      // Year info for display (same format as TMDB)
      release_date: isMovie ? yearStr : undefined,
      first_air_date: !isMovie ? yearStr : undefined,
      // Timestamp for "watched X ago" display
      created_at: item.last_watched_at,
      last_watched_at: item.last_watched_at,
      status: item.status,
      // Season/episode from extended API data
      season: lastEpisode?.season,
      episode: lastEpisode?.episode,
      // Also include episode count for fallback display
      watched_episodes_count: item.watched_episodes_count,
      total_episodes_count: item.total_episodes_count,
      simkl_id: media?.ids?.simkl,
      imdb_id: media?.ids?.imdb,
    };
  });




  const handleTabChange = (value: string) => {
    setActiveTab(value as "history" | "favorites" | "watchlist" | "simkl");
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
              {activeTab === "simkl" && (
                <Cloud className="mr-3 h-6 w-6 text-accent" />
              )}
              <h1 className="text-2xl font-bold text-white">
                {activeTab === "history" && "Your Watch History"}
                {activeTab === "favorites" && "Your Favorites"}
                {activeTab === "watchlist" && "Your Watchlist"}
                {activeTab === "simkl" && "Simkl Watch History"}
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

              {activeTab === "simkl" && userPreferences?.isSimklEnabled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchSimklHistory}
                  disabled={isLoadingSimkl}
                  className="border-white/20 bg-black/50 text-white hover:bg-black/70"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingSimkl ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              )}
            </div>
          </div>

          <Tabs
            defaultValue="history"
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="mb-4 grid grid-cols-4 border border-white/10 bg-black/20">
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
              <TabsTrigger
                value="simkl"
                className="data-[state=active]:bg-accent"
              >
                <Cloud className="mr-2 h-4 w-4" />
                Simkl
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

            <TabsContent value="simkl" className="mt-0">
              {!userPreferences?.isSimklEnabled ? (
                <div className="glass rounded-lg p-8 text-center">
                  <Cloud className="mx-auto mb-4 h-12 w-12 text-white/50" />
                  <h3 className="mb-2 text-lg font-medium text-white">
                    Connect to Simkl
                  </h3>
                  <p className="mb-4 text-white/70">
                    Link your Simkl account to see your watch history here.
                  </p>
                  <Link to="/profile">
                    <Button>Go to Settings</Button>
                  </Link>
                </div>
              ) : isLoadingSimkl ? (
                <div className="flex w-full justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                </div>
              ) : simklError ? (
                <div className="glass rounded-lg p-8 text-center">
                  <Cloud className="mx-auto mb-4 h-12 w-12 text-red-400" />
                  <h3 className="mb-2 text-lg font-medium text-white">
                    Error Loading Simkl Data
                  </h3>
                  <p className="mb-4 text-white/70">{simklError}</p>
                  <Button onClick={fetchSimklHistory}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                </div>
              ) : simklHistory.length > 0 ? (
                <MediaGrid
                  media={simklMedia}
                  listView
                />
              ) : (
                <div className="glass rounded-lg p-8 text-center">
                  <Cloud className="mx-auto mb-4 h-12 w-12 text-white/50" />
                  <h3 className="mb-2 text-lg font-medium text-white">
                    No Simkl watch history
                  </h3>
                  <p className="mb-4 text-white/70">
                    Your Simkl watch history will appear here once you start tracking.
                  </p>
                  <a href="https://simkl.com" target="_blank" rel="noopener noreferrer">
                    <Button>Visit Simkl</Button>
                  </a>
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
