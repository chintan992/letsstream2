import { useState, useEffect } from "react";
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

const Movies = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
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
  const [genreFilter, setGenreFilter] = useState<string>("all");

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
    setPopularPage(prev => prev + 1);
  };

  const handleShowMoreTopRated = () => {
    setTopRatedPage(prev => prev + 1);
  };

  const toggleViewMode = () => {
    setViewMode(prev => (prev === "grid" ? "list" : "grid"));
  };

  const handleTabChange = async (value: "popular" | "top_rated") => {
    setActiveTab(value);
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
                ) => setSortBy(value)}
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

              <Select value={genreFilter} onValueChange={setGenreFilter}>
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
                  {/* <MediaGrid media={ensureExtendedMediaArray(filteredTopRatedMovies)} title="Top Rated Movies" listView={viewMode === 'list'} /> */}

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
