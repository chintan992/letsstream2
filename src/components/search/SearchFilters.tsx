import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SearchFiltersProps {
  advancedSearch: boolean;
  onToggleAdvanced: () => void;
  mediaType: string;
  onMediaTypeChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
}

const SearchFilters = ({
  advancedSearch,
  onToggleAdvanced,
  mediaType,
  onMediaTypeChange,
  sortBy,
  onSortByChange,
}: SearchFiltersProps) => {
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        className="h-12 border-white/10 text-white"
        onClick={onToggleAdvanced}
      >
        <Filter className="mr-2 h-4 w-4" />
        {advancedSearch ? "Hide Filters" : "Advanced Search"}
      </Button>

      {advancedSearch && (
        <div className="w-full animate-fade-in rounded-md bg-white/5 p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="media-type-select"
                className="mb-2 block text-sm text-white/70"
              >
                Media Type
              </label>
              <Select value={mediaType} onValueChange={onMediaTypeChange}>
                <SelectTrigger
                  id="media-type-select"
                  className="border-white/10 bg-white/10 text-white"
                >
                  <SelectValue placeholder="Select media type" />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-background">
                  <SelectItem value="all" className="text-white">
                    All
                  </SelectItem>
                  <SelectItem value="movie" className="text-white">
                    Movies
                  </SelectItem>
                  <SelectItem value="tv" className="text-white">
                    TV Shows
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label
                htmlFor="sort-by-select"
                className="mb-2 block text-sm text-white/70"
              >
                Sort By
              </label>
              <Select value={sortBy} onValueChange={onSortByChange}>
                <SelectTrigger
                  id="sort-by-select"
                  className="border-white/10 bg-white/10 text-white"
                >
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-background">
                  <SelectItem value="popularity" className="text-white">
                    Popularity
                  </SelectItem>
                  <SelectItem value="rating" className="text-white">
                    Rating
                  </SelectItem>
                  <SelectItem value="newest" className="text-white">
                    Newest
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchFilters;
