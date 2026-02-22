import React from "react";
import { Search, X, Filter, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DateRangeFilter, { DateRangePreset } from "@/components/DateRangeFilter";
import { Sport } from "@/utils/sports-types";
import { useUserPreferences } from "@/hooks/user-preferences";
import { cn } from "@/lib/utils";

interface SportsFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  dateRange: DateRangePreset;
  onDateRangeChange: (value: DateRangePreset) => void;
  sortOrder: "time" | "relevance";
  onSortChange: (value: "time" | "relevance") => void;
  selectedSport: string;
  sportsList: Sport[];
  onClearFilters: () => void;
  onClearSport?: () => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  className?: string;
}

const SportsFilterBar = ({
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  sortOrder,
  onSortChange,
  selectedSport,
  sportsList,
  onClearFilters,
  onClearSport,
  showFilters,
  onToggleFilters,
  className,
}: SportsFilterBarProps) => {
  const { userPreferences } = useUserPreferences();
  const accentColor = userPreferences?.accentColor || "hsl(var(--accent))";
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const hasActiveFilters =
    searchQuery || dateRange !== "all" || selectedSport !== "all";

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleFilters}
            className={cn(
              "gap-2 border transition-all duration-300",
              showFilters
                ? "border-white/10 bg-white/10 text-white"
                : "border-transparent text-white/70 hover:bg-white/5 hover:text-white"
            )}
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>

          {hasActiveFilters && !showFilters && (
            <Badge
              variant="secondary"
              className="bg-accent/20 border-accent/20 text-accent-foreground"
            >
              Active Filters
            </Badge>
          )}
        </div>

        {/* Sort Dropdown (Always visible) */}
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-white/50 sm:inline-block">
            Sort by:
          </span>
          <Select
            value={sortOrder}
            onValueChange={value => onSortChange(value as "time" | "relevance")}
          >
            <SelectTrigger className="h-8 w-[110px] border-white/10 bg-white/5 text-xs text-white focus:ring-accent">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-gray-900 text-white">
              <SelectItem value="time">Time</SelectItem>
              <SelectItem value="relevance">Relevance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Collapsible Filter Area */}
      <div
        className={cn(
          "grid overflow-hidden transition-all duration-300 ease-in-out",
          showFilters
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="min-h-0">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search matches, teams, or leagues..."
                  value={searchQuery}
                  onChange={e => onSearchChange(e.target.value)}
                  className="focus:border-accent/50 focus:ring-accent/50 w-full rounded-lg border border-white/10 bg-black/20 py-2 pl-9 pr-4 text-sm text-white transition-all placeholder:text-white/30 focus:outline-none focus:ring-1"
                />
                {searchQuery && (
                  <button
                    onClick={() => onSearchChange("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Date Range Filter */}
              <div className="w-full md:w-auto">
                <DateRangeFilter
                  value={dateRange}
                  onChange={onDateRangeChange}
                />
              </div>
            </div>

            {/* Active Filters Summary */}
            {hasActiveFilters && (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/5 pt-3">
                <span className="mr-1 text-xs text-white/40">Active:</span>

                {searchQuery && (
                  <Badge
                    variant="secondary"
                    className="gap-1 bg-white/10 transition-colors hover:bg-white/20"
                  >
                    Search: "{searchQuery}"
                    <X
                      className="h-3 w-3 cursor-pointer opacity-70 hover:opacity-100"
                      onClick={() => onSearchChange("")}
                    />
                  </Badge>
                )}

                {dateRange !== "all" && (
                  <Badge
                    variant="secondary"
                    className="gap-1 bg-white/10 transition-colors hover:bg-white/20"
                  >
                    Date: {dateRange}
                    <X
                      className="h-3 w-3 cursor-pointer opacity-70 hover:opacity-100"
                      onClick={() => onDateRangeChange("all")}
                    />
                  </Badge>
                )}

                {selectedSport !== "all" && (
                  <Badge
                    variant="secondary"
                    className="gap-1 bg-white/10 transition-colors hover:bg-white/20"
                  >
                    Sport:{" "}
                    {sportsList.find(s => s.id === selectedSport)?.name ||
                      selectedSport}
                    <X
                      className="h-3 w-3 cursor-pointer opacity-70 hover:opacity-100"
                      onClick={() => {
                        if (onClearSport) {
                          onClearSport();
                        } else {
                          onClearFilters();
                        }
                      }}
                    />
                  </Badge>
                )}

                <Button
                  variant="link"
                  size="sm"
                  onClick={onClearFilters}
                  className="hover:text-accent/80 ml-auto h-auto p-0 text-xs text-accent"
                >
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SportsFilterBar;
