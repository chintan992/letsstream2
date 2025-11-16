import { TabsContent, TabsList, TabsTrigger, Tabs } from "@/components/ui/tabs";
import TabContent from "./TabContent";

interface TVShowsTabsProps {
  activeTab: "popular" | "top_rated" | "trending";
  onTabChange: (value: string) => void;
  viewMode: "grid" | "list";
  sortBy: "default" | "name" | "first_air_date" | "rating";
  genreFilter: string;
  platformFilters: string[];
  onTabHydrated?: (tab: string) => void;  // Callback to notify parent when a tab is hydrated
  setTabClearState?: (tab: string, clearState: () => void) => void; // Callback to register clearState function for each tab
}

const TVShowsTabs = ({
  activeTab,
  onTabChange,
  viewMode,
  sortBy,
  genreFilter,
  platformFilters,
  onTabHydrated,
  setTabClearState,
}: TVShowsTabsProps) => {
  return (
    <Tabs defaultValue={activeTab} onValueChange={onTabChange}>
      <TabsList className="mb-4 md:mb-6">
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
        <TabsTrigger
          value="trending"
          className="data-[state=active]:bg-accent/20"
        >
          Trending
        </TabsTrigger>
      </TabsList>

      <TabsContent
        value="popular"
        className="animate-fade-in focus-visible:outline-none"
      >
        <TabContent
          type="popular"
          viewMode={viewMode}
          sortBy={sortBy}
          genreFilter={genreFilter}
          platformFilters={platformFilters}
          onHydrationComplete={() => onTabHydrated && onTabHydrated("popular")}
          setClearState={(clearState) => setTabClearState && setTabClearState("popular", clearState)}
        />
      </TabsContent>

      <TabsContent
        value="top_rated"
        className="animate-fade-in focus-visible:outline-none"
      >
        <TabContent
          type="top_rated"
          viewMode={viewMode}
          sortBy={sortBy}
          genreFilter={genreFilter}
          platformFilters={platformFilters}
          onHydrationComplete={() => onTabHydrated && onTabHydrated("top_rated")}
          setClearState={(clearState) => setTabClearState && setTabClearState("top_rated", clearState)}
        />
      </TabsContent>

      <TabsContent
        value="trending"
        className="animate-fade-in focus-visible:outline-none"
      >
        <TabContent
          type="trending"
          viewMode={viewMode}
          sortBy={sortBy}
          genreFilter={genreFilter}
          platformFilters={platformFilters}
          onHydrationComplete={() => onTabHydrated && onTabHydrated("trending")}
          setClearState={(clearState) => setTabClearState && setTabClearState("trending", clearState)}
        />
      </TabsContent>
    </Tabs>
  );
};

export default TVShowsTabs;
