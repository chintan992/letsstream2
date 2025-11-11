import { Filter, Grid3X3, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STREAMING_PLATFORMS } from "../constants/streamingPlatforms";
import PlatformFilter from "./PlatformFilter";
import PlatformBar from "./PlatformBar";

interface TVShowsFiltersProps {
  sortBy: "default" | "name" | "first_air_date" | "rating";
  onSortChange: (
    value: "default" | "name" | "first_air_date" | "rating"
  ) => void;
  genreFilter: string;
  onGenreChange: (value: string) => void;
  platformFilters: string[];
  setPlatformFilters: (platforms: string[]) => void;
  viewMode: "grid" | "list";
  toggleViewMode: () => void;
  showPlatformBar: boolean;
  togglePlatformBar: () => void;
}

const TVShowsFilters = ({
  sortBy,
  onSortChange,
  genreFilter,
  onGenreChange,
  platformFilters,
  setPlatformFilters,
  viewMode,
  toggleViewMode,
  showPlatformBar,
  togglePlatformBar,
}: TVShowsFiltersProps) => {
  const clearPlatformFilters = () => {
    setPlatformFilters([]);
  };

  const togglePlatformFilter = (platformId: string) => {
    // Fix the type error by properly handling the state update
    if (platformFilters.includes(platformId)) {
      // Remove platform from filters
      setPlatformFilters(platformFilters.filter(id => id !== platformId));
    } else {
      // Add platform to filters
      setPlatformFilters([...platformFilters, platformId]);
    }
  };

  return (
    <div className="mb-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-4 pt-6">
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-[180px] border-white/10 bg-transparent text-white">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-background text-white">
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="first_air_date">First Air Date</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
            </SelectContent>
          </Select>

          <Select value={genreFilter} onValueChange={onGenreChange}>
            <SelectTrigger className="w-[180px] border-white/10 bg-transparent text-white">
              <SelectValue placeholder="Filter by Genre" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-background text-white">
              <SelectItem value="all">All Genres</SelectItem>
              <SelectItem value="10759">Action & Adventure</SelectItem>
              <SelectItem value="35">Comedy</SelectItem>
              <SelectItem value="18">Drama</SelectItem>
              <SelectItem value="10765">Sci-Fi & Fantasy</SelectItem>
              <SelectItem value="80">Crime</SelectItem>
              <SelectItem value="9648">Mystery</SelectItem>
              <SelectItem value="10762">Kids</SelectItem>
            </SelectContent>
          </Select>

          <PlatformFilter
            platformFilters={platformFilters}
            togglePlatformFilter={togglePlatformFilter}
            clearPlatformFilters={clearPlatformFilters}
            togglePlatformBar={togglePlatformBar}
            showPlatformBar={showPlatformBar}
          />

          <Button
            variant="outline"
            size="sm"
            className="group border-white/10 text-white hover:bg-white/10"
            onClick={toggleViewMode}
          >
            {viewMode === "grid" ? (
              <>
                <List className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                List View
              </>
            ) : (
              <>
                <Grid3X3 className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                Grid View
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Platform Quick Filter Bar */}
      {showPlatformBar && (
        <PlatformBar
          platformFilters={platformFilters}
          setPlatformFilters={setPlatformFilters}
        />
      )}

      {/* Platform Filter Summary */}
      {platformFilters.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-white/70">
          <span>Showing on:</span>
          {platformFilters.map(platformId => {
            const platform = STREAMING_PLATFORMS.find(p => p.id === platformId);
            return platform ? (
              <div
                key={platformId}
                className="bg-accent/20 flex items-center gap-1 rounded-full px-2 py-1 text-xs"
              >
                {platform.icon && (
                  <platform.icon className={`h-3 w-3 ${platform.color}`} />
                )}
                {platform.name}
                <button
                  onClick={() => togglePlatformFilter(platformId)}
                  className="ml-1 text-white/60 hover:text-white"
                >
                  ×
                </button>
              </div>
            ) : null;
          })}
          {platformFilters.length > 1 && (
            <button
              onClick={clearPlatformFilters}
              className="hover:text-accent/80 text-xs text-accent underline"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TVShowsFilters;
