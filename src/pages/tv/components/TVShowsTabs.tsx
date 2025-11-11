import { TabsContent, TabsList, TabsTrigger, Tabs } from "@/components/ui/tabs";
import TabContent from "./TabContent";

interface TVShowsTabsProps {
  activeTab: "popular" | "top_rated" | "trending";
  onTabChange: (value: string) => void;
  viewMode: "grid" | "list";
  sortBy: "default" | "name" | "first_air_date" | "rating";
  genreFilter: string;
  platformFilters: string[];
}

const TVShowsTabs = ({
  activeTab,
  onTabChange,
  viewMode,
  sortBy,
  genreFilter,
  platformFilters,
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
        />
      </TabsContent>
    </Tabs>
  );
};

export default TVShowsTabs;
