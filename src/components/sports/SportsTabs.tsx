import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { tabIcons } from "@/utils/sport-icons";
import SportMatchGrid from "@/components/SportMatchGrid";
import EmptyState from "@/components/EmptyState";
import { APIMatch, Sport } from "@/utils/sports-types";

interface SportsTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  accentColor: string;
  displayedMatches: APIMatch[];
  liveMatches: APIMatch[];
  selectedSport: string;
  searchQuery: string;
  isLoading: boolean;
  liveLoading: boolean;
  sportsList: Sport[];
  onClearFilters: () => void;
}

export function SportsTabs({
  activeTab,
  onTabChange,
  accentColor,
  displayedMatches,
  liveMatches,
  selectedSport,
  searchQuery,
  isLoading,
  liveLoading,
  sportsList,
  onClearFilters,
}: SportsTabsProps) {
  const sportName = sportsList.find(s => s.id === selectedSport)?.name;

  const getCountForTab = (tabValue: string) => {
    if (tabValue === "live") return liveMatches.length;
    return activeTab === tabValue ? displayedMatches.length : 0;
  };

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
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
          {getCountForTab("popular") > 0 && (
            <Badge variant="secondary" className="ml-1 bg-white/20">
              {getCountForTab("popular")}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger
          value="live"
          className="flex items-center gap-2 data-[state=active]:text-white data-[state=active]:shadow"
          style={{
            backgroundColor: activeTab === "live" ? accentColor : "transparent",
          }}
        >
          <span>{tabIcons.live}</span>
          Live
          {getCountForTab("live") > 0 && (
            <Badge variant="secondary" className="ml-1 bg-white/20">
              {getCountForTab("live")}
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
          {getCountForTab("favorites") > 0 && (
            <Badge variant="secondary" className="ml-1 bg-white/20">
              {getCountForTab("favorites")}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger
          value="all"
          className="flex items-center gap-2 data-[state=active]:text-white data-[state=active]:shadow"
          style={{
            backgroundColor: activeTab === "all" ? accentColor : "transparent",
          }}
        >
          <span>{tabIcons.all}</span>
          All
          {getCountForTab("all") > 0 && (
            <Badge variant="secondary" className="ml-1 bg-white/20">
              {getCountForTab("all")}
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
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
                </span>
                Live Now
              </h2>
              <button
                onClick={() => onTabChange("live")}
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
            liveMatches.length > 0 && selectedSport === "all" && !searchQuery
              ? "Popular Upcoming"
              : undefined
          }
          isLoading={isLoading}
          emptyType={searchQuery ? "search" : "no-popular"}
          searchQuery={searchQuery}
          sportName={sportName}
          onClearFilters={onClearFilters}
        />
      </TabsContent>

      <TabsContent value="live">
        <SportMatchGrid
          matches={displayedMatches}
          isLoading={liveLoading}
          emptyType={searchQuery ? "search" : "no-live"}
          searchQuery={searchQuery}
          sportName={sportName}
          onClearFilters={onClearFilters}
        />
      </TabsContent>

      <TabsContent value="favorites">
        <SportMatchGrid
          matches={displayedMatches}
          isLoading={isLoading}
          emptyType="no-favorites"
          searchQuery={searchQuery}
          sportName={sportName}
          onClearFilters={onClearFilters}
        />
      </TabsContent>

      <TabsContent value="all">
        <SportMatchGrid
          matches={displayedMatches}
          isLoading={isLoading}
          emptyType={searchQuery ? "search" : "no-matches"}
          searchQuery={searchQuery}
          sportName={sportName}
          onClearFilters={onClearFilters}
        />
      </TabsContent>
    </Tabs>
  );
}
