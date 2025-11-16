import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useScrollRestoration, usePageStatePersistence } from "@/hooks";
import { useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import TVShowsTabs from "./components/TVShowsTabs";
import TVShowsHeader from "./components/TVShowsHeader";
import TVShowsFilters from "./components/TVShowsFilters";
import { useToast } from "@/hooks/use-toast";
import { trackMediaPreference } from "@/lib/analytics";
import { Media } from "@/utils/types";

// Define the interface for the persisted state
interface TVShowsPageState {
  activeTab: "popular" | "top_rated" | "trending";
  genreFilter: string;
  sortBy: "default" | "name" | "first_air_date" | "rating";
  viewMode: "grid" | "list";
  platformFilters: string[];
  showPlatformBar: boolean;
}

const TVShowsPage = () => {
  const navigate = useNavigate();

  // State for hydration tracking for all tabs
  const [isHydrated, setIsHydrated] = useState(false);
  const [hydratedTabs, setHydratedTabs] = useState<Record<string, boolean>>({
    popular: false,
    top_rated: false,
    trending: false,
  });

  // Refs to store clearState functions from each tab
  const clearTabStateRef = useRef<Record<string, () => void>>({
    popular: () => {},
    top_rated: () => {},
    trending: () => {},
  });

  // Use page state persistence hook
  const [persistedState, setPersistedState] = usePageStatePersistence<TVShowsPageState>(
    "tv-shows-page-state",
    {
      activeTab: "popular",
      genreFilter: "all",
      sortBy: "default",
      viewMode: "grid",
      platformFilters: [],
      showPlatformBar: false,
    }
  );

  // Initialize state from persisted state
  const [activeTab, setActiveTab] = useState<"popular" | "top_rated" | "trending">(
    persistedState.activeTab
  );
  const [genreFilter, setGenreFilter] = useState<string>(persistedState.genreFilter);
  const [sortBy, setSortBy] = useState<"default" | "name" | "first_air_date" | "rating">(
    persistedState.sortBy
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">(persistedState.viewMode);
  const [platformFilters, setPlatformFilters] = useState<string[]>(persistedState.platformFilters);
  const [showPlatformBar, setShowPlatformBar] = useState(persistedState.showPlatformBar);

  // Apply scroll restoration only after hydrations are complete
  useScrollRestoration({ enabled: isHydrated });

  // Track initial page visit
  useEffect(() => {
    void trackMediaPreference("tv", "browse");
  }, []);

  // Effect to update hydration status based on tab hydration
  useEffect(() => {
    // Check if the currently active tab is hydrated
    const isActiveTabHydrated = hydratedTabs[activeTab];
    if (isActiveTabHydrated && !isHydrated) {
      setIsHydrated(true);
    }
  }, [hydratedTabs, activeTab, isHydrated]);

  // Effect to update persisted state when state changes
  useEffect(() => {
    setPersistedState(prevState => ({
      ...prevState,
      activeTab,
      genreFilter,
      sortBy,
      viewMode,
      platformFilters,
      showPlatformBar,
    }));
  }, [activeTab, genreFilter, sortBy, viewMode, platformFilters, showPlatformBar, setPersistedState]);

  // Effect to clear accumulated data when filters change
  useEffect(() => {
    // When filters change significantly, clear the persisted state for all tabs
    if (persistedState.genreFilter !== genreFilter ||
        persistedState.sortBy !== sortBy ||
        JSON.stringify(persistedState.platformFilters) !== JSON.stringify(platformFilters)) {
      // Clear the persisted states for all tabs
      Object.values(clearTabStateRef.current).forEach(clearState => {
        clearState();
      });
    }
  }, [genreFilter, sortBy, platformFilters, persistedState]);

  const handleShowSelect = async (show: Media) => {
    await trackMediaPreference("tv", "select");
    navigate(`/tv/${show.id}`);
  };

  const handleTabChange = (value: string) => {
    const tabValue = value as "popular" | "top_rated" | "trending";
    setActiveTab(tabValue);
    // Update the persisted state when tab changes
    setPersistedState(prevState => ({
      ...prevState,
      activeTab: tabValue
    }));
    void trackMediaPreference("tv", "browse");
  };

  const toggleViewMode = () => {
    setViewMode(prev => {
      const newViewMode = prev === "grid" ? "list" : "grid";
      // Update the persisted state when view mode changes
      setPersistedState(prevState => ({
        ...prevState,
        viewMode: newViewMode
      }));
      return newViewMode;
    });
  };

  const togglePlatformBar = () => {
    setShowPlatformBar(prev => {
      const newShowPlatformBar = !prev;
      // Update the persisted state when platform bar visibility changes
      setPersistedState(prevState => ({
        ...prevState,
        showPlatformBar: newShowPlatformBar
      }));
      return newShowPlatformBar;
    });
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <TVShowsHeader />
          <TVShowsFilters
            sortBy={sortBy}
            onSortChange={(value) => {
              setSortBy(value);
              // Update the persisted state when sort changes
              setPersistedState(prevState => ({
                ...prevState,
                sortBy: value
              }));
            }}
            genreFilter={genreFilter}
            onGenreChange={(value) => {
              setGenreFilter(value);
              // The effect for genre filter changes will handle the persisted state update
            }}
            viewMode={viewMode}
            toggleViewMode={toggleViewMode}
            platformFilters={platformFilters}
            setPlatformFilters={(filters) => {
              setPlatformFilters(filters);
              // Update the persisted state when platform filters change
              setPersistedState(prevState => ({
                ...prevState,
                platformFilters: filters
              }));
            }}
            showPlatformBar={showPlatformBar}
            togglePlatformBar={togglePlatformBar}
          />
          <TVShowsTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
            viewMode={viewMode}
            sortBy={sortBy}
            genreFilter={genreFilter}
            platformFilters={platformFilters}
            onTabHydrated={(tab: string) => {
              setHydratedTabs(prev => ({
                ...prev,
                [tab]: true
              }));
            }}
            setTabClearState={(tab: string, clearState: () => void) => {
              clearTabStateRef.current[tab] = clearState;
            }}
          />
        </main>
        <Footer />
      </div>
    </PageTransition>
  );
};

export default TVShowsPage;
