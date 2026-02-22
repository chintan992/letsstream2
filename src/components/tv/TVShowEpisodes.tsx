import {
  Play,
  Calendar,
  Star,
  Check,
  ChevronLeft,
  ChevronRight,
  Tv,
  Grid3X3,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { backdropSizes } from "@/utils/api";
import { Episode, Season } from "@/utils/types";
import { format } from "date-fns";
import { getImageUrl } from "@/utils/services/tmdb";
import { useState, useEffect, useRef, useCallback } from "react";

interface GuestStar {
  id: number;
  name: string;
}

interface TVShowEpisodesProps {
  seasons: Season[];
  episodes: Episode[];
  selectedSeason: number;
  onSeasonChange: (season: number) => void;
  onPlayEpisode: (seasonNumber: number, episodeNumber: number) => void;
  guestStars?: Record<number, GuestStar[]>;
}

// A throttle function to prevent too many scroll events
type ThrottleableFunction = (...args: unknown[]) => unknown;

const throttle = <T extends ThrottleableFunction>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => ReturnType<T> | undefined) => {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = new Date().getTime();
    if (now - lastCall < delay) {
      return undefined;
    }
    lastCall = now;
    return func(...args) as ReturnType<T>;
  };
};

export const TVShowEpisodes = ({
  seasons,
  episodes,
  selectedSeason,
  onSeasonChange,
  onPlayEpisode,
  guestStars,
}: TVShowEpisodesProps) => {
  // Track watched episodes progress
  const [watchProgress, setWatchProgress] = useState<Record<number, number>>(
    {}
  );
  // For scrollable season selector
  const seasonSelectorRef = useRef<HTMLDivElement>(null);
  // For tracking touch/drag events
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Load view mode preference from localStorage on mount and initialize state
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    if (typeof window !== "undefined") {
      const savedViewMode = localStorage.getItem("tv-episode-view-mode");
      if (savedViewMode === "grid" || savedViewMode === "list") {
        return savedViewMode;
      }
    }
    return "grid"; // default value
  });

  // Save view mode preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("tv-episode-view-mode", viewMode);
  }, [viewMode]);

  // Get filtered seasons (only numbered seasons > 0)
  const filteredSeasons = seasons.filter(season => season.season_number > 0);

  // Track if we're showing all seasons or need scrolling
  const showAllSeasons = filteredSeasons.length <= 7;

  // Get current season's episode count - memoize this value to prevent recalculations
  const currentSeason = seasons.find(s => s.season_number === selectedSeason);
  const currentSeasonEpisodeCount = currentSeason?.episode_count || 0;

  const updateWatchProgress = useCallback(() => {
    const progress: Record<number, number> = {};

    if (currentSeasonEpisodeCount > 0) {
      filteredSeasons.forEach(season => {
        if (season.season_number < selectedSeason) {
          progress[season.season_number] = 100;
        } else if (season.season_number === selectedSeason) {
          const calculatedProgress = Math.floor(
            (episodes.length / currentSeasonEpisodeCount) * 100
          );
          progress[season.season_number] =
            calculatedProgress > 0 ? calculatedProgress : 0;
        } else {
          progress[season.season_number] = 0;
        }
      });

      let shouldUpdate = false;
      for (const season of filteredSeasons) {
        if (
          watchProgress[season.season_number] !== progress[season.season_number]
        ) {
          shouldUpdate = true;
          break;
        }
      }

      if (shouldUpdate) {
        setWatchProgress(progress);
      }
    }
  }, [
    currentSeasonEpisodeCount,
    episodes.length,
    filteredSeasons,
    selectedSeason,
    watchProgress,
  ]);

  // Simulate watched progress - replace with your actual implementation later
  useEffect(() => {
    updateWatchProgress();
  }, [updateWatchProgress]);

  // Handle scrolling for the season selector
  const scrollSeasons = (direction: "left" | "right") => {
    if (!seasonSelectorRef.current) return;

    const container = seasonSelectorRef.current;
    const cardWidth = 180; // Width of each season card
    const cardMargin = 12; // Approximate margin between cards (gap-3 = 12px)
    const containerWidth = container.clientWidth;

    // Calculate how many cards are visible at once (typically 2-3 on medium screens)
    const visibleCards = Math.floor(containerWidth / (cardWidth + cardMargin));

    // Find the current scroll position
    const currentScroll = container.scrollLeft;

    // Calculate the target scroll position based on card width and direction
    let targetScroll;
    if (direction === "left") {
      // Scroll back one card (or a page width if visibleCards > 1)
      targetScroll =
        currentScroll -
        (visibleCards > 1 ? containerWidth : cardWidth + cardMargin);
    } else {
      // Scroll forward one card (or a page width if visibleCards > 1)
      targetScroll =
        currentScroll +
        (visibleCards > 1 ? containerWidth : cardWidth + cardMargin);
    }

    // Scroll to the target position
    container.scrollTo({ left: targetScroll, behavior: "smooth" });
  };

  // Scroll selected season into view when it changes
  useEffect(() => {
    if (showAllSeasons || !seasonSelectorRef.current) return;

    // Find the button for the selected season
    const selectedButton = seasonSelectorRef.current.querySelector(
      `[data-season="${selectedSeason}"]`
    );
    if (selectedButton) {
      // Use the scrollIntoView API for smooth centering
      selectedButton.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [selectedSeason, showAllSeasons]);

  // Touch/Mouse event handlers for smooth drag scrolling
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (showAllSeasons || !seasonSelectorRef.current) return;

      setIsDragging(true);
      setStartX(e.pageX - seasonSelectorRef.current.offsetLeft);
      setScrollLeft(seasonSelectorRef.current.scrollLeft);
    },
    [showAllSeasons]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !seasonSelectorRef.current) return;

      e.preventDefault();
      const x = e.pageX - seasonSelectorRef.current.offsetLeft;
      const walk = (x - startX) * 2; // Scroll-speed multiplier
      seasonSelectorRef.current.scrollLeft = scrollLeft - walk;
    },
    [isDragging, startX, scrollLeft]
  );

  // Touch event handlers
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (showAllSeasons || !seasonSelectorRef.current) return;

      setIsDragging(true);
      setStartX(e.touches[0].clientX - seasonSelectorRef.current.offsetLeft);
      setScrollLeft(seasonSelectorRef.current.scrollLeft);
    },
    [showAllSeasons]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging || !seasonSelectorRef.current) return;

      const x = e.touches[0].clientX - seasonSelectorRef.current.offsetLeft;
      const walk = (x - startX) * 2;
      seasonSelectorRef.current.scrollLeft = scrollLeft - walk;
    },
    [isDragging, startX, scrollLeft]
  );

  // Register scroll snap after scrolling stops
  useEffect(() => {
    if (showAllSeasons || !seasonSelectorRef.current) return;

    const scrollContainer = seasonSelectorRef.current;
    let scrollTimeout: ReturnType<typeof setTimeout> | undefined;

    const handleScrollEnd = throttle(() => {
      // Find the nearest snap point
      const scrollLeft = scrollContainer.scrollLeft;
      const cardWidth = 180 + 12; // Card width + gap
      const cardIndex = Math.round(scrollLeft / cardWidth);
      const targetScroll = cardIndex * cardWidth;

      // Only snap if we're not too far from the target
      if (Math.abs(scrollLeft - targetScroll) < cardWidth / 3) {
        scrollContainer.scrollTo({ left: targetScroll, behavior: "smooth" });
      }
    }, 150);

    // Use scroll event with timeout for better browser compatibility
    const handleScroll = () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      scrollTimeout = setTimeout(handleScrollEnd, 150);
    };

    // Try to use scrollend if supported, fallback to scroll + timeout
    try {
      scrollContainer.addEventListener("scrollend", handleScrollEnd);
    } catch (e) {
      // scrollend not supported, use scroll with timeout instead
      scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    }

    return () => {
      try {
        scrollContainer.removeEventListener("scrollend", handleScrollEnd);
      } catch (e) {
        // Ignore error if scrollend is not supported
      }
      scrollContainer.removeEventListener("scroll", handleScroll, { passive: true });
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [showAllSeasons]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "TBA";
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (error) {
      return "Invalid date";
    }
  };

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2
          className="text-2xl font-bold text-white"
          id="seasons-episodes-header"
        >
          Seasons & Episodes
        </h2>
        <div
          className="from-accent/10 to-accent/5 rounded-full border border-white/10 bg-gradient-to-r px-4 py-1.5 text-sm text-white/90 shadow-sm backdrop-blur-sm"
          aria-label={`Currently showing ${episodes?.length || 0} episodes`}
        >
          <span className="flex items-center">
            <Tv className="mr-2 h-4 w-4 text-accent" aria-hidden="true" />
            {episodes?.length} episodes
          </span>
        </div>
      </div>

      <div
        className="relative mb-6 rounded-2xl border border-white/10 bg-gradient-to-br from-black/60 to-black/40 p-4 shadow-xl backdrop-blur-sm transition-all duration-300 hover:shadow-2xl"
        role="region"
        aria-labelledby="select-season-label"
      >
        <div
          className="mb-3 text-xs font-medium text-white/90"
          id="select-season-label"
        >
          Select Season:
        </div>

        {/* Season selector - Horizontal layout */}
        <div className="relative">
          {/* Scroll buttons - only shown when seasons > 7 */}
          {!showAllSeasons && (
            <>
              <button
                onClick={() => scrollSeasons("left")}
                className="hover:bg-accent/80 absolute -left-3 top-1/2 z-10 min-h-[40px] min-w-[40px] -translate-y-1/2 touch-manipulation rounded-full bg-black/80 p-2 text-white/80 shadow-lg backdrop-blur-sm transition-all duration-300 hover:text-white"
                aria-label="Previous seasons"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <button
                onClick={() => scrollSeasons("right")}
                className="hover:bg-accent/80 absolute -right-3 top-1/2 z-10 min-h-[40px] min-w-[40px] -translate-y-1/2 touch-manipulation rounded-full bg-black/80 p-2 text-white/80 shadow-lg backdrop-blur-sm transition-all duration-300 hover:text-white"
                aria-label="Next seasons"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}

          {/* Horizontal season list */}
          <div
            ref={seasonSelectorRef}
            className={`flex gap-3 ${showAllSeasons ? "flex-wrap justify-center" : "scrollbar-hide overflow-x-auto scroll-smooth pb-3 pt-2"} ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              scrollSnapType: showAllSeasons ? "none" : "x mandatory",
              WebkitOverflowScrolling: "touch",
              userSelect: "none",
            }}
            role="tablist"
            aria-label="Season selector"
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onMouseMove={handleMouseMove}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleMouseUp}
            onTouchMove={handleTouchMove}
          >
            {filteredSeasons.map(season => {
              const progress = watchProgress[season.season_number] || 0;
              const isActive = selectedSeason === season.season_number;

              return (
                <button
                  role="tab"
                  key={season.id}
                  data-season={season.season_number}
                  onClick={() => onSeasonChange(season.season_number)}
                  className={`flex flex-shrink-0 flex-col items-center overflow-hidden rounded-xl shadow-md transition-all duration-300 ${
                    isActive
                      ? "ring-accent/80 from-accent/20 to-accent/10 shadow-accent/20 scale-105 transform bg-gradient-to-b ring-2"
                      : "bg-gradient-to-b from-white/5 to-white/10 hover:scale-105 hover:from-white/10 hover:to-white/20 hover:shadow-lg"
                  } ${showAllSeasons ? "w-[100px] md:w-[110px]" : "w-[110px] md:w-[120px]"} touch-manipulation border border-white/10 backdrop-blur-sm`}
                  style={{
                    scrollSnapAlign: showAllSeasons ? "none" : "center",
                  }}
                  aria-selected={isActive}
                >
                  <div
                    className={`w-full border-b ${isActive ? "border-accent/30 from-accent/10 to-accent/5 bg-gradient-to-r" : "border-white/10 bg-gradient-to-r from-white/5 to-white/10"} px-2 py-2 text-center transition-colors duration-300`}
                  >
                    <span
                      className={`text-xs font-bold ${isActive ? "text-accent" : "text-white"} transition-colors duration-300`}
                      aria-hidden="true"
                    >
                      S{season.season_number}
                    </span>
                    <span className="sr-only">
                      {isActive ? `Selected: ` : ``}Season{" "}
                      {season.season_number}, {season.episode_count || 0}{" "}
                      {season.episode_count === 1 ? "episode" : "episodes"},{" "}
                      {progress === 100
                        ? "completed"
                        : progress > 0
                          ? `${progress}% watched`
                          : "not watched"}
                    </span>
                  </div>

                  <div className="flex w-full flex-col items-center p-2">
                    <div
                      className={`relative mb-2 flex h-10 w-10 items-center justify-center rounded-full ${
                        isActive
                          ? "to-accent/80 ring-accent/50 shadow-accent/30 bg-gradient-to-br from-accent shadow-md ring-2"
                          : progress === 100
                            ? "bg-gradient-to-br from-green-500/80 to-green-600/80 shadow-md shadow-green-500/30"
                            : progress > 0
                              ? "bg-gradient-to-br from-amber-500/80 to-amber-600/80 shadow-md shadow-amber-500/30"
                              : "border border-dashed border-white/30 bg-black/50 shadow-sm"
                      }`}
                    >
                      {progress === 100 ? (
                        <Check className="h-4 w-4 text-white" />
                      ) : (
                        <span
                          className={`text-sm font-bold ${isActive || progress > 0 ? "text-white" : "text-white/50"}`}
                        >
                          {season.season_number}
                        </span>
                      )}

                      {/* Progress circle for in-progress seasons */}
                      {progress > 0 && progress < 100 && (
                        <svg
                          viewBox="0 0 36 36"
                          className="absolute inset-0 h-10 w-10 -rotate-90"
                        >
                          <circle
                            cx="18"
                            cy="18"
                            r="16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeDasharray={`${progress}, 100`}
                            className="text-white/50"
                          />
                        </svg>
                      )}
                    </div>

                    <div className="text-center">
                      <span className="block text-xs font-medium text-white">
                        {season.episode_count || 0}
                      </span>

                      {progress > 0 && progress < 100 && (
                        <span className="bg-accent/20 border-accent/30 mt-0.5 inline-block rounded-full border px-1.5 py-0.5 text-[0.6rem] font-medium text-accent">
                          {progress}%
                        </span>
                      )}

                      {progress === 100 && (
                        <span className="mt-0.5 inline-block rounded-full border border-green-500/30 bg-green-500/20 px-1.5 py-0.5 text-[0.6rem] font-medium text-green-400">
                          C
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Season information */}
        {filteredSeasons.length > 0 && (
          <div className="mt-4 border-t border-white/10 pt-3 text-xs text-white/80">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-bold text-white">
                Season {selectedSeason}
              </span>
              {watchProgress[selectedSeason] > 0 &&
                watchProgress[selectedSeason] < 100 && (
                  <span className="to-accent/80 shadow-accent/20 rounded-full bg-gradient-to-r from-accent px-2.5 py-1 text-xs font-medium text-white shadow-sm">
                    {watchProgress[selectedSeason]}% watched
                  </span>
                )}
              {watchProgress[selectedSeason] === 100 && (
                <span className="rounded-full bg-gradient-to-r from-green-500 to-green-600 px-2.5 py-1 text-xs font-medium text-white shadow-sm shadow-green-500/20">
                  Completed
                </span>
              )}
            </div>
            {
              // Display season air date or overview if available
              filteredSeasons.find(s => s.season_number === selectedSeason)
                ?.overview && (
                <p className="mt-2 text-sm leading-relaxed text-white/70">
                  {
                    filteredSeasons.find(
                      s => s.season_number === selectedSeason
                    )?.overview
                  }
                </p>
              )
            }
          </div>
        )}
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-2xl font-bold text-white">Episodes</h3>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="flex items-center gap-2"
            aria-label="Grid view"
          >
            <Grid3X3 className="h-4 w-4" />
            <span className="hidden sm:inline">Grid</span>
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="flex items-center gap-2"
            aria-label="List view"
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">List</span>
          </Button>
        </div>
      </div>

      <div
        className={`mb-6 grid ${viewMode === "grid" ? "grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1 gap-4"}`}
      >
        {episodes ? (
          episodes.length > 0 ? (
            episodes.map(episode => (
              <div
                key={episode.id}
                className={`flex ${viewMode === "grid" ? "h-full flex-col" : "flex-row"} hover:ring-accent/20 touch-manipulation overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-white/10 shadow-xl backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:shadow-2xl hover:ring-1`}
                role="article"
                aria-labelledby={`episode-${episode.id}-title`}
              >
                <div
                  className={`relative ${viewMode === "grid" ? "h-48" : "h-20 min-w-[120px]"}`}
                >
                  {episode.still_path ? (
                    <img
                      src={getImageUrl(episode.still_path, backdropSizes.small)}
                      alt={`${episode.name} still`}
                      className={`h-full w-full object-cover ${viewMode === "list" ? "rounded-l-2xl rounded-r-none" : ""}`}
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${viewMode === "grid" ? "from-purple-900/20" : "from-purple-800/20"} to-accent/20 ${viewMode === "list" ? "rounded-l-2xl rounded-r-none" : ""}`}
                    >
                      <div className="flex flex-col items-center">
                        <Tv className="h-6 w-6 text-white/40" />
                      </div>
                    </div>
                  )}

                  <div
                    className={`absolute left-2 top-2 rounded-full border border-white/20 bg-black/80 px-2 py-1 text-xs font-bold text-white shadow-md backdrop-blur-sm ${viewMode === "list" ? "px-1 py-0.5 text-[10px]" : ""}`}
                  >
                    <span className="flex items-center">
                      <Play className="mr-1 h-3 w-3" />
                      Ep {episode.episode_number}
                    </span>
                  </div>

                  {episode.vote_average > 0 && (
                    <div
                      className={`absolute bottom-2 right-2 flex items-center rounded-full border border-white/20 bg-black/80 px-2 py-1 text-xs text-amber-400 shadow-md backdrop-blur-sm ${viewMode === "list" ? "hidden" : ""}`}
                    >
                      <Star className="mr-1 h-3 w-3 fill-amber-400" />
                      {episode.vote_average.toFixed(1)}
                    </div>
                  )}
                </div>

                <div
                  className={`${viewMode === "list" ? "flex flex-1 items-center p-3" : "flex flex-1 flex-col p-6"}`}
                >
                  <div
                    className={`${viewMode === "list" ? "flex-1" : "flex-1"}`}
                  >
                    <div
                      className={`${viewMode === "list" ? "mb-1 flex items-center text-xs text-white/70" : "mb-2 flex items-center text-sm text-white/70"}`}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {formatDate(episode.air_date)}
                    </div>

                    <h3
                      className={`font-bold text-white ${viewMode === "list" ? "text-base" : "text-xl"}`}
                      id={`episode-${episode.id}-title`}
                    >
                      {episode.name}
                    </h3>

                    {viewMode === "grid" && (
                      <p
                        className={`mt-2 line-clamp-3 text-sm leading-relaxed text-white/90`}
                      >
                        {episode.overview || "No overview available."}
                      </p>
                    )}

                    {viewMode === "grid" &&
                      guestStars &&
                      typeof guestStars === "object" &&
                      guestStars &&
                      guestStars[episode.episode_number] &&
                      Array.isArray(guestStars[episode.episode_number]) &&
                      guestStars[episode.episode_number].length > 0 && (
                        <div className="mt-3">
                          <h4 className="mb-2 flex items-center text-sm font-medium text-accent">
                            <Star className="mr-2 h-4 w-4" />
                            Guest Stars
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {guestStars[episode.episode_number]
                              .slice(0, 4)
                              .map((star: any, idx: number) => (
                                <span
                                  key={idx}
                                  className="from-accent/10 to-accent/5 hover:from-accent/20 hover:to-accent/10 hover:border-accent/30 flex items-center rounded-full border border-white/10 bg-gradient-to-r px-3 py-1 text-xs text-white/90 transition-all duration-300"
                                >
                                  {star.name}
                                </span>
                              ))}
                          </div>
                        </div>
                      )}
                  </div>

                  <Button
                    onClick={() =>
                      onPlayEpisode(
                        episode.season_number,
                        episode.episode_number
                      )
                    }
                    size="sm"
                    className={`${viewMode === "list" ? "h-8 w-auto px-3 text-sm" : "w-full"} hover:from-accent/90 hover:to-accent/70 to-accent/80 shadow-accent/30 hover:shadow-accent/40 flex min-h-[32px] items-center justify-center bg-gradient-to-r from-accent font-bold text-white shadow-lg transition-all duration-300 hover:bg-gradient-to-r hover:shadow-xl`}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Play
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900/50 to-gray-800/50 py-16 text-center text-white/80 shadow-2xl backdrop-blur-sm">
              <div className="flex flex-col items-center justify-center">
                <Tv className="mb-4 h-16 w-16 text-white/40" />
                <p className="mb-2 text-xl">No episodes available</p>
                <p className="mb-6 text-white/60">
                  Season {selectedSeason} doesn't have any episodes yet.
                </p>
                {filteredSeasons.length > 0 &&
                  selectedSeason !== filteredSeasons[0].season_number && (
                    <Button
                      variant="outline"
                      onClick={() =>
                        onSeasonChange(filteredSeasons[0].season_number)
                      }
                      className="hover:from-accent/10 hover:to-accent/5 hover:border-accent/30 mt-3 border-white/20 font-medium text-white/90 shadow-sm hover:bg-gradient-to-r"
                    >
                      View Season {filteredSeasons[0].season_number}
                    </Button>
                  )}
              </div>
            </div>
          )
        ) : (
          // Skeleton loader for episodes
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`skeleton-${index}`}
              className={`flex ${viewMode === "grid" ? "h-full flex-col" : "flex-row"} overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-white/10 shadow-xl backdrop-blur-sm`}
              aria-hidden="true"
            >
              <div
                className={`relative ${viewMode === "grid" ? "h-48" : "h-20 min-w-[120px]"}`}
              >
                <Skeleton className="h-full w-full" />
                <div
                  className={`absolute left-2 top-2 ${viewMode === "list" ? "px-1 py-0.5 text-[10px]" : ""}`}
                >
                  <Skeleton className="h-4 w-12 rounded-full" />
                </div>
              </div>

              <div
                className={`${viewMode === "list" ? "flex flex-1 items-center p-3" : "flex flex-1 flex-col p-6"}`}
              >
                <div className="flex-1">
                  <div className={`${viewMode === "list" ? "mb-1" : "mb-3"}`}>
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <Skeleton
                    className={`w-full ${viewMode === "list" ? "h-4" : "h-5"} mb-2`}
                  />
                  {viewMode === "grid" && (
                    <Skeleton className="mb-2 h-4 w-3/4" />
                  )}
                  {viewMode === "grid" && <Skeleton className="h-4 w-1/2" />}
                </div>

                <Skeleton
                  className={`${viewMode === "list" ? "h-8 w-16" : "h-10 w-full"} rounded-lg`}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
};
