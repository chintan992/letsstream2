import { useState, useEffect, useRef } from "react";
import { useScrollRestoration, usePageStatePersistence } from "@/hooks";
import { trackMediaPreference } from "@/lib/analytics";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageTransition from "@/components/PageTransition";
import { MoviesHeader } from "@/components/movie";
import MovieTabContent from "./components/MovieTabContent";

interface MoviesPageState {
  activeTab: "popular" | "top_rated";
  sortBy: "default" | "title" | "release_date" | "rating";
  genreFilter: string;
  viewMode: "grid" | "list";
}

const tabs = [
  { value: "popular", label: "Popular" },
  { value: "top_rated", label: "Top Rated" },
] as const;

const Movies = () => {
  const [persistedState, setPersistedState, clearPersistedState] =
    usePageStatePersistence<MoviesPageState>("movies-page-state", {
      activeTab: "popular",
      sortBy: "default",
      genreFilter: "all",
      viewMode: "grid",
    });

  // Initialize state from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const urlGenre = urlParams.get("genre") || "all";
  const urlSortBy =
    (urlParams.get("sort") as
      | "default"
      | "title"
      | "release_date"
      | "rating") || "default";

  const initialShouldUsePersistedRef = useRef(
    persistedState.genreFilter === urlGenre &&
      persistedState.sortBy === urlSortBy
  );

  // eslint-disable-next-line react-hooks/refs
  const [activeTab, setActiveTab] = useState<"popular" | "top_rated">(() =>
    initialShouldUsePersistedRef.current ? persistedState.activeTab : "popular"
  );
  // eslint-disable-next-line react-hooks/refs
  const [viewMode, setViewMode] = useState<"grid" | "list">(() =>
    initialShouldUsePersistedRef.current ? persistedState.viewMode : "grid"
  );
  const [sortBy, setSortBy] = useState<
    "default" | "title" | "release_date" | "rating"
  >(urlSortBy);
  const [genreFilter, setGenreFilter] = useState<string>(urlGenre);

  // Apply scroll restoration
  useScrollRestoration();

  // Effect to update persisted state when state changes
  useEffect(() => {
    if (initialShouldUsePersistedRef.current) {
      setPersistedState(prevState => ({
        ...prevState,
        activeTab,
        sortBy,
        genreFilter,
        viewMode,
      }));
    }
  }, [activeTab, sortBy, genreFilter, viewMode, setPersistedState]);

  // Clear persisted state if filters don't match
  useEffect(() => {
    if (!initialShouldUsePersistedRef.current) {
      clearPersistedState();
    }
  }, [clearPersistedState]);

  // Track initial page visit
  useEffect(() => {
    void trackMediaPreference("movie", "browse");
  }, []);

  const handleTabChange = async (value: string) => {
    const tabValue = value as "popular" | "top_rated";
    setActiveTab(tabValue);
    await trackMediaPreference("movie", "select");
  };

  const handleSortChange = (value: string) => {
    setSortBy(value as "default" | "title" | "release_date" | "rating");
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <MoviesHeader
            sortBy={sortBy}
            onSortChange={handleSortChange}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          {/* Genre Filter */}
          <div className="mb-6 flex items-center gap-4">
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
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="mb-6">
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
