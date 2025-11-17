import {
  Play,
  Calendar,
  Star,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { backdropSizes } from "@/utils/api";
import { Episode, Season } from "@/utils/types";
import { format } from "date-fns";
import { getImageUrl } from "@/utils/services/tmdb";
import { useState, useEffect, useRef, useCallback } from "react";

interface TVShowEpisodesProps {
  seasons: Season[];
  episodes: Episode[];
  selectedSeason: number;
  onSeasonChange: (season: number) => void;
  onPlayEpisode: (seasonNumber: number, episodeNumber: number) => void;
  guestStars?: Record<number, any[]>;
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

  // Get filtered seasons (only numbered seasons > 0)
  const filteredSeasons = seasons.filter(season => season.season_number > 0);

  // Track if we're showing all seasons or need scrolling
  const showAllSeasons = filteredSeasons.length <= 7;

  // Get current season's episode count - memoize this value to prevent recalculations
  const currentSeason = seasons.find(s => s.season_number === selectedSeason);
  const currentSeasonEpisodeCount = currentSeason?.episode_count || 0;

  // Simulate watched progress - replace with your actual implementation later
  useEffect(() => {
    // This is mock data - in a real app, you would load this from your user's watch history
    const progress: Record<number, number> = {};

    // Only calculate watch progress if we have valid data to work with
    if (currentSeasonEpisodeCount > 0) {
      filteredSeasons.forEach(season => {
        if (season.season_number < selectedSeason) {
          // Assume previous seasons are 100% watched
          progress[season.season_number] = 100;
        } else if (season.season_number === selectedSeason) {
          // Progress for current season based on episodes
          const calculatedProgress = Math.floor(
            (episodes.length / currentSeasonEpisodeCount) * 100
          );
          progress[season.season_number] =
            calculatedProgress > 0 ? calculatedProgress : 0;
        } else {
          // Future seasons are 0% watched
          progress[season.season_number] = 0;
        }
      });

      // Compare with previous state to avoid unnecessary updates
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
    filteredSeasons,
    selectedSeason,
    episodes.length,
    currentSeasonEpisodeCount,
    watchProgress,
  ]);

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
      scrollContainer.addEventListener("scroll", handleScroll);
    }

    return () => {
      try {
        scrollContainer.removeEventListener("scrollend", handleScrollEnd);
      } catch (e) {
        // Ignore error if scrollend is not supported
      }
      scrollContainer.removeEventListener("scroll", handleScroll);
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
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-white">Seasons & Episodes</h2>
        <div className="rounded-full bg-white/5 px-4 py-1.5 text-sm text-white/90 border border-white/10 backdrop-blur-sm">
          {episodes.length} episodes
        </div>
      </div>

      <div className="relative mb-8 rounded-2xl border border-white/5 bg-black/40 p-5 shadow-xl backdrop-blur-sm transition-all duration-300 hover:shadow-2xl">
        <div className="mb-4 text-sm font-medium text-white/90">
          Select Season:
        </div>

        {/* Season selector - Horizontal layout */}
        <div className="relative">
          {/* Scroll buttons - only shown when seasons > 7 */}
          {!showAllSeasons && (
            <>
              <button
                onClick={() => scrollSeasons("left")}
                className="hover:bg-accent/80 absolute -left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white/80 shadow-lg transition-all duration-300 hover:text-white backdrop-blur-sm"
                aria-label="Previous seasons"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                onClick={() => scrollSeasons("right")}
                className="hover:bg-accent/80 absolute -right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white/80 shadow-lg transition-all duration-300 hover:text-white backdrop-blur-sm"
                aria-label="Next seasons"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Horizontal season list */}
          <div
            ref={seasonSelectorRef}
            className={`flex gap-4 ${showAllSeasons ? "flex-wrap justify-center" : "scrollbar-hide overflow-x-auto scroll-smooth pb-3 pt-1"} ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              scrollSnapType: showAllSeasons ? "none" : "x mandatory",
              WebkitOverflowScrolling: "touch",
              userSelect: "none",
            }}
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
                  key={season.id}
                  data-season={season.season_number}
                  onClick={() => onSeasonChange(season.season_number)}
                  className={`flex flex-shrink-0 flex-col items-center overflow-hidden rounded-xl shadow-lg transition-all duration-300 ${
                    isActive
                      ? "ring-accent/80 scale-105 transform bg-gradient-to-b from-accent/20 to-accent/10 ring-2"
                      : "bg-black/60 hover:scale-105 hover:bg-black/70"
                  } ${showAllSeasons ? "w-[130px]" : "w-[180px]"} backdrop-blur-sm`}
                  style={{
                    scrollSnapAlign: showAllSeasons ? "none" : "center",
                  }}
                  aria-pressed={isActive}
                >
                  <div className="w-full border-b border-white/10 bg-black/40 px-3 py-2 text-center">
                    <span className="text-sm font-medium text-white">
                      Season {season.season_number}
                    </span>
                  </div>

                  <div className="flex w-full flex-col items-center p-3">
                    <div
                      className={`relative mb-2 flex h-12 w-12 items-center justify-center rounded-full ${
                        isActive
                          ? "bg-gradient-to-br from-accent to-accent/80 ring-1 ring-white/20 shadow-lg"
                          : progress === 100
                            ? "bg-gradient-to-br from-green-500/80 to-green-600/80"
                            : progress > 0
                              ? "bg-gradient-to-br from-amber-500/80 to-amber-600/80"
                              : "border border-white/20 bg-black/50 shadow-sm"
                      }`}
                    >
                      {progress === 100 ? (
                        <Check className="h-5 w-5 text-white" />
                      ) : (
                        <span className="text-sm font-bold text-white">
                          {season.season_number}
                        </span>
                      )}

                      {/* Progress circle for in-progress seasons */}
                      {progress > 0 && progress < 100 && (
                        <svg
                          viewBox="0 0 36 36"
                          className="absolute inset-0 h-12 w-12 -rotate-90"
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
                      <span className="block text-xs text-white/70">
                        {season.episode_count || 0}{" "}
                        {season.episode_count === 1 ? "episode" : "episodes"}
                      </span>

                      {progress > 0 && progress < 100 && (
                        <span className="mt-1 inline-block rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/90 border border-white/10">
                          {progress}% watched
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
          <div className="mt-6 border-t border-white/10 pt-4 text-sm text-white/80">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-bold text-lg text-white">
                Season {selectedSeason}
              </span>
              {watchProgress[selectedSeason] > 0 && (
                <span className="bg-gradient-to-r from-accent to-accent/80 rounded-full px-3 py-1 text-xs text-white font-medium shadow-sm shadow-accent/20">
                  {watchProgress[selectedSeason]}% watched
                </span>
              )}
            </div>
            {
              // Display season air date or overview if available
              filteredSeasons.find(s => s.season_number === selectedSeason)
                ?.overview && (
                <p className="mt-3 text-white/70 leading-relaxed">
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

      <h3 className="mb-5 text-xl font-bold text-white">Episodes</h3>

      <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2">
        {episodes.length > 0 ? (
          episodes.map(episode => (
            <div
              key={episode.id}
              className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/5 bg-black/50 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:border-white/10"
            >
              <div className="relative">
                {episode.still_path ? (
                  <img
                    src={getImageUrl(episode.still_path, backdropSizes.small)}
                    alt={`${episode.name} still`}
                    className="h-48 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-48 w-full items-center justify-center bg-gradient-to-br from-purple-900/30 to-accent/30">
                    <span className="text-white/40 text-lg">No image</span>
                  </div>
                )}

                <div className="absolute right-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
                  Episode {episode.episode_number}
                </div>

                {episode.vote_average > 0 && (
                  <div className="absolute bottom-3 right-3 flex items-center rounded-full bg-black/70 px-2.5 py-1 text-xs text-amber-400 backdrop-blur-sm">
                    <Star className="mr-1 h-3 w-3 fill-amber-400" />
                    {episode.vote_average.toFixed(1)}
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col p-5">
                <div className="flex-1">
                  <h3 className="mb-2 text-xl font-bold text-white">
                    {episode.name}
                  </h3>

                  {episode.air_date && (
                    <div className="mb-3 flex items-center text-sm text-white/70">
                      <Calendar className="mr-2 h-4 w-4" />
                      {formatDate(episode.air_date)}
                    </div>
                  )}

                  <p className="mb-4 line-clamp-3 text-white/80 leading-relaxed">
                    {episode.overview || "No overview available."}
                  </p>

                  {guestStars && typeof guestStars === 'object' && guestStars && guestStars[episode.episode_number] && Array.isArray(guestStars[episode.episode_number]) && guestStars[episode.episode_number].length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-accent mb-1">Guest Stars:</h4>
                      <div className="flex flex-wrap gap-1">
                        {guestStars[episode.episode_number]
                          .slice(0, 3)
                          .map((star: any, idx: number) => (
                            <span
                              key={idx}
                              className="text-xs bg-white/10 rounded-full px-2 py-0.5 text-white/90"
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
                    onPlayEpisode(episode.season_number, episode.episode_number)
                  }
                  size="sm"
                  className="hover:bg-accent/90 flex w-full items-center justify-center bg-accent text-white shadow-lg shadow-accent/30 transition-all duration-300 hover:shadow-xl hover:shadow-accent/40 py-5"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Play Episode
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 rounded-2xl border border-white/5 bg-black/50 py-12 text-center text-white/80 shadow-xl backdrop-blur-sm">
            <p className="text-lg mb-4">No episodes available for Season {selectedSeason}.</p>
            {filteredSeasons.length > 0 &&
              selectedSeason !== filteredSeasons[0].season_number && (
                <Button
                  variant="outline"
                  onClick={() =>
                    onSeasonChange(filteredSeasons[0].season_number)
                  }
                  className="hover:bg-accent/10 hover:border-accent/20 mt-3 border-white/10 text-white/90 shadow-sm"
                >
                  View Season {filteredSeasons[0].season_number}
                </Button>
              )}
          </div>
        )}
      </div>
    </>
  );
};

export default TVShowEpisodes;
