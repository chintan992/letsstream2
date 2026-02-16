import { Film, SlidersHorizontal, Grid3X3, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MoviesHeaderProps {
  sortBy: string;
  onSortChange: (value: string) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  resultCount?: number;
}

const MoviesHeader = ({
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  resultCount,
}: MoviesHeaderProps) => {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Film className="h-8 w-8 text-accent" />
        <h1 className="text-3xl font-bold text-white">Movies</h1>
        {resultCount !== undefined && (
          <span className="text-sm text-white/60">({resultCount} results)</span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-white/60" />
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-[160px] border-white/10 bg-white/5 text-white">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-background">
              <SelectItem value="popularity.desc" className="text-white">
                Most Popular
              </SelectItem>
              <SelectItem value="vote_average.desc" className="text-white">
                Highest Rated
              </SelectItem>
              <SelectItem value="release_date.desc" className="text-white">
                Newest First
              </SelectItem>
              <SelectItem value="release_date.asc" className="text-white">
                Oldest First
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center rounded-lg border border-white/10 bg-white/5 p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewModeChange("grid")}
            className={`h-8 w-8 p-0 ${
              viewMode === "grid"
                ? "bg-accent text-white"
                : "text-white/60 hover:bg-white/10 hover:text-white"
            }`}
            aria-label="Grid view"
            aria-pressed={viewMode === "grid"}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewModeChange("list")}
            className={`h-8 w-8 p-0 ${
              viewMode === "list"
                ? "bg-accent text-white"
                : "text-white/60 hover:bg-white/10 hover:text-white"
            }`}
            aria-label="List view"
            aria-pressed={viewMode === "list"}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MoviesHeader;
