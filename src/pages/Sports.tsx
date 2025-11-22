import React, { useState, useEffect } from "react";
import { useScrollRestoration, usePageStatePersistence } from "@/hooks";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SportMatchGrid from "@/components/SportMatchGrid";
import PageTransition from "@/components/PageTransition";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sport } from "@/utils/sports-types";
import {
  getSportsList,
  getAllPopularMatches,
  getLiveMatches,
  getTodayMatches,
  getMatchesBySport,
} from "@/utils/sports-api";
import { useToast } from "@/components/ui/use-toast";
import { useUserPreferences } from "@/hooks/user-preferences";

// Define the interface for the persisted state
interface SportsPageState {
  activeTab: string;
  selectedSport: string;
}

const Sports = () => {
  // Use page state persistence hook
  const [persistedState, setPersistedState] =
    usePageStatePersistence<SportsPageState>("sports-page-state", {
      activeTab: "popular",
      selectedSport: "all",
    });

  // Initialize state from persisted state
  const [activeTab, setActiveTab] = useState<string>(persistedState.activeTab);
  const [selectedSport, setSelectedSport] = useState<string>(
    persistedState.selectedSport
  );

  // Apply scroll restoration - since there's no complex data to restore, hydration is immediate
  useScrollRestoration({ enabled: true });

  const { toast } = useToast();
  const { userPreferences } = useUserPreferences();
  const accentColor = userPreferences?.accentColor || "hsl(var(--accent))";

  // Effect to update persisted state when state changes
  useEffect(() => {
    setPersistedState(prevState => ({
      ...prevState,
      activeTab,
      selectedSport,
    }));
  }, [activeTab, selectedSport, setPersistedState]);

  // Fetch sports list
  const {
    data: sportsList = [],
    isLoading: sportsLoading,
    error: sportsError,
  } = useQuery({
    queryKey: ["sports-list"],
    queryFn: getSportsList,
  });

  // Fetch popular matches
  const { data: popularMatches = [], isLoading: popularLoading } = useQuery({
    queryKey: ["sports-popular-matches"],
    queryFn: getAllPopularMatches,
  });

  // Fetch live matches
  const { data: liveMatches = [], isLoading: liveLoading } = useQuery({
    queryKey: ["sports-live-matches"],
    queryFn: getLiveMatches,
  });

  // Fetch today's matches
  const { data: todayMatches = [], isLoading: todayLoading } = useQuery({
    queryKey: ["sports-today-matches"],
    queryFn: getTodayMatches,
  });

  // Fetch sport-specific matches when a sport is selected
  const { data: sportMatches = [], isLoading: sportMatchesLoading } = useQuery({
    queryKey: ["sports-matches", selectedSport],
    queryFn: () => getMatchesBySport(selectedSport),
    enabled: selectedSport !== "all",
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

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Navbar />

        <div className="pb-12 pt-20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mb-8">
              <h1 className="mb-2 text-3xl font-bold text-white">Sports</h1>
              <p className="text-white/70">
                Stream live and upcoming sports events from around the world.
              </p>
            </div>

            {/* Sports categories */}
            <div className="mb-8 overflow-x-auto pb-2">
              <div className="flex min-w-max space-x-2">
                <button
                  onClick={() => handleSportChange("all")}
                  className={`rounded-full px-4 py-2 text-sm transition-colors ${
                    selectedSport === "all"
                      ? "text-white"
                      : "text-white/70 hover:text-white/90"
                  }`}
                  style={{
                    backgroundColor:
                      selectedSport === "all" ? accentColor : "transparent",
                    border: `1px solid ${selectedSport === "all" ? "transparent" : "rgba(255,255,255,0.2)"}`,
                  }}
                >
                  All Sports
                </button>

                {sportsLoading ? (
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className="h-10 w-24 animate-pulse rounded-full bg-white/10"
                      />
                    ))}
                  </div>
                ) : (
                  sportsList.map((sport: Sport) => (
                    <button
                      key={sport.id}
                      onClick={() => handleSportChange(sport.id)}
                      className={`rounded-full px-4 py-2 text-sm transition-colors ${
                        selectedSport === sport.id
                          ? "text-white"
                          : "text-white/70 hover:text-white/90"
                      }`}
                      style={{
                        backgroundColor:
                          selectedSport === sport.id
                            ? accentColor
                            : "transparent",
                        border: `1px solid ${selectedSport === sport.id ? "transparent" : "rgba(255,255,255,0.2)"}`,
                      }}
                    >
                      {sport.name}
                    </button>
                  ))
                )}
              </div>

              <div className="mb-4 flex items-center justify-between">
                <button className="rounded-lg bg-white/10 px-4 py-2 text-white hover:bg-white/20">
                  Hide Filters
                </button>
                <div className="flex items-center space-x-2">
                  <label className="text-white/70">Sort by:</label>
                  <select className="rounded-lg border-none bg-white/10 text-white">
                    <option value="time">Time</option>
                    <option value="relevance">Relevance</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search for matches..."
                className="w-full rounded-lg border-none bg-white/10 px-4 py-2 text-white"
              />
            </div>

            {/* Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={handleTabChange}
              className="w-full"
            >
              <TabsList className="mb-8 grid w-full grid-cols-3 bg-white/5">
                <TabsTrigger
                  value="popular"
                  className="data-[state=active]:text-white data-[state=active]:shadow"
                  style={{
                    backgroundColor:
                      activeTab === "popular" ? accentColor : "transparent",
                  }}
                >
                  Popular
                </TabsTrigger>
                <TabsTrigger
                  value="live"
                  className="data-[state=active]:text-white data-[state=active]:shadow"
                  style={{
                    backgroundColor:
                      activeTab === "live" ? accentColor : "transparent",
                  }}
                >
                  Live
                </TabsTrigger>
                <TabsTrigger
                  value="all"
                  className="data-[state=active]:text-white data-[state=active]:shadow"
                  style={{
                    backgroundColor:
                      activeTab === "all" ? accentColor : "transparent",
                  }}
                >
                  All
                </TabsTrigger>
              </TabsList>

              <TabsContent value="popular">
                {popularLoading ? (
                  <div className="grid grid-cols-1 gap-4 px-4 py-6 sm:grid-cols-2 md:grid-cols-3 md:gap-6 md:px-8 lg:grid-cols-4 xl:grid-cols-5">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                      <div
                        key={i}
                        className="aspect-video animate-pulse rounded-lg bg-white/10"
                      />
                    ))}
                  </div>
                ) : (
                  <SportMatchGrid
                    matches={
                      activeTab === "popular" && selectedSport === "all"
                        ? popularMatches
                        : sportMatches
                    }
                    emptyMessage={
                      activeTab === "popular" && selectedSport === "all"
                        ? "No popular matches available at the moment."
                        : `No popular ${sportsList.find(s => s.id === selectedSport)?.name || ""} matches available.`
                    }
                  />
                )}
              </TabsContent>

              <TabsContent value="live">
                {liveLoading ? (
                  <div className="grid grid-cols-1 gap-4 px-4 py-6 sm:grid-cols-2 md:grid-cols-3 md:gap-6 md:px-8 lg:grid-cols-4 xl:grid-cols-5">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                      <div
                        key={i}
                        className="aspect-video animate-pulse rounded-lg bg-white/10"
                      />
                    ))}
                  </div>
                ) : (
                  <SportMatchGrid
                    matches={
                      activeTab === "live" && selectedSport === "all"
                        ? liveMatches
                        : sportMatches
                    }
                    emptyMessage={
                      activeTab === "live" && selectedSport === "all"
                        ? "No live matches available at the moment."
                        : `No live ${sportsList.find(s => s.id === selectedSport)?.name || ""} matches right now.`
                    }
                  />
                )}
              </TabsContent>

              <TabsContent value="all">
                {todayLoading ? (
                  <div className="grid grid-cols-1 gap-4 px-4 py-6 sm:grid-cols-2 md:grid-cols-3 md:gap-6 md:px-8 lg:grid-cols-4 xl:grid-cols-5">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                      <div
                        key={i}
                        className="aspect-video animate-pulse rounded-lg bg-white/10"
                      />
                    ))}
                  </div>
                ) : (
                  <SportMatchGrid
                    matches={
                      activeTab === "all" && selectedSport === "all"
                        ? todayMatches
                        : sportMatches
                    }
                    emptyMessage={
                      activeTab === "all" && selectedSport === "all"
                        ? "No matches scheduled for today."
                        : `No ${sportsList.find(s => s.id === selectedSport)?.name || ""} matches available.`
                    }
                  />
                )}
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
