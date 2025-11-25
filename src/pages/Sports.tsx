import React, { useState, useEffect, useMemo, useRef } from "react";
import { useScrollRestoration, usePageStatePersistence } from "@/hooks";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SportMatchGrid from "@/components/SportMatchGrid";
import PageTransition from "@/components/PageTransition";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sport, APIMatch } from "@/utils/sports-types";
import {
  getSportsList,
  getAllPopularMatches,
  getLiveMatches,
  getTodayMatches,
  getMatchesBySport,
  getPopularMatchesBySport,
  getPopularLiveMatches,
  getPopularTodayMatches,
} from "@/utils/sports-api";
import { useToast } from "@/components/ui/use-toast";
import { useUserPreferences } from "@/hooks/user-preferences";
import { getSportIcon, tabIcons } from "@/utils/sport-icons";
import { Badge } from "@/components/ui/badge";
import { useFavoriteMatches } from "@/hooks/use-favorite-matches";
import DateRangeFilter, { DateRangePreset } from "@/components/DateRangeFilter";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import ErrorState from "@/components/ErrorState";

// Define the interface for the persisted state
interface SportsPageState {
  activeTab: string;
  selectedSport: string;
  dateRange: DateRangePreset;
}

const Sports = () => {
  // Use page state persistence hook
  const [persistedState, setPersistedState] =
    usePageStatePersistence<SportsPageState>("sports-page-state", {
      activeTab: "popular",
      selectedSport: "all",
      dateRange: "all",
    });

  // Initialize state from persisted state
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

  // Refs for keyboard navigation
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Apply scroll restoration - since there's no complex data to restore, hydration is immediate
  useScrollRestoration({ enabled: true });

  const { toast } = useToast();
  const { userPreferences } = useUserPreferences();
  const accentColor = userPreferences?.accentColor || "hsl(var(--accent))";
  const { favorites } = useFavoriteMatches();

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

  // Effect to update persisted state when state changes
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
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch popular matches
  const { data: popularMatches = [], isLoading: popularLoading } = useQuery({
    queryKey: ["sports-popular-matches"],
    queryFn: getAllPopularMatches,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch live matches
  const { data: liveMatches = [], isLoading: liveLoading } = useQuery({
    queryKey: ["sports-live-matches"],
    queryFn: getLiveMatches,
    staleTime: 30 * 1000, // 30 seconds for live data
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch today's matches
  const { data: todayMatches = [], isLoading: todayLoading } = useQuery({
    queryKey: ["sports-today-matches"],
    queryFn: getTodayMatches,
    staleTime: 2 * 60 * 1000, // 2 minutes
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
    // Update the persisted state when tab changes
    setPersistedState(prevState => ({
      ...prevState,
      activeTab: value,
    }));
  };

  const handleSportChange = (sportId: string) => {
    setSelectedSport(sportId);
    // Update the persisted state when sport changes
    setPersistedState(prevState => ({
      ...prevState,
      selectedSport: sportId,
    }));
  };

  // Helper function to clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedSport("all");
    setDateRange("all");
  };

  // Helper function to retry failed requests
  const retryFetch = () => {
    // Refetch all queries
    window.location.reload();
  };

  // Filter matches by date range
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

  // Helper function to filter and sort matches
  const filterAndSortMatches = (matches: APIMatch[]) => {
    let filtered = matches;

    // Apply date range filter
    filtered = filterByDateRange(filtered);

    // Apply search filter
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

    // Apply sport filter if a specific sport is selected
    if (selectedSport !== "all") {
      filtered = filtered.filter(match => match.category === selectedSport);
    }

    // Apply sorting
    if (sortOrder === "time") {
      filtered = [...filtered].sort((a, b) => a.date - b.date);
    } else {
      // Sort by relevance (popular first, then by date)
      filtered = [...filtered].sort((a, b) => {
        if (a.popular && !b.popular) return -1;
        if (!a.popular && b.popular) return 1;
        return a.date - b.date;
      });
    }

    return filtered;
  };

  // Compute the matches to display based on active tab and selected sport
  const displayedMatches = useMemo(() => {
    let matches: APIMatch[] = [];

    if (activeTab === "favorites") {
      // Get all matches and filter by favorites
      const allAvailableMatches = [
        ...popularMatches,
        ...liveMatches,
        ...todayMatches,
      ];
      // Remove duplicates by ID
      const uniqueMatches = allAvailableMatches.filter(
        (match, index, self) => index === self.findIndex(m => m.id === match.id)
      );
      // Filter by favorite IDs
      const favoriteIds = favorites.map(fav => fav.id);
      matches = uniqueMatches.filter(match => favoriteIds.includes(match.id));
    } else if (activeTab === "popular") {
      matches = selectedSport === "all" ? popularMatches : sportPopularMatches;
    } else if (activeTab === "live") {
      matches = liveMatches;
    } else {
      // "all" tab
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
    favorites,
  ]);

  // Determine loading state
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

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Navbar />

        <div className="relative pb-12 pt-20">
          {/* Hero Section */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-accent/10 via-background/50 to-background" />
            <div className="absolute -top-[20%] -right-[10%] h-[500px] w-[500px] rounded-full bg-accent/20 blur-[100px]" />
            <div className="absolute -top-[20%] -left-[10%] h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[100px]" />
          </div>

          <div className="container mx-auto px-4 md:px-6">
            <div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
              <div>
                <h1 className="mb-2 text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
                  Sports <span className="text-accent">Live</span>
                </h1>
                <p className="max-w-2xl text-lg text-white/70">
                  Stream live events, catch up on highlights, and follow your favorite teams across all major leagues.
                </p>
              </div>
              {liveMatches.length > 0 && (
                <div className="flex items-center gap-2 rounded-full bg-red-500/10 px-4 py-2 text-red-500 border border-red-500/20 animate-pulse">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  <span className="font-bold">{liveMatches.length} Live Events</span>
                </div>
              )}
            </div>

            {/* Sports categories */}
            <div className="mb-8 overflow-x-auto pb-2">
              <div className="flex min-w-max space-x-2">
                <button
                  onClick={() => handleSportChange("all")}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${selectedSport === "all"
                    ? "text-white shadow-lg"
                    : "text-white/70 hover:text-white/90 hover:bg-white/5"
                    }`}
                  style={{
                    backgroundColor:
                      selectedSport === "all" ? accentColor : "transparent",
                    border: `1px solid ${selectedSport === "all" ? "transparent" : "rgba(255,255,255,0.2)"}`,
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
                  sportsList.map((sport: Sport) => {
                    const matchCount = selectedSport === sport.id ? displayedMatches.length : 0;
                    return (
                      <button
                        key={sport.id}
                        onClick={() => handleSportChange(sport.id)}
                        className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${selectedSport === sport.id
                          ? "text-white shadow-lg"
                          : "text-white/70 hover:text-white/90 hover:bg-white/5"
                          }`}
                        style={{
                          backgroundColor:
                            selectedSport === sport.id
                              ? accentColor
                              : "transparent",
                          border: `1px solid ${selectedSport === sport.id ? "transparent" : "rgba(255,255,255,0.2)"}`,
                        }}
                      >
                        <span>{getSportIcon(sport.id)}</span>
                        {sport.name}
                      </button>
                    );
                  })
                )}
              </div>

              {showFilters && (
                <div className="mb-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Search input */}
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search matches..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="flex-1 min-w-[200px] rounded-lg border-none bg-white/10 px-4 py-2 text-white placeholder:text-white/50 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-accent"
                    />

                    {/* Date range filter */}
                    <DateRangeFilter value={dateRange} onChange={setDateRange} />

                    {/* Sort dropdown */}
                    <div className="flex items-center space-x-2">
                      <label className="text-white/70">Sort:</label>
                      <select
                        value={sortOrder}
                        onChange={e =>
                          setSortOrder(e.target.value as "time" | "relevance")
                        }
                        className="rounded-lg border-none bg-white/10 px-3 py-2 text-white focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-accent"
                      >
                        <option value="time">Time</option>
                        <option value="relevance">Relevance</option>
                      </select>
                    </div>

                    {/* Hide filters button */}
                    <button
                      onClick={() => setShowFilters(false)}
                      className="rounded-lg bg-white/10 px-4 py-2 text-white hover:bg-white/20"
                    >
                      Hide Filters
                    </button>
                  </div>

                  {/* Active filters indicator */}
                  {(searchQuery || dateRange !== "all" || selectedSport !== "all") && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white/50">Active filters:</span>
                      {searchQuery && (
                        <Badge variant="secondary" className="bg-white/20">
                          Search: {searchQuery}
                        </Badge>
                      )}
                      {dateRange !== "all" && (
                        <Badge variant="secondary" className="bg-white/20">
                          Date: {dateRange}
                        </Badge>
                      )}
                      {selectedSport !== "all" && (
                        <Badge variant="secondary" className="bg-white/20">
                          Sport: {sportsList.find(s => s.id === selectedSport)?.name}
                        </Badge>
                      )}
                      <button
                        onClick={clearFilters}
                        className="text-sm text-accent hover:underline"
                      >
                        Clear all
                      </button>
                    </div>
                  )}
                </div>
              )}

              {!showFilters && (
                <div className="mb-4">
                  <button
                    onClick={() => setShowFilters(true)}
                    className="rounded-lg bg-white/10 px-4 py-2 text-white hover:bg-white/20"
                  >
                    Show Filters
                  </button>
                </div>
              )}
            </div>

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
                  {activeTab === "favorites" && displayedMatches.length > 0 && (
                    <Badge variant="secondary" className="ml-1 bg-white/20">
                      {displayedMatches.length}
                    </Badge>
                  )}
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
                {liveMatches.length > 0 && selectedSport === "all" && !searchQuery && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-4 md:px-8">
                      <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                        Live Now
                      </h2>
                      <button
                        onClick={() => setActiveTab("live")}
                        className="text-sm font-medium text-accent hover:text-accent/80 transition-colors"
                      >
                        View All Live &rarr;
                      </button>
                    </div>
                    <SportMatchGrid
                      matches={liveMatches.slice(0, 4)} // Show top 4 live matches
                      isLoading={liveLoading}
                      emptyType="no-live"
                      className="pb-0"
                    />
                  </div>
                )}

                <SportMatchGrid
                  matches={displayedMatches}
                  title={liveMatches.length > 0 && selectedSport === "all" && !searchQuery ? "Popular Upcoming" : undefined}
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
                <SportMatchGrid
                  matches={displayedMatches}
                  isLoading={false}
                  emptyType={searchQuery ? "search" : "no-matches"}
                  searchQuery={searchQuery}
                  sportName={sportsList.find(s => s.id === selectedSport)?.name}
                  onClearFilters={() => {
                    setSearchQuery("");
                    setSelectedSport("all");
                  }}
                />
                {favorites.length === 0 && !searchQuery && (
                  <div className="py-12 text-center">
                    <p className="text-white/70">
                      You haven't favorited any matches yet. Click the ❤️ icon on any match card to add it to your favorites!
                    </p>
                  </div>
                )}
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
        </div>

        <Footer />
      </div>
    </PageTransition>
  );
};

export default Sports;
