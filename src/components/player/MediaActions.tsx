import { Button } from "@/components/ui/button";
import { Heart, Bookmark, ArrowLeft, Star, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { m } from "framer-motion";

/**
 * Z-INDEX STRATEGY:
 * - z-40: Sticky header below navbar (z-50)
 * - Positioned at top of watch page content area
 * - Buttons and icons use natural stacking
 */

interface MediaActionsProps {
  isFavorite: boolean;
  isInWatchlist: boolean;
  onToggleFavorite: () => void;
  onToggleWatchlist: () => void;
  onBack: () => void;
  onViewDetails: () => void;
  // New props for title display
  title?: string;
  subtitle?: string;
  year?: string | number;
  rating?: number;
  mediaType?: "movie" | "tv";
}

const MediaActions = ({
  isFavorite,
  isInWatchlist,
  onToggleFavorite,
  onToggleWatchlist,
  onBack,
  onViewDetails,
  title,
  subtitle,
  year,
  rating,
  mediaType,
}: MediaActionsProps) => {
  return (
    <m.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-16 z-40 -mx-4 mb-4 border-b border-white/5 bg-background/80 px-4 py-3 backdrop-blur-md md:-mx-6 md:px-6"
    >
      <div className="flex items-center gap-4">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          className="text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          onClick={onBack}
          aria-label="Go back"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>

        {/* Title Section */}
        {title && (
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold text-white md:text-lg">
              {title}
            </h1>
            <div className="flex items-center gap-3 text-xs text-white/60 md:text-sm">
              {subtitle && (
                <span className="truncate">{subtitle}</span>
              )}
              {year && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {year}
                </span>
              )}
              {rating && rating > 0 && (
                <span className="flex items-center gap-1 text-yellow-400">
                  <Star className="h-3 w-3 fill-current" />
                  {rating.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Spacer if no title */}
        {!title && <div className="flex-1" />}

        {/* Action Buttons */}
        <m.div
          className="flex items-center gap-1 md:gap-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-9 w-9 rounded-full transition-all duration-300 hover:bg-white/10",
              isFavorite
                ? "text-red-400 hover:text-red-300"
                : "text-white/70 hover:text-white"
            )}
            onClick={onToggleFavorite}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            aria-pressed={isFavorite}
          >
            <Heart className={cn("h-5 w-5", isFavorite && "fill-current")} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-9 w-9 rounded-full transition-all duration-300 hover:bg-white/10",
              isInWatchlist
                ? "text-blue-400 hover:text-blue-300"
                : "text-white/70 hover:text-white"
            )}
            onClick={onToggleWatchlist}
            aria-label={isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
            aria-pressed={isInWatchlist}
          >
            <Bookmark
              className={cn("h-5 w-5", isInWatchlist && "fill-current")}
            />
          </Button>
        </m.div>
      </div>
    </m.div>
  );
};

export default MediaActions;
