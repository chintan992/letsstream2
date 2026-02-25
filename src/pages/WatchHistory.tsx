import { useState, useRef, useEffect, useCallback } from "react";
import { useScrollRestoration } from "@/hooks";
import { Link } from "react-router-dom";
import { m } from "framer-motion";
import { Loader2, RefreshCw } from "lucide-react";
import { useWatchHistory } from "@/hooks/watch-history";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MediaGrid from "@/components/MediaGrid";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks";
import { useUserPreferences } from "@/hooks/user-preferences";
import {
  SimklService,
  SimklListItem,
  getLastWatchedEpisode,
} from "@/lib/simkl";
import { performBidirectionalSync } from "@/lib/simkl-sync";
import { WatchHistoryHeader, HistoryEmptyState } from "@/components/history";

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
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "history" | "favorites" | "watchlist" | "simkl"
  >("history");
  const [isContentHydrated, setIsContentHydrated] = useState(false);

  // Simkl watch history state
  const [simklHistory, setSimklHistory] = useState<SimklListItem[]>([]);
  const [isLoadingSimkl, setIsLoadingSimkl] = useState(false);
  const [simklError, setSimklError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<{
    imported: number;
    exported: number;
    merged: number;
    syncedAt: Date;
  } | null>(null);

  // Fetch Simkl watch history when tab is selected
  const fetchSimklHistory = useCallback(async () => {
    if (!userPreferences?.isSimklEnabled || !userPreferences?.simklToken) {
      return;
    }

    setIsLoadingSimkl(true);
    setSimklError(null);

    try {
      const data = await SimklService.getFullWatchHistory(
        userPreferences.simklToken
      );

      const allItems = [...data.movies, ...data.shows, ...data.anime].sort(
        (a, b) => {
          const dateA = new Date(
            a.last_watched_at || a.last_watched || 0
          ).getTime();
          const dateB = new Date(
            b.last_watched_at || b.last_watched || 0
          ).getTime();
          return dateB - dateA;
        }
      );
      setSimklHistory(allItems);
    } catch (error) {
      console.error("Failed to fetch Simkl history:", error);
      setSimklError("Failed to load Simkl watch history");
    } finally {
      setIsLoadingSimkl(false);
    }
  }, [userPreferences?.isSimklEnabled, userPreferences?.simklToken]);

  // Manual bidirectional sync handler
  const handleManualSync = useCallback(async () => {
    if (!user || !userPreferences?.simklToken) {
      toast({
        title: "Sync unavailable",
        description: "Please connect your Simkl account first.",
        variant: "destructive",
      });
      return;
    }

    setIsSyncing(true);
    try {
      const result = await performBidirectionalSync(
        user.uid,
        userPreferences.simklToken
      );

      await fetchSimklHistory();

      const totalChanges = result.imported + result.exported + result.merged;

      setLastSyncResult({
        imported: result.imported,
        exported: result.exported,
        merged: result.merged,
        syncedAt: new Date(),
      });

      if (totalChanges > 0) {
        toast({
          title: "Sync Complete",
          description: `Imported ${result.imported}, exported ${result.exported}, merged ${result.merged} items.`,
        });
      } else {
        toast({
          title: "Already in sync",
          description: "Your watch history is up to date.",
        });
      }

      if (result.errors.length > 0) {
        console.warn("Sync errors:", result.errors);
      }
    } catch (error) {
      console.error("Manual sync failed:", error);
      toast({
        title: "Sync failed",
        description: "Failed to sync with Simkl. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  }, [user, userPreferences?.simklToken, toast, fetchSimklHistory]);

  // Fetch Simkl data when tab is selected
  useEffect(() => {
    if (
      activeTab === "simkl" &&
      userPreferences?.isSimklEnabled &&
      simklHistory.length === 0 &&
      !isLoadingSimkl
    ) {
      fetchSimklHistory();
    }
  }, [
    activeTab,
    userPreferences?.isSimklEnabled,
    simklHistory.length,
    isLoadingSimkl,
    fetchSimklHistory,
  ]);

  // Reset hydration state when tab changes
  useEffect(() => {
    const timer = setTimeout(() => {
      let isTabDataReady = false;
      if (activeTab === "history") {
        isTabDataReady = !isLoading;
      } else if (activeTab === "favorites") {
        isTabDataReady = true; // Favorites are loaded synchronously from context/local state usually, or they have no loading state, wait, watchHistory has isLoading.
      } else if (activeTab === "watchlist") {
        isTabDataReady = true;
      } else if (activeTab === "simkl") {
        isTabDataReady = !isLoadingSimkl;
      }
      setIsContentHydrated(isTabDataReady);
    }, 100);

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

  // Use tab-specific scroll restoration with hydration check
  useScrollRestoration({
    storageKey: `scroll-watch-history-${activeTab}`,
    enabled: isContentHydrated,
  });

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
  }, [hasMore, isLoadingMore, activeTab, handleLoadMore, watchHistory.length]);

  const handleClearHistory = () => {
    clearWatchHistory();
    toast({
      title: "Watch history cleared",
      description: "Your watch history has been successfully cleared.",
    });
  };

  // Sort watch history based on selected option
  const sortedWatchHistory = [...watchHistory].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
  });

  // Convert watch history items to Media format for the MediaGrid
  const watchHistoryMedia = sortedWatchHistory.map(item => ({
    id: item.media_id,
    media_id: item.media_id,
    title: item.title,
    name: item.title,
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    overview: item.overview || "",
    vote_average: item.rating || 0,
    media_type: item.media_type,
    genre_ids: [],
    watch_position: item.watch_position,
    duration: item.duration,
    created_at: item.created_at,
    docId: item.id,
    season: item.season,
    episode: item.episode,
    last_watched_at: item.last_watched_at,
    episodes_watched: item.episodes_watched,
  }));

  // Convert favorites to Media format
  const favoritesMedia = favorites.map(item => ({
    id: item.media_id,
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
    docId: item.id,
  }));

  // Convert watchlist to Media format
  const watchlistMedia = watchlist.map(item => ({
    id: item.media_id,
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
    docId: item.id,
  }));

  // Convert Simkl items to Media format
  const simklMedia = simklHistory.map(item => {
    const media = item.movie || item.show || item.anime;
    const isMovie = !!item.movie;

    const simklPosterUrl = media?.poster
      ? `https://wsrv.nl/?url=https://simkl.in/posters/${media.poster}_m.webp`
      : null;

    const lastEpisode = !isMovie ? getLastWatchedEpisode(item) : null;
    const yearStr = media?.year ? `${media.year}-01-01` : undefined;

    return {
      id: media?.ids?.tmdb || media?.ids?.simkl || 0,
      media_id: media?.ids?.tmdb || media?.ids?.simkl || 0,
      title: media?.title || "Unknown",
      name: media?.title || "Unknown",
      poster_path: null,
      custom_poster_url: simklPosterUrl,
      backdrop_path: null,
      overview: "",
      vote_average: item.user_rating || 0,
      media_type: isMovie ? ("movie" as const) : ("tv" as const),
      genre_ids: [],
      release_date: isMovie ? yearStr : undefined,
      first_air_date: !isMovie ? yearStr : undefined,
      created_at: item.last_watched_at,
      last_watched_at: item.last_watched_at,
      status: item.status,
      season: lastEpisode?.season,
      episode: lastEpisode?.episode,
      watched_episodes_count: item.watched_episodes_count,
      total_episodes_count: item.total_episodes_count,
      simkl_id: media?.ids?.simkl,
      imdb_id: media?.ids?.imdb,
    };
  });

  const handleTabChange = (value: string) => {
    setActiveTab(value as "history" | "favorites" | "watchlist" | "simkl");
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <Navbar />

      <m.div
        className="container mx-auto px-4 pt-24"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="glass mb-8 rounded-lg p-6">
          <WatchHistoryHeader
            activeTab={activeTab}
            sortOrder={sortOrder}
            onSortOrderChange={() =>
              setSortOrder(sortOrder === "newest" ? "oldest" : "newest")
            }
            onClearHistory={handleClearHistory}
            showClearButton={activeTab === "history" && watchHistory.length > 0}
            isSimklEnabled={userPreferences?.isSimklEnabled || false}
            isSyncing={isSyncing}
            onSync={handleManualSync}
            lastSyncResult={lastSyncResult}
            isLoadingSimkl={isLoadingSimkl}
            onRefreshSimkl={
              activeTab === "simkl" ? fetchSimklHistory : undefined
            }
          />

          <Tabs
            defaultValue="history"
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="mb-4 grid grid-cols-4 border border-white/10 bg-black/20">
              <TabsTrigger
                value="history"
                className="data-[state=active]:bg-accent"
              >
                History
              </TabsTrigger>
              <TabsTrigger
                value="favorites"
                className="data-[state=active]:bg-accent"
              >
                Favorites
              </TabsTrigger>
              <TabsTrigger
                value="watchlist"
                className="data-[state=active]:bg-accent"
              >
                Watchlist
              </TabsTrigger>
              <TabsTrigger
                value="simkl"
                className="data-[state=active]:bg-accent"
              >
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
                    onDelete={deleteWatchHistoryItem}
                    onDeleteSelected={deleteSelectedWatchHistory}
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
                <HistoryEmptyState type="history" />
              )}
            </TabsContent>

            <TabsContent value="favorites" className="mt-0">
              {favorites.length > 0 ? (
                <MediaGrid
                  media={favoritesMedia}
                  listView
                  selectable
                  onDelete={deleteFavoriteItem}
                  onDeleteSelected={deleteSelectedFavorites}
                />
              ) : (
                <HistoryEmptyState type="favorites" />
              )}
            </TabsContent>

            <TabsContent value="watchlist" className="mt-0">
              {watchlist.length > 0 ? (
                <MediaGrid
                  media={watchlistMedia}
                  listView
                  selectable
                  onDelete={deleteWatchlistItem}
                  onDeleteSelected={deleteSelectedWatchlist}
                />
              ) : (
                <HistoryEmptyState type="watchlist" />
              )}
            </TabsContent>

            <TabsContent value="simkl" className="mt-0">
              {!userPreferences?.isSimklEnabled ? (
                <div className="glass rounded-lg p-8 text-center">
                  <HistoryEmptyState type="simkl" />
                  <Link to="/profile" className="mt-4 inline-block">
                    <Button>Go to Settings</Button>
                  </Link>
                </div>
              ) : isLoadingSimkl ? (
                <div className="flex w-full justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                </div>
              ) : simklError ? (
                <HistoryEmptyState
                  type="simkl-error"
                  errorMessage={simklError}
                />
              ) : simklHistory.length > 0 ? (
                <MediaGrid media={simklMedia} listView />
              ) : (
                <HistoryEmptyState type="simkl" />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </m.div>

      <Footer />
    </div>
  );
};

export default WatchHistory;
