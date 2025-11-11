import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Calendar, Star, Check, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Episode } from "@/utils/types";
import { getImageUrl } from "@/utils/services/tmdb";
import { backdropSizes } from "@/utils/api";

/**
 * Z-INDEX STRATEGY:
 * - Episode number badges: z-20 (always visible on thumbnails)
 * - Episode overlays (play indicator, watched): z-10 (base overlay layer)
 * - Container: no explicit z-index (natural flow within parent)
 */

interface EpisodeSidebarProps {
  episodes: Episode[];
  currentEpisodeIndex: number;
  showId: number | string;
  season: number | string;
}

export const EpisodeSidebar: React.FC<EpisodeSidebarProps> = ({
  episodes,
  currentEpisodeIndex,
  showId,
  season,
}) => {
  const navigate = useNavigate();
  const episodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter episodes based on search query
  const filteredEpisodes = useMemo(() => {
    if (!searchQuery.trim()) {
      return episodes;
    }

    const query = searchQuery.toLowerCase().trim();
    return episodes.filter(
      episode =>
        (episode.name || "").toLowerCase().includes(query) ||
        (episode.overview && episode.overview.toLowerCase().includes(query))
    );
  }, [episodes, searchQuery]);

  const handleKeyDown = (event: React.KeyboardEvent, episodeNumber: number) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleEpisodeClick(episodeNumber);
    }
  };

  const handleEpisodeClick = (episodeNumber: number) => {
    navigate(`/watch/tv/${showId}/${season}/${episodeNumber}`);
  };

  const currentEpisode = episodes[currentEpisodeIndex];

  // Compute current episode number once for optimization
  const currentEpisodeNumber = currentEpisode?.episode_number ?? -1;

  // Auto-scroll to current episode (guard against scrolling during search)
  useEffect(() => {
    if (currentEpisode && searchQuery === "") {
      const currentEpisodeInFiltered = filteredEpisodes.findIndex(
        ep => ep.episode_number === currentEpisode.episode_number
      );
      if (
        currentEpisodeInFiltered >= 0 &&
        episodeRefs.current[currentEpisodeInFiltered]
      ) {
        episodeRefs.current[currentEpisodeInFiltered]?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }, [currentEpisode, filteredEpisodes, searchQuery]);

  return (
    <div className="z-10 flex h-full w-full flex-col border border-white/10 bg-black/95">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Episodes</h2>
          <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/60">
            {filteredEpisodes.length}
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex-shrink-0 px-4 pb-3">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search episodes..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchQuery(e.target.value)
            }
            className="border-white/10 bg-white/5 pl-9 pr-9 text-white placeholder:text-white/40 focus-visible:ring-accent"
          />
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-white/40" />
          {searchQuery.length > 0 && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 transform cursor-pointer text-white/60 hover:text-white/80"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Episode List */}
      <ScrollArea className="min-h-0 flex-1" scrollBarVariant="accent">
        <div className="space-y-4 p-4">
          {filteredEpisodes.length === 0 && searchQuery.length > 0 ? (
            <div className="px-4 py-12 text-center">
              <Search className="mx-auto mb-3 h-12 w-12 text-white/20" />
              <h3 className="mb-1 font-medium text-white/60">
                No episodes found
              </h3>
              <p className="text-sm text-white/40">
                Try adjusting your search terms
              </p>
            </div>
          ) : (
            filteredEpisodes.map((episode, idx) => {
              const isCurrentEpisode =
                episode.episode_number === currentEpisodeNumber;
              const hasWatched =
                currentEpisodeNumber >= 0 &&
                episode.episode_number < currentEpisodeNumber;

              return (
                <div
                  key={episode.id}
                  ref={el => {
                    episodeRefs.current[idx] = el;
                  }}
                  className={cn(
                    "relative cursor-pointer overflow-hidden rounded-lg transition-all duration-300 hover:bg-white/5",
                    isCurrentEpisode && "bg-accent/10 ring-2 ring-accent",
                    !isCurrentEpisode && "bg-white/5"
                  )}
                  onClick={() => handleEpisodeClick(episode.episode_number)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => handleKeyDown(e, episode.episode_number)}
                >
                  <div className="flex gap-3 p-3">
                    {/* Thumbnail */}
                    <div className="relative h-[68px] w-[120px] flex-shrink-0 overflow-hidden rounded bg-white/10">
                      {episode.still_path ? (
                        <img
                          src={getImageUrl(
                            episode.still_path,
                            backdropSizes.small
                          )}
                          alt={episode.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Play className="h-6 w-6 text-white/40" />
                        </div>
                      )}

                      {/* Episode Number Badge */}
                      {/* z-20: Episode number badge - appears above thumbnail but below overlays */}
                      <div className="absolute bottom-1 left-1 z-20 rounded bg-black/80 px-2 py-0.5 text-xs font-semibold text-white">
                        EP {episode.episode_number}
                      </div>

                      {/* Current Episode Indicator */}
                      {/* z-10: Current episode play indicator - base layer for thumbnail overlays */}
                      {isCurrentEpisode && (
                        <div className="bg-accent/20 absolute inset-0 z-10 flex items-center justify-center">
                          <Play className="h-4 w-4 text-white" />
                        </div>
                      )}

                      {/* Watched Indicator */}
                      {hasWatched && !isCurrentEpisode && (
                        <div className="absolute left-1 top-1 rounded-full bg-green-600 p-0.5">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Episode Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="truncate text-sm font-semibold text-white">
                          {episode.name}
                        </h3>
                      </div>

                      {/* Episode Description */}
                      <div className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/60">
                        {episode.overview}
                      </div>

                      <div className="mt-2 flex items-center gap-3 text-xs text-white/60">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {episode.air_date
                              ? new Date(episode.air_date).toLocaleDateString()
                              : "TBA"}
                          </span>
                        </div>

                        {episode.vote_average > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-current" />
                            <span>{episode.vote_average.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default EpisodeSidebar;
