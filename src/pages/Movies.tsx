import { useState, useEffect } from "react";
import { useScrollRestoration, usePageStatePersistence } from "@/hooks";
import {
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { getPopularMovies, getTopRatedMovies } from "@/utils/api";
import { Media, ensureExtendedMediaArray } from "@/utils/types";
import { trackMediaPreference } from "@/lib/analytics";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MediaGrid from "@/components/MediaGrid";
import { MediaGridSkeleton } from "@/components/MediaSkeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Film, ChevronDown, Grid3X3, List } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ITEMS_PER_PAGE = 20;

// Define the interface for the persisted state
interface MoviesPageState {
  activeTab: "popular" | "top_rated";
  popularPage: number;
  topRatedPage: number;
  sortBy: "default" | "title" | "release_date" | "rating";
  genreFilter: string;
  viewMode: "grid" | "list";
  popularMovieIds: number[];
  topRatedMovieIds: number[];
}

const Movies = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for hydration tracking
  const [isPopularHydrated, setIsPopularHydrated] = useState(false);
  const [isTopRatedHydrated, setIsTopRatedHydrated] = useState(false);

  // Determine if the active tab is hydrated
  const isHydrated =
    activeTab === "popular" ? isPopularHydrated : isTopRatedHydrated;

  // Use page state persistence hook
  const [persistedState, setPersistedState, clearPersistedState] =
    usePageStatePersistence<MoviesPageState>("movies-page-state", {
      activeTab: "popular",
      popularPage: 1,
      topRatedPage: 1,
      sortBy: "default",
      genreFilter: "all",
      viewMode: "grid",
      popularMovieIds: [],
      topRatedMovieIds: [],
    });

  // Initialize state from persisted state, but only if filters match
  const urlParams = new URLSearchParams(window.location.search);
  const urlGenre = urlParams.get("genre") || "all";
  const urlSortBy =
    (urlParams.get("sort") as
      | "default"
      | "title"
      | "release_date"
      | "rating") || "default";

  // Validate if persisted state matches current URL filters
  const shouldUsePersistedState =
    persistedState.genreFilter === urlGenre &&
    persistedState.sortBy === urlSortBy;

  const [activeTab, setActiveTab] = useState<"popular" | "top_rated">(
    "popular"
  );
  const [popularPage, setPopularPage] = useState(1);
  const [topRatedPage, setTopRatedPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [allPopularMovies, setAllPopularMovies] = useState<Media[]>([]);
  const [allTopRatedMovies, setAllTopRatedMovies] = useState<Media[]>([]);
  const [sortBy, setSortBy] = useState<
    "default" | "title" | "release_date" | "rating"
  >("default");
  const [genreFilter, setGenreFilter] = useState<string>(urlGenre);

  // Apply state from persisted state if filters match
  useEffect(() => {
    if (shouldUsePersistedState) {
      setActiveTab(persistedState.activeTab);
      setPopularPage(persistedState.popularPage);
      setTopRatedPage(persistedState.topRatedPage);
      setViewMode(persistedState.viewMode);
      setSortBy(persistedState.sortBy);
    } else {
      // If filters don't match, clear persisted state and reset to defaults
      clearPersistedState();
    }
  }, [shouldUsePersistedState, persistedState, clearPersistedState]);

  // Apply scroll restoration only after hydration
  useScrollRestoration({ enabled: isHydrated });

  const popularMoviesQuery = useQuery({
    queryKey: ["popularMovies", popularPage],
    queryFn: () => getPopularMovies(popularPage),
    placeholderData: keepPreviousData,
  });

  const topRatedMoviesQuery = useQuery({
    queryKey: ["topRatedMovies", topRatedPage],
    queryFn: () => getTopRatedMovies(topRatedPage),
    placeholderData: keepPreviousData,
  });

  // Effect to hydrate data for popular movies from persisted state
  useEffect(() => {
    // Only run if filters match and we haven't hydrated yet
    if (
      !shouldUsePersistedState ||
      isPopularHydrated ||
      persistedState.popularMovieIds.length === 0
    ) {
      // If filters don't match or no persisted data or already hydrated, just mark as hydrated if needed
      if (
        (persistedState.popularMovieIds.length === 0 ||
          !shouldUsePersistedState) &&
        !isPopularHydrated
      ) {
        setIsPopularHydrated(true);
      }
      return;
    }

    // Hydrate popular movies if we have persisted IDs
    if (persistedState.popularMovieIds.length > 0) {
      // Fetch all pages needed to get all persisted movies
      const totalPagesNeeded = Math.ceil(
        persistedState.popularMovieIds.length / ITEMS_PER_PAGE
      );
      for (let page = 1; page <= totalPagesNeeded; page++) {
        queryClient.prefetchQuery({
          queryKey: ["popularMovies", page],
          queryFn: () => getPopularMovies(page),
        });
      }
    }
  }, [
    isPopularHydrated,
    persistedState.popularMovieIds,
    queryClient,
    shouldUsePersistedState,
  ]);

  // Effect to restore popular movies from cache once they're available
  useEffect(() => {
    if (
      persistedState.popularMovieIds.length > 0 &&
      !isPopularHydrated &&
      shouldUsePersistedState
    ) {
      // Check if all required pages are in cache
      const totalPagesNeeded = Math.ceil(
        persistedState.popularMovieIds.length / ITEMS_PER_PAGE
      );
      let allPagesCached = true;

      for (let page = 1; page <= totalPagesNeeded; page++) {
        if (!queryClient.getQueryData(["popularMovies", page])) {
          allPagesCached = false;
          break;
        }
      }

      if (allPagesCached) {
        // Build the complete array from cached pages
        let accumulatedMovies: Media[] = [];
        for (let page = 1; page <= totalPagesNeeded; page++) {
          const pageData: Media[] =
            queryClient.getQueryData(["popularMovies", page]) || [];
          const mappedMovies = pageData.map(movie => ({
            ...movie,
            id: movie.id || movie.media_id || 0,
            media_id: movie.id || movie.media_id || 0,
            media_type: "movie" as const,
          }));
          accumulatedMovies = [...accumulatedMovies, ...mappedMovies];
        }

        // Filter to only the movies we need based on persisted IDs
        const filteredMovies = accumulatedMovies.filter(movie =>
          persistedState.popularMovieIds.includes(movie.id)
        );

        setAllPopularMovies(filteredMovies);
        setIsPopularHydrated(true);
      }
    }
  }, [
    persistedState.popularMovieIds,
    queryClient,
    isPopularHydrated,
    shouldUsePersistedState,
  ]);

  // Effect to hydrate data for top rated movies from persisted state
  useEffect(() => {
    // Only run if filters match and we haven't hydrated yet
    if (
      !shouldUsePersistedState ||
      isTopRatedHydrated ||
      persistedState.topRatedMovieIds.length === 0
    ) {
      // If filters don't match or no persisted data or already hydrated, just mark as hydrated if needed
      if (
        (persistedState.topRatedMovieIds.length === 0 ||
          !shouldUsePersistedState) &&
        !isTopRatedHydrated
      ) {
        setIsTopRatedHydrated(true);
      }
      return;
    }

    // Hydrate top rated movies if we have persisted IDs
    if (persistedState.topRatedMovieIds.length > 0) {
      // Fetch all pages needed to get all persisted movies
      const totalPagesNeeded = Math.ceil(
        persistedState.topRatedMovieIds.length / ITEMS_PER_PAGE
      );
      for (let page = 1; page <= totalPagesNeeded; page++) {
        queryClient.prefetchQuery({
          queryKey: ["topRatedMovies", page],
          queryFn: () => getTopRatedMovies(page),
        });
      }
    }
  }, [
    isTopRatedHydrated,
    persistedState.topRatedMovieIds,
    queryClient,
    shouldUsePersistedState,
  ]);

  // Effect to restore top rated movies from cache once they're available
  useEffect(() => {
    if (
      persistedState.topRatedMovieIds.length > 0 &&
      !isTopRatedHydrated &&
      shouldUsePersistedState
    ) {
      // Check if all required pages are in cache
      const totalPagesNeeded = Math.ceil(
        persistedState.topRatedMovieIds.length / ITEMS_PER_PAGE
      );
      let allPagesCached = true;

      for (let page = 1; page <= totalPagesNeeded; page++) {
        if (!queryClient.getQueryData(["topRatedMovies", page])) {
          allPagesCached = false;
          break;
        }
      }

      if (allPagesCached) {
        // Build the complete array from cached pages
        let accumulatedMovies: Media[] = [];
        for (let page = 1; page <= totalPagesNeeded; page++) {
          const pageData: Media[] =
            queryClient.getQueryData(["topRatedMovies", page]) || [];
          const mappedMovies = pageData.map(movie => ({
            ...movie,
            id: movie.id || movie.media_id || 0,
            media_id: movie.id || movie.media_id || 0,
            media_type: "movie" as const,
          }));
          accumulatedMovies = [...accumulatedMovies, ...mappedMovies];
        }

        // Filter to only the movies we need based on persisted IDs
        const filteredMovies = accumulatedMovies.filter(movie =>
          persistedState.topRatedMovieIds.includes(movie.id)
        );

        setAllTopRatedMovies(filteredMovies);
        setIsTopRatedHydrated(true);
      }
    }
  }, [
    persistedState.topRatedMovieIds,
    queryClient,
    isTopRatedHydrated,
    shouldUsePersistedState,
  ]);

  useEffect(() => {
    if (popularMoviesQuery.data) {
      setAllPopularMovies(prev => {
        const newMovies = popularMoviesQuery.data
          .filter(
            movie => !prev.some(p => p.id === (movie.id || movie.media_id))
          )
          .map(movie => ({
            ...movie,
            id: movie.id || movie.media_id || 0,
            media_id: movie.id || movie.media_id || 0,
            media_type: "movie" as const,
          }));
        return [...prev, ...newMovies];
      });
    }
  }, [popularMoviesQuery.data]);

  useEffect(() => {
    if (topRatedMoviesQuery.data) {
      setAllTopRatedMovies(prev => {
        const newMovies = topRatedMoviesQuery.data
          .filter(
            movie => !prev.some(p => p.id === (movie.id || movie.media_id))
          )
          .map(movie => ({
            ...movie,
            id: movie.id || movie.media_id || 0,
            media_id: movie.id || movie.media_id || 0,
            media_type: "movie" as const,
          }));
        return [...prev, ...newMovies];
      });
    }
  }, [topRatedMoviesQuery.data]);

  // Effect to update persisted state when movies change or filters change
  useEffect(() => {
    // Update persisted state with current state values
    setPersistedState(prevState => ({
      ...prevState,
      activeTab,
      popularPage,
      topRatedPage,
      sortBy,
      genreFilter,
      viewMode,
      // Store only the IDs of the movies
      popularMovieIds: allPopularMovies.map(movie => movie.id),
      topRatedMovieIds: allTopRatedMovies.map(movie => movie.id),
    }));
  }, [
    activeTab,
    popularPage,
    topRatedPage,
    sortBy,
    genreFilter,
    viewMode,
    allPopularMovies,
    allTopRatedMovies,
    setPersistedState,
  ]);

  // Effect to clear accumulated data when filters change significantly
  useEffect(() => {
    // Clear persisted state when genre filter changes (since filters affect the data)
    if (persistedState.genreFilter !== genreFilter) {
      // Clear accumulated data since content will be filtered differently
      setAllPopularMovies([]);
      setAllTopRatedMovies([]);
      // Update the persisted state with the new filter and clear movie IDs
      setPersistedState(prevState => ({
        ...prevState,
        genreFilter,
        popularMovieIds: [], // Clear the IDs
        topRatedMovieIds: [], // Clear the IDs
      }));
    }
  }, [genreFilter, persistedState.genreFilter, setPersistedState]);

  useEffect(() => {
    if (popularMoviesQuery.data?.length === ITEMS_PER_PAGE) {
      queryClient.prefetchQuery({
        queryKey: ["popularMovies", popularPage + 1],
        queryFn: () => getPopularMovies(popularPage + 1),
      });
    }
  }, [popularPage, queryClient, popularMoviesQuery.data]);

  useEffect(() => {
    if (topRatedMoviesQuery.data?.length === ITEMS_PER_PAGE) {
      queryClient.prefetchQuery({
        queryKey: ["topRatedMovies", topRatedPage + 1],
        queryFn: () => getTopRatedMovies(topRatedPage + 1),
      });
    }
  }, [topRatedPage, queryClient, topRatedMoviesQuery.data]);

  const applyFiltersAndSort = (movies: Media[]) => {
    let filteredMovies = [...movies];

    if (genreFilter !== "all") {
      filteredMovies = filteredMovies.filter(movie =>
        movie.genre_ids?.includes(parseInt(genreFilter))
      );
    }

    switch (sortBy) {
      case "title":
        filteredMovies.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "release_date":
        filteredMovies.sort(
          (a, b) =>
            new Date(b.release_date).getTime() -
            new Date(a.release_date).getTime()
        );
        break;
      case "rating":
        filteredMovies.sort((a, b) => b.vote_average - a.vote_average);
        break;
      default:
        break;
    }

    return filteredMovies;
  };

  const filteredPopularMovies = applyFiltersAndSort(allPopularMovies);
  const filteredTopRatedMovies = applyFiltersAndSort(allTopRatedMovies);

  const handleShowMorePopular = () => {
    setPopularPage(prev => {
      const newPage = prev + 1;
      // Update the persisted state when page changes
      setPersistedState(prevState => ({
        ...prevState,
        popularPage: newPage,
      }));
      return newPage;
    });
  };

  const handleShowMoreTopRated = () => {
    setTopRatedPage(prev => {
      const newPage = prev + 1;
      // Update the persisted state when page changes
      setPersistedState(prevState => ({
        ...prevState,
        topRatedPage: newPage,
      }));
      return newPage;
    });
  };

  const toggleViewMode = () => {
    setViewMode(prev => {
      const newViewMode = prev === "grid" ? "list" : "grid";
      // Update the persisted state when view mode changes
      setPersistedState(prevState => ({
        ...prevState,
        viewMode: newViewMode,
      }));
      return newViewMode;
    });
  };

  const handleTabChange = async (value: "popular" | "top_rated") => {
    setActiveTab(value);
    // Update the persisted state with the new active tab
    setPersistedState(prevState => ({
      ...prevState,
      activeTab: value,
    }));
    await trackMediaPreference("movie", "select");
  };

  const hasMorePopular = popularMoviesQuery.data?.length === ITEMS_PER_PAGE;
  const hasMoreTopRated = topRatedMoviesQuery.data?.length === ITEMS_PER_PAGE;

  // Track initial page visit
  useEffect(() => {
    void trackMediaPreference("movie", "browse");
  }, []);

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 pt-10">
              <Film className="h-8 w-8 animate-pulse-slow text-accent" />
              <h1 className="text-3xl font-bold text-white">Movies</h1>
            </div>

            <div className="flex items-center gap-4 pt-6">
              <Select
                value={sortBy}
                onValueChange={(
                  value: "default" | "title" | "release_date" | "rating"
                ) => {
                  setSortBy(value);
                  // Update the persisted state when sort changes
                  setPersistedState(prevState => ({
                    ...prevState,
                    sortBy: value,
                  }));
                }}
              >
                <SelectTrigger className="w-[180px] border-white/10 bg-transparent text-white">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-background text-white">
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="release_date">Release Date</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={genreFilter}
                onValueChange={value => {
                  setGenreFilter(value);
                  // The effect for genre filter changes will handle the persisted state update
                }}
              >
                <SelectTrigger className="w-[180px] border-white/10 bg-transparent text-white">
                  <SelectValue placeholder="Filter by Genre" />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-background text-white">
                  <SelectItem value="all">All Genres</SelectItem>
                  <SelectItem value="28">Action</SelectItem>
                  <SelectItem value="12">Adventure</SelectItem>
                  <SelectItem value="35">Comedy</SelectItem>
                  <SelectItem value="18">Drama</SelectItem>
                  <SelectItem value="27">Horror</SelectItem>
                  <SelectItem value="10749">Romance</SelectItem>
                  <SelectItem value="878">Sci-Fi</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                className="group border-white/10 text-white hover:bg-white/10"
                onClick={toggleViewMode}
              >
                {viewMode === "grid" ? (
                  <>
                    <List className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                    List View
                  </>
                ) : (
                  <>
                    <Grid3X3 className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                    Grid View
                  </>
                )}
              </Button>
            </div>
          </div>

          <Tabs defaultValue={activeTab} onValueChange={handleTabChange}>
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <TabsList className="mb-4 md:mb-0">
                <TabsTrigger
                  value="popular"
                  className="data-[state=active]:bg-accent/20"
                >
                  Popular
                </TabsTrigger>
                <TabsTrigger
                  value="top_rated"
                  className="data-[state=active]:bg-accent/20"
                >
                  Top Rated
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent
              value="popular"
              className="animate-fade-in focus-visible:outline-none"
            >
              {popularMoviesQuery.isLoading ? (
                <MediaGridSkeleton listView={viewMode === "list"} />
              ) : popularMoviesQuery.isError ? (
                <div className="py-12 text-center text-white">
                  Error loading movies. Please try again.
                </div>
              ) : (
                <>
                  <MediaGrid
                    media={ensureExtendedMediaArray(filteredPopularMovies)}
                    title="Popular Movies"
                    listView={viewMode === "list"}
                  />

                  {hasMorePopular && (
                    <div className="my-8 flex justify-center">
                      <Button
                        onClick={handleShowMorePopular}
                        variant="outline"
                        className="hover:bg-accent/20 hover:border-accent/50 border-white/10 text-white transition-all duration-300 hover:text-white"
                      >
                        {popularMoviesQuery.isFetching ? (
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

            <TabsContent
              value="top_rated"
              className="animate-fade-in focus-visible:outline-none"
            >
              {topRatedMoviesQuery.isLoading ? (
                <MediaGridSkeleton listView={viewMode === "list"} />
              ) : topRatedMoviesQuery.isError ? (
                <div className="py-12 text-center text-white">
                  Error loading movies. Please try again.
                </div>
              ) : (
                <>
                  <MediaGrid
                    media={ensureExtendedMediaArray(filteredTopRatedMovies)}
                    title="Top Rated Movies"
                    listView={viewMode === "list"}
                  />

                  {hasMoreTopRated && (
                    <div className="my-8 flex justify-center">
                      <Button
                        onClick={handleShowMoreTopRated}
                        variant="outline"
                        className="hover:bg-accent/20 hover:border-accent/50 border-white/10 text-white transition-all duration-300 hover:text-white"
                      >
                        {topRatedMoviesQuery.isFetching ? (
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
        </main>

        <Footer />
      </div>
    </PageTransition>
  );
};

export default Movies;
