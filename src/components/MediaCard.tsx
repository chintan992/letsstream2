import React, { useState, useRef } from "react";
import { useWatchHistory } from "@/hooks/watch-history";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  triggerHapticFeedback,
  triggerSuccessHaptic,
} from "@/utils/haptic-feedback";
import { Media } from "@/utils/types";
import { posterSizes } from "@/utils/api";
import { getImageUrl } from "@/utils/services/tmdb";
import { Star, Info, Heart, Play } from "lucide-react";
import { motion } from "framer-motion";
import { trackMediaPreference, trackMediaView } from "@/lib/analytics";
import { useWillChange } from "@/hooks/useWillChange";

interface MediaCardProps {
  media: Media;
  className?: string;
  featured?: boolean;
  minimal?: boolean;
}

/**
 * MediaCard component displays a media item (movie or TV show) with poster, title, rating, and actions.
 * @param {MediaCardProps} props
 */
const MediaCard = React.memo(
  ({ media, className, featured = false, minimal = false }: MediaCardProps) => {
    const [imageError, setImageError] = useState(false);
    const [imgLoading, setImgLoading] = useState(true);
    const {
      addToFavorites,
      removeFromFavorites,
      isInFavorites,
      addToWatchlist,
      removeFromWatchlist,
      isInWatchlist,
    } = useWatchHistory();
    const [isFavorite, setIsFavorite] = useState(false);
    const [isInMyWatchlist, setIsInMyWatchlist] = useState(false);
    const navigate = useNavigate();

    const mediaId = media.media_id || media.id;
    const detailPath = `/${media.media_type}/${mediaId}`;

    const handleImageError = () => {
      setImageError(true);
      setImgLoading(false);
    };

    const handleImageLoad = () => {
      setImgLoading(false);
    };

    React.useEffect(() => {
      setIsFavorite(isInFavorites(mediaId, media.media_type));
      setIsInMyWatchlist(isInWatchlist(mediaId, media.media_type));
    }, [mediaId, media.media_type, isInFavorites, isInWatchlist]);

    const handleClick = async () => {
      // Provide haptic feedback when a card is selected
      triggerHapticFeedback(25);

      // Track the media selection
      await Promise.all([
        trackMediaPreference(media.media_type, "select"),
        trackMediaView({
          mediaType: media.media_type as "movie" | "tv",
          mediaId: mediaId.toString(),
          title: media.title || media.name || "",
        }),
      ]);
    };

    const handleFavoriteClick = async (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      const previousState = isFavorite;
      // Optimistic update
      setIsFavorite(!previousState);

      try {
        // Different haptic feedback based on action (add/remove from favorites)
        if (previousState) {
          triggerHapticFeedback(20);
          await removeFromFavorites(mediaId, media.media_type);
        } else {
          // Special pattern for adding to favorites
          triggerSuccessHaptic();
          await addToFavorites({
            media_id: mediaId,
            media_type: media.media_type,
            title: media.title || media.name || "",
            poster_path: media.poster_path,
            backdrop_path: media.backdrop_path,
            overview: media.overview,
            rating: media.vote_average,
          });
        }
        await trackMediaPreference(
          media.media_type as "movie" | "tv",
          "favorite"
        );
      } catch (error) {
        console.error("Failed to update favorites:", error);
        setIsFavorite(previousState); // Revert on error
      }
    };

    const handleWatchlistClick = async (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      const previousState = isInMyWatchlist;
      // Optimistic update
      setIsInMyWatchlist(!previousState);

      try {
        // Different haptic feedback based on action (add/remove from watchlist)
        if (previousState) {
          triggerHapticFeedback(20);
          await removeFromWatchlist(mediaId, media.media_type);
        } else {
          // Success pattern for adding to watchlist
          triggerSuccessHaptic();
          await addToWatchlist({
            media_id: mediaId,
            media_type: media.media_type,
            title: media.title || media.name || "",
            poster_path: media.poster_path,
            backdrop_path: media.backdrop_path,
            overview: media.overview,
            rating: media.vote_average,
          });
        }
      } catch (error) {
        console.error("Failed to update watchlist:", error);
        setIsInMyWatchlist(previousState); // Revert on error
      }
    };

    if (minimal) {
      return (
        <div className={cn("block h-full", className)}>
          <Link
            to={detailPath}
            className="block h-full"
            aria-label={`View details for ${media.title || media.name}`}
            onClick={handleClick}
          >
            <div className="relative h-full overflow-hidden rounded-md shadow-md">
              {imgLoading && (
                <div
                  className="absolute inset-0 animate-pulse bg-gray-800"
                  aria-hidden="true"
                />
              )}
              <img
                src={
                  imageError
                    ? "/placeholder.svg"
                    : getImageUrl(media.poster_path, posterSizes.medium) ||
                    "/placeholder.svg"
                }
                alt={media.title || media.name || "Media Poster"}
                className={cn(
                  "h-full w-full object-cover",
                  imgLoading ? "opacity-0" : "opacity-100"
                )}
                loading="lazy"
                onError={handleImageError}
                onLoad={handleImageLoad}
              />
            </div>
          </Link>
        </div>
      );
    }

    return (
      <motion.div
        className={cn(
          "group/card relative block transform transition-all duration-300 hover:-translate-y-2",
          className
        )}
      >
        <Link
          to={detailPath}
          className="block h-full w-full focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
          onClick={handleClick}
          aria-label={`View details for ${media.title || media.name}`}
        >
          <div className="relative aspect-[2/3] overflow-hidden rounded-md shadow-md">
            {imgLoading && (
              <div
                className="absolute inset-0 z-10 animate-pulse bg-gray-800"
                aria-hidden="true"
              />
            )}
            <img
              src={
                imageError
                  ? "/placeholder.svg"
                  : getImageUrl(media.poster_path, posterSizes.medium) ||
                  "/placeholder.svg"
              }
              alt={media.title || media.name || "Media Poster"}
              className={cn(
                "h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-110",
                imgLoading ? "opacity-0" : "opacity-100"
              )}
              loading="lazy"
              onError={handleImageError}
              onLoad={handleImageLoad}
            />

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover/card:opacity-100" />
            <div className="absolute bottom-0 left-0 right-0 translate-y-full bg-gradient-to-t from-black/90 to-transparent p-3 transition-transform duration-300 group-hover/card:translate-y-0">
              <p className="line-clamp-3 text-xs text-white/80">
                {media.overview}
              </p>
              <div className="mt-2 flex justify-center gap-2">
                <PlayButtonWithWillChange />
                <div
                  className="glass flex items-center gap-1 rounded px-3 py-1 text-xs text-white transition-colors hover:bg-white/20"
                >
                  <Info size={12} /> Details
                </div>
              </div>
            </div>
          </div>
          <div className="mt-2 px-1 transition-all duration-300 group-hover/card:translate-y-0">
            <h3 className="line-clamp-1 text-balance font-medium text-white">
              {media.title || media.name}
            </h3>
            <div className="mt-1 flex items-center justify-between text-sm text-white/70">
              <span className="line-clamp-1">
                {media.media_type === "movie"
                  ? media.release_date?.substring(0, 4)
                  : media.first_air_date?.substring(0, 4)}
              </span>
              {media.vote_average > 0 && (
                <div className="flex items-center text-amber-400">
                  <Star className="mr-1 h-4 w-4 fill-amber-400 group-hover/card:animate-pulse" />
                  {media.vote_average.toFixed(1)}
                </div>
              )}
            </div>
          </div>
        </Link>

        {/* Action Buttons - Positioned absolutely on top of the link */}
        <div className="absolute right-2 top-2 z-20 flex flex-col gap-2">
          <button
            className={cn(
              "rounded-full bg-black/60 p-1 transition-colors hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400",
              isFavorite ? "text-red-500" : "text-white"
            )}
            aria-label={
              isFavorite ? "Remove from favorites" : "Add to favorites"
            }
            onClick={handleFavoriteClick}
            type="button"
          >
            <Heart size={20} fill={isFavorite ? "#ef4444" : "none"} />
          </button>
          <button
            className={cn(
              "rounded-full bg-black/60 p-1 transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400",
              isInMyWatchlist ? "text-blue-400" : "text-white"
            )}
            aria-label={
              isInMyWatchlist ? "Remove from watchlist" : "Add to watchlist"
            }
            onClick={handleWatchlistClick}
            type="button"
          >
            <svg
              width="20"
              height="20"
              fill={isInMyWatchlist ? "#60a5fa" : "none"}
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M5 5v14l7-5 7 5V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2z" />
            </svg>
          </button>
        </div>
      </motion.div>
    );
  }
);

// Play button with will-change management for animations
const PlayButtonWithWillChange = () => {
  const playButtonRef = useRef<HTMLDivElement>(null);
  const { setupVisibilityHandler, isReducedMotion } = useWillChange(
    playButtonRef,
    "transform, filter",
    {
      respectReducedMotion: true,
      cleanupOnUnmount: false, // Since this is a reusable component
    }
  );

  // Set up visibility handler to apply will-change only when visible
  React.useEffect(() => {
    if (isReducedMotion) return;

    const cleanup = setupVisibilityHandler(isVisible => {
      if (playButtonRef.current) {
        if (isVisible) {
          // Apply will-change when element becomes visible
          playButtonRef.current.style.willChange = "transform, filter";
        } else {
          // Remove will-change when element goes out of view
          playButtonRef.current.style.willChange = "auto";
        }
      }
    });

    return cleanup;
  }, [setupVisibilityHandler, isReducedMotion]);

  // On hover, ensure will-change is applied
  const handleMouseEnter = () => {
    if (!isReducedMotion && playButtonRef.current) {
      playButtonRef.current.style.willChange = "transform, filter";
    }
  };

  return (
    <div
      ref={playButtonRef}
      className="play-icon glass flex items-center gap-1 rounded px-3 py-1 text-xs text-white transition-colors hover:bg-white/20"
      onMouseEnter={handleMouseEnter}
    >
      <Play size={12} /> Play
    </div>
  );
};

export default MediaCard;
