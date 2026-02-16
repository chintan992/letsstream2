import React, { useState, useEffect, useMemo, useRef } from "react";
import { useScrollRestoration, usePageStatePersistence } from "@/hooks";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SportMatchGrid from "@/components/SportMatchGrid";
import SportsHero from "@/components/SportsHero";
import SportsFilterBar from "@/components/SportsFilterBar";
import EmptyState from "@/components/EmptyState";
import PageTransition from "@/components/PageTransition";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sport, APIMatch } from "@/utils/sports-types";
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
import { getSportIcon, tabIcons } from "@/utils/sport-icons";
import { DateRangePreset } from "@/components/DateRangeFilter";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import ErrorState from "@/components/ErrorState";

interface SportsPageState {
  activeTab: string;
  selectedSport: string;
  dateRange: DateRangePreset;
}

const Sports = () => {
  const [persistedState, setPersistedState] =
    usePageStatePersistence<SportsPageState>("sports-page-state", {
      activeTab: "popular",
      selectedSport: "all",
      dateRange: "all",
    });

  const [activeTab, setActiveTab] = useState<string>(persistedState.activeTab);
  const [selectedSport, setSelectedSport] = useState<string>(
    persistedState.selectedSport
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"time" | "relevance">("time");
  const [showFilters, setShowFilters] = useState<boolean>(true);
  const [dateRange, setDateRange] = useState<DateRangePreset>(
    persistedState.dateRange
  );

  const searchInputRef = useRef<HTMLInputElement>(null);
  useScrollRestoration({ enabled: true });

  const { toast } = useToast();
  const { userPreferences } = useUserPreferences();
  const accentColor = userPreferences?.accentColor || "hsl(var(--accent))";

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: "1",
      handler: () => setActiveTab("popular"),
      description: "Switch to Popular tab",
    },
    {
      key: "2",
      handler: () => setActiveTab("live"),
      description: "Switch to Live tab",
    },
    {
      key: "3",
      handler: () => setActiveTab("favorites"),
      description: "Switch to Favorites tab",
    },
    {
      key: "4",
      handler: () => setActiveTab("all"),
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
        setSearchQuery("");
        setSelectedSport("all");
        setDateRange("all");
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

  useEffect(() => {
    if (sportsError) {
      toast({
        title: "Error",
        description: "Failed to load sports. Please try again later.",
        variant: "destructive",
      });
    }
  }, [sportsError, toast]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleSportChange = (sportId: string) => {
    setSelectedSport(sportId);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedSport("all");
    setDateRange("all");
  };

  const retryFetch = () => {
    window.location.reload();
  };

  const filterByDateRange = (matches: APIMatch[]): APIMatch[] => {
    if (dateRange === "all") return matches;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    return matches.filter(match => {
      const matchDate = new Date(match.date);
      const matchDay = new Date(
        matchDate.getFullYear(),
        matchDate.getMonth(),
        matchDate.getDate()
      );

      switch (dateRange) {
        case "today":
          return matchDay.getTime() === today.getTime();
        case "tomorrow":
          return matchDay.getTime() === tomorrow.getTime();
        case "week":
          return matchDate >= today && matchDate < nextWeek;
        default:
          return true;
      }
    });
  };

  const filterAndSortMatches = (matches: APIMatch[]) => {
    let filtered = matches;

    filtered = filterByDateRange(filtered);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        match =>
          match.title.toLowerCase().includes(query) ||
          match.category.toLowerCase().includes(query) ||
          match.teams?.home?.name.toLowerCase().includes(query) ||
          match.teams?.away?.name.toLowerCase().includes(query)
      );
    }

    if (selectedSport !== "all") {
      filtered = filtered.filter(match => match.category === selectedSport);
    }

    if (sortOrder === "time") {
      filtered = [...filtered].sort((a, b) => a.date - b.date);
    } else {
      filtered = [...filtered].sort((a, b) => {
        if (a.popular && !b.popular) return -1;
        if (!a.popular && b.popular) return 1;
        return a.date - b.date;
      });
    }

    return filtered;
  };

  const displayedMatches = useMemo(() => {
    let matches: APIMatch[] = [];

    if (activeTab === "popular") {
      matches = selectedSport === "all" ? popularMatches : sportPopularMatches;
    } else if (activeTab === "live") {
      matches = liveMatches;
    } else {
      matches = selectedSport === "all" ? todayMatches : sportAllMatches;
    }

    return filterAndSortMatches(matches);
  }, [
    activeTab,
    selectedSport,
    popularMatches,
    sportPopularMatches,
    liveMatches,
    todayMatches,
    sportAllMatches,
    searchQuery,
    sortOrder,
    dateRange,
  ]);

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
          {/* Sports categories */}
          <div className="mb-8 overflow-x-auto pb-2">
            <div className="flex min-w-max space-x-2">
              <button
                onClick={() => handleSportChange("all")}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  selectedSport === "all"
                    ? "text-white shadow-lg"
                    : "text-white/70 hover:bg-white/5 hover:text-white/90"
                }`}
                style={{
                  backgroundColor:
                    selectedSport === "all" ? accentColor : "transparent",
                  border: `1px solid ${
                    selectedSport === "all"
                      ? "transparent"
                      : "rgba(255,255,255,0.2)"
                  }`,
                }}
              >
                <span>🏅</span>
                All Sports
              </button>

              {sportsLoading ? (
                <div className="flex space-x-2">
                  {[1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className="h-10 w-28 animate-pulse rounded-full bg-white/10"
                    />
                  ))}
                </div>
              ) : (
                sportsList.map((sport: Sport) => (
                  <button
                    key={sport.id}
                    onClick={() => handleSportChange(sport.id)}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                      selectedSport === sport.id
                        ? "text-white shadow-lg"
                        : "text-white/70 hover:bg-white/5 hover:text-white/90"
                    }`}
                    style={{
                      backgroundColor:
                        selectedSport === sport.id
                          ? accentColor
                          : "transparent",
                      border: `1px solid ${
                        selectedSport === sport.id
                          ? "transparent"
                          : "rgba(255,255,255,0.2)"
                      }`,
                    }}
                  >
                    <span>{getSportIcon(sport.id)}</span>
                    {sport.name}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Filter Bar */}
          <SportsFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            sortOrder={sortOrder}
            onSortChange={setSortOrder}
            selectedSport={selectedSport}
            sportsList={sportsList}
            onClearFilters={clearFilters}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(!showFilters)}
            className="mb-8"
          />

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="mb-8 grid w-full grid-cols-4 bg-white/5">
              <TabsTrigger
                value="popular"
                className="flex items-center gap-2 data-[state=active]:text-white data-[state=active]:shadow"
                style={{
                  backgroundColor:
                    activeTab === "popular" ? accentColor : "transparent",
                }}
              >
                <span>{tabIcons.popular}</span>
                Popular
                {activeTab === "popular" && displayedMatches.length > 0 && (
                  <Badge variant="secondary" className="ml-1 bg-white/20">
                    {displayedMatches.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="live"
                className="flex items-center gap-2 data-[state=active]:text-white data-[state=active]:shadow"
                style={{
                  backgroundColor:
                    activeTab === "live" ? accentColor : "transparent",
                }}
              >
                <span>{tabIcons.live}</span>
                Live
                {activeTab === "live" && displayedMatches.length > 0 && (
                  <Badge variant="secondary" className="ml-1 bg-white/20">
                    {displayedMatches.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="favorites"
                className="flex items-center gap-2 data-[state=active]:text-white data-[state=active]:shadow"
                style={{
                  backgroundColor:
                    activeTab === "favorites" ? accentColor : "transparent",
                }}
              >
                <span>❤️</span>
                Favorites
              </TabsTrigger>
              <TabsTrigger
                value="all"
                className="flex items-center gap-2 data-[state=active]:text-white data-[state=active]:shadow"
                style={{
                  backgroundColor:
                    activeTab === "all" ? accentColor : "transparent",
                }}
              >
                <span>{tabIcons.all}</span>
                All
                {activeTab === "all" && displayedMatches.length > 0 && (
                  <Badge variant="secondary" className="ml-1 bg-white/20">
                    {displayedMatches.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="popular" className="space-y-8">
              {/* Live Now Section in Popular Tab */}
              {liveMatches.length > 0 &&
                selectedSport === "all" &&
                !searchQuery && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-4 md:px-8">
                      <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
                        <span className="relative flex h-3 w-3">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
                        </span>
                        Live Now
                      </h2>
                      <button
                        onClick={() => setActiveTab("live")}
                        className="hover:text-accent/80 text-sm font-medium text-accent transition-colors"
                      >
                        View All Live &rarr;
                      </button>
                    </div>
                    <SportMatchGrid
                      matches={liveMatches.slice(0, 4)}
                      isLoading={liveLoading}
                      emptyType="no-live"
                      className="pb-0"
                    />
                  </div>
                )}

              <SportMatchGrid
                matches={displayedMatches}
                title={
                  liveMatches.length > 0 &&
                  selectedSport === "all" &&
                  !searchQuery
                    ? "Popular Upcoming"
                    : undefined
                }
                isLoading={isLoading}
                emptyType={searchQuery ? "search" : "no-popular"}
                searchQuery={searchQuery}
                sportName={sportsList.find(s => s.id === selectedSport)?.name}
                onClearFilters={() => {
                  setSearchQuery("");
                  setSelectedSport("all");
                }}
              />
            </TabsContent>

            <TabsContent value="live">
              <SportMatchGrid
                matches={displayedMatches}
                isLoading={isLoading}
                emptyType={searchQuery ? "search" : "no-live"}
                searchQuery={searchQuery}
                sportName={sportsList.find(s => s.id === selectedSport)?.name}
                onClearFilters={() => {
                  setSearchQuery("");
                  setSelectedSport("all");
                }}
              />
            </TabsContent>

            <TabsContent value="favorites">
              <EmptyState
                type="no-matches"
                sportName={sportsList.find(s => s.id === selectedSport)?.name}
                onClearFilters={clearFilters}
              />
            </TabsContent>

            <TabsContent value="all">
              <SportMatchGrid
                matches={displayedMatches}
                isLoading={isLoading}
                emptyType={searchQuery ? "search" : "no-matches"}
                searchQuery={searchQuery}
                sportName={sportsList.find(s => s.id === selectedSport)?.name}
                onClearFilters={() => {
                  setSearchQuery("");
                  setSelectedSport("all");
                }}
              />
            </TabsContent>
          </Tabs>
        </div>

        <Footer />
      </div>
    </PageTransition>
  );
};

export default Sports;
