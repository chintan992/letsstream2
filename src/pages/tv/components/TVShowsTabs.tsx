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
  const tabs = [
    { value: "popular", label: "Popular" },
    { value: "top_rated", label: "Top Rated" },
    { value: "trending", label: "Trending" },
  ] as const;

  return (
    <Tabs defaultValue={activeTab} onValueChange={onTabChange}>
      <TabsList className="mb-4 md:mb-6">
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
          <TabContent
            type={tab.value}
            viewMode={viewMode}
            sortBy={sortBy}
            genreFilter={genreFilter}
            platformFilters={platformFilters}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default TVShowsTabs;
