import { useState, useEffect } from "react";
import { useScrollRestoration, usePageStatePersistence } from "@/hooks";
import { trackMediaPreference } from "@/lib/analytics";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Film, Grid3X3, List } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MovieTabContent from "./components/MovieTabContent";

// Define the interface for the persisted state
interface MoviesPageState {
  activeTab: "popular" | "top_rated";
  sortBy: "default" | "title" | "release_date" | "rating";
  genreFilter: string;
  viewMode: "grid" | "list";
}

const Movies = () => {
  // Use page state persistence hook
  const [persistedState, setPersistedState, clearPersistedState] =
    usePageStatePersistence<MoviesPageState>("movies-page-state", {
      activeTab: "popular",
      sortBy: "default",
      genreFilter: "all",
      viewMode: "grid",
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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<
    "default" | "title" | "release_date" | "rating"
  >("default");
  const [genreFilter, setGenreFilter] = useState<string>(urlGenre);

  // Apply state from persisted state if filters match
  useEffect(() => {
    if (shouldUsePersistedState) {
      setActiveTab(persistedState.activeTab);
      setViewMode(persistedState.viewMode);
      setSortBy(persistedState.sortBy);
    } else {
      // If filters don't match, clear persisted state and reset to defaults
      clearPersistedState();
    }
  }, [shouldUsePersistedState, persistedState, clearPersistedState]);

  // Apply scroll restoration
  useScrollRestoration();

  // Effect to update persisted state when state changes
  useEffect(() => {
    // Update persisted state with current state values
    setPersistedState(prevState => ({
      ...prevState,
      activeTab,
      sortBy,
      genreFilter,
      viewMode,
    }));
  }, [activeTab, sortBy, genreFilter, viewMode, setPersistedState]);

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

  const handleTabChange = async (value: string) => {
    const tabValue = value as "popular" | "top_rated";
    setActiveTab(tabValue);
    // Update the persisted state with the new active tab
    setPersistedState(prevState => ({
      ...prevState,
      activeTab: tabValue,
    }));
    await trackMediaPreference("movie", "select");
  };

  // Track initial page visit
  useEffect(() => {
    void trackMediaPreference("movie", "browse");
  }, []);

  const tabs = [
    { value: "popular", label: "Popular" },
    { value: "top_rated", label: "Top Rated" },
  ] as const;

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
                {tabs.map(tab => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="data-[state=active]:bg-accent/20"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {tabs.map(tab => (
              <TabsContent
                key={tab.value}
                value={tab.value}
                className="animate-fade-in focus-visible:outline-none"
              >
                <MovieTabContent
                  type={tab.value}
                  viewMode={viewMode}
                  sortBy={sortBy}
                  genreFilter={genreFilter}
                />
              </TabsContent>
            ))}
          </Tabs>
        </main>

        <Footer />
      </div>
    </PageTransition>
  );
};

export default Movies;
