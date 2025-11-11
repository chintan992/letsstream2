import { Button } from "@/components/ui/button";
import { SkipBack, SkipForward } from "lucide-react";
import { Episode } from "@/utils/types";
import { cn } from "@/lib/utils";

/**
 * Z-INDEX STRATEGY:
 * - No explicit z-index - relies on natural document flow
 * - Positioned within flex container in Player.tsx
 * - All internal elements use natural stacking
 */

interface EpisodeNavigationProps {
  episodes: Episode[];
  currentEpisodeIndex: number;
  onPreviousEpisode: () => void;
  onNextEpisode: () => void;
  isLastEpisodeOfSeason?: boolean;
  hasNextSeason?: boolean;
  nextSeasonNumber?: number | null;
  nextSeasonHasEpisodes?: boolean;
}

const EpisodeNavigation = ({
  episodes,
  currentEpisodeIndex,
  onPreviousEpisode,
  onNextEpisode,
  isLastEpisodeOfSeason = false,
  hasNextSeason = false,
  nextSeasonNumber = null,
  nextSeasonHasEpisodes = false,
}: EpisodeNavigationProps) => {
  if (episodes.length === 0) return null;

  const currentEpisode = episodes[currentEpisodeIndex];
  const isFinalEpisode =
    isLastEpisodeOfSeason && (!hasNextSeason || !nextSeasonHasEpisodes);
  const canGoToNextSeason = hasNextSeason && nextSeasonHasEpisodes;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-white">Episode Navigation</h3>
          <p className="text-sm text-white/60">
            Season {currentEpisode?.season_number} • Episode{" "}
            {currentEpisode?.episode_number} of {episodes.length}
          </p>
        </div>
      </div>

      <div className="glass rounded-lg border border-white/10 p-4 backdrop-blur-sm">
        <div className="flex flex-col space-y-3">
          {/* Current Episode Info */}
          <div className="space-y-1">
            <h4 className="font-medium text-white">
              {currentEpisode?.name ||
                "Episode " + currentEpisode?.episode_number}
            </h4>
            {currentEpisode?.overview && (
              <p className="line-clamp-2 text-sm text-white/70">
                {currentEpisode?.overview}
              </p>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:bg-white/10"
                onClick={onPreviousEpisode}
                disabled={currentEpisodeIndex === 0}
              >
                <SkipBack className="mr-2 h-4 w-4" />
                Previous
              </Button>

              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "border-white/10 backdrop-blur-sm transition-all duration-300",
                  isLastEpisodeOfSeason && canGoToNextSeason
                    ? "border-purple-400/30 bg-gradient-to-r from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30"
                    : "bg-white/5 hover:bg-white/10"
                )}
                onClick={onNextEpisode}
                disabled={isFinalEpisode}
              >
                {isLastEpisodeOfSeason && canGoToNextSeason
                  ? `Next Season${nextSeasonNumber ? ` ${nextSeasonNumber}` : ""}`
                  : isFinalEpisode
                    ? "Series Complete"
                    : "Next"}
                {isLastEpisodeOfSeason && canGoToNextSeason ? (
                  "→"
                ) : (
                  <SkipForward className="ml-2 h-4 w-4" />
                )}
              </Button>
            </div>

            {currentEpisode?.air_date && (
              <span className="text-sm text-white/40">
                Aired: {new Date(currentEpisode.air_date).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Transitional Messaging */}
          {isLastEpisodeOfSeason && (
            <div className="border-t border-white/10 pt-2">
              {canGoToNextSeason && nextSeasonNumber ? (
                <p className="flex items-center gap-1 text-sm text-purple-300/80">
                  <span>Next up:</span>
                  <span className="font-medium">
                    Season {nextSeasonNumber}, Episode 1
                  </span>
                </p>
              ) : hasNextSeason && !nextSeasonHasEpisodes ? (
                <p className="text-sm text-yellow-300/80">
                  Next season exists but episodes are not available yet
                </p>
              ) : (
                <p className="text-sm text-white/60">
                  You've reached the final episode
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EpisodeNavigation;
