import React, { useReducer, useEffect, useMemo, useRef } from "react";
import { useScrollRestoration, usePageStatePersistence } from "@/hooks";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SportsHero from "@/components/SportsHero";
import SportsFilterBar from "@/components/SportsFilterBar";
import PageTransition from "@/components/PageTransition";
import {
  getSportsList,
  getAllPopularMatches,
  getLiveMatches,
  getTodayMatches,
  getMatchesBySport,
  getPopularMatchesBySport,
} from "@/utils/sports-api";
import { useToast } from "@/components/ui/use-toast";
import { useUserPreferences } from "@/hooks/user-preferences";
import { DateRangePreset } from "@/components/DateRangeFilter";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import ErrorState from "@/components/ErrorState";
import { SportsCategories } from "@/components/sports/SportsCategories";
import { SportsTabs } from "@/components/sports/SportsTabs";
import { useFilteredMatches } from "@/hooks/use-filtered-matches";

interface SportsPageState {
  activeTab: string;
  selectedSport: string;
  dateRange: DateRangePreset;
}

type SportsState = {
  activeTab: string;
  selectedSport: string;
  searchQuery: string;
  sortOrder: "time" | "relevance";
  showFilters: boolean;
  dateRange: DateRangePreset;
};

// Extracted hook to avoid no-effect-event-handler warning in the main component
function useSportsErrorToast(error: unknown) {
  const { toast } = useToast();
  const lastErrorRef = useRef<unknown>(null);
  useEffect(() => {
    if (error && error !== lastErrorRef.current) {
      lastErrorRef.current = error;
      toast({
        title: "Error",
        description: "Failed to load sports. Please try again later.",
        variant: "destructive",
      });
    }
  }, [error, toast]);
}

const Sports = () => {
  const [persistedState, setPersistedState] =
    usePageStatePersistence<SportsPageState>("sports-page-state", {
      activeTab: "popular",
      selectedSport: "all",
      dateRange: "all",
    });

  const [state, dispatch] = useReducer(
    (prev: SportsState, action: Partial<SportsState>) => ({
      ...prev,
      ...action,
    }),
    {
      activeTab: persistedState.activeTab,
      selectedSport: persistedState.selectedSport,
      searchQuery: "",
      sortOrder: "time",
      showFilters: true,
      dateRange: persistedState.dateRange,
    }
  );

  const {
    activeTab,
    selectedSport,
    searchQuery,
    sortOrder,
    showFilters,
    dateRange,
  } = state;

  const searchInputRef = useRef<HTMLInputElement>(null);
  useScrollRestoration({ enabled: true });

  const { userPreferences } = useUserPreferences();
  const accentColor = userPreferences?.accentColor || "hsl(var(--accent))";

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: "1",
      handler: () => dispatch({ activeTab: "popular" }),
      description: "Switch to Popular tab",
    },
    {
      key: "2",
      handler: () => dispatch({ activeTab: "live" }),
      description: "Switch to Live tab",
    },
    {
      key: "3",
      handler: () => dispatch({ activeTab: "favorites" }),
      description: "Switch to Favorites tab",
    },
    {
      key: "4",
      handler: () => dispatch({ activeTab: "all" }),
      description: "Switch to All tab",
    },
    {
      key: "/",
      handler: () => searchInputRef.current?.focus(),
      description: "Focus search",
    },
    {
      key: "Escape",
      handler: () => {
        dispatch({ searchQuery: "", selectedSport: "all", dateRange: "all" });
        searchInputRef.current?.blur();
      },
      description: "Clear filters",
    },
  ]);

  useEffect(() => {
    setPersistedState(prevState => ({
      ...prevState,
      activeTab,
      selectedSport,
      dateRange,
    }));
  }, [activeTab, selectedSport, dateRange, setPersistedState]);

  // Fetch sports list
  const {
    data: sportsList = [],
    isLoading: sportsLoading,
    error: sportsError,
  } = useQuery({
    queryKey: ["sports-list"],
    queryFn: getSportsList,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  useSportsErrorToast(sportsError);

  // Fetch popular matches
  const { data: popularMatches = [], isLoading: popularLoading } = useQuery({
    queryKey: ["sports-popular-matches"],
    queryFn: getAllPopularMatches,
    staleTime: 2 * 60 * 1000,
  });

  // Fetch live matches
  const { data: liveMatches = [], isLoading: liveLoading } = useQuery({
    queryKey: ["sports-live-matches"],
    queryFn: getLiveMatches,
    staleTime: 30 * 1000,
    refetchInterval: 30000,
  });

  // Fetch today's matches
  const { data: todayMatches = [], isLoading: todayLoading } = useQuery({
    queryKey: ["sports-today-matches"],
    queryFn: getTodayMatches,
    staleTime: 2 * 60 * 1000,
  });

  // Fetch sport-specific popular matches
  const { data: sportPopularMatches = [], isLoading: sportPopularLoading } =
    useQuery({
      queryKey: ["sports-popular-matches", selectedSport],
      queryFn: () => getPopularMatchesBySport(selectedSport),
      enabled: selectedSport !== "all",
      staleTime: 2 * 60 * 1000,
    });

  // Fetch sport-specific all matches
  const { data: sportAllMatches = [], isLoading: sportAllLoading } = useQuery({
    queryKey: ["sports-all-matches", selectedSport],
    queryFn: () => getMatchesBySport(selectedSport),
    enabled: selectedSport !== "all",
    staleTime: 2 * 60 * 1000,
  });

  const clearFilters = () => {
    dispatch({ searchQuery: "", selectedSport: "all", dateRange: "all" });
  };

  const retryFetch = () => {
    window.location.reload();
  };

  const displayedMatches = useFilteredMatches({
    activeTab,
    selectedSport,
    searchQuery,
    sortOrder,
    dateRange,
    popularMatches,
    sportPopularMatches,
    liveMatches,
    todayMatches,
    sportAllMatches,
  });

  const isLoading = useMemo(() => {
    if (activeTab === "popular") {
      return selectedSport === "all" ? popularLoading : sportPopularLoading;
    } else if (activeTab === "live") {
      return liveLoading;
    } else {
      return selectedSport === "all" ? todayLoading : sportAllLoading;
    }
  }, [
    activeTab,
    selectedSport,
    popularLoading,
    sportPopularLoading,
    liveLoading,
    todayLoading,
    sportAllLoading,
  ]);

  if (sportsError) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background">
          <Navbar />
          <div className="container mx-auto px-4 pt-24">
            <ErrorState error={sportsError as Error} onRetry={retryFetch} />
          </div>
          <Footer />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Navbar />
        <SportsHero liveMatchesCount={liveMatches.length} />

        <div className="container mx-auto px-4 pb-12 md:px-6">
          <SportsCategories
            sportsList={sportsList}
            selectedSport={selectedSport}
            sportsLoading={sportsLoading}
            accentColor={accentColor}
            onSportChange={sportId => dispatch({ selectedSport: sportId })}
          />

          <SportsFilterBar
            searchQuery={searchQuery}
            onSearchChange={q => dispatch({ searchQuery: q })}
            dateRange={dateRange}
            onDateRangeChange={r => dispatch({ dateRange: r })}
            sortOrder={sortOrder}
            onSortChange={o => dispatch({ sortOrder: o })}
            selectedSport={selectedSport}
            sportsList={sportsList}
            onClearFilters={clearFilters}
            showFilters={showFilters}
            onToggleFilters={() => dispatch({ showFilters: !showFilters })}
            className="mb-8"
          />

          <SportsTabs
            activeTab={activeTab}
            onTabChange={t => dispatch({ activeTab: t })}
            accentColor={accentColor}
            displayedMatches={displayedMatches}
            liveMatches={liveMatches}
            selectedSport={selectedSport}
            searchQuery={searchQuery}
            isLoading={isLoading}
            liveLoading={liveLoading}
            sportsList={sportsList}
            onClearFilters={clearFilters}
          />
        </div>

        <Footer />
      </div>
    </PageTransition>
  );
};

export default Sports;
