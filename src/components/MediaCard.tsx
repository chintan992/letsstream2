import React, { useState, useRef } from 'react';
import { useWatchHistory } from '@/hooks/watch-history';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { triggerHapticFeedback, triggerSuccessHaptic } from '@/utils/haptic-feedback';
import { Media } from '@/utils/types';
import { posterSizes } from '@/utils/api';
import { getImageUrl } from '@/utils/services/tmdb';
import { Star, Info, Heart, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import { trackMediaPreference, trackMediaView } from '@/lib/analytics';
import { useWillChange } from '@/hooks/useWillChange';

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
const MediaCard = React.memo(({ media, className, featured = false, minimal = false }: MediaCardProps) => {
  const [imageError, setImageError] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);
  const { addToFavorites, removeFromFavorites, isInFavorites, addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchHistory();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isInMyWatchlist, setIsInMyWatchlist] = useState(false);
  const navigate = useNavigate();

  const handleImageError = () => {
    setImageError(true);
    setImgLoading(false);
  };

  const handleImageLoad = () => {
    setImgLoading(false);
  };

  React.useEffect(() => {
    setIsFavorite(isInFavorites(media.id, media.media_type));
    setIsInMyWatchlist(isInWatchlist(media.id, media.media_type));
  }, [media.id, media.media_type, isInFavorites, isInWatchlist]);

  const mediaId = media.media_id || media.id;

  const detailPath = media.media_type === 'movie' 
    ? `/movie/${mediaId}` 
    : `/tv/${mediaId}`;
  const handleClick = async () => {
    // Provide haptic feedback when a card is selected
    triggerHapticFeedback(25);
    
    const detailPath = `/${media.media_type}/${media.id}`;
    // Track the media selection
    await Promise.all([
      trackMediaPreference(media.media_type, 'select'),
      trackMediaView({
        mediaType: media.media_type as 'movie' | 'tv',
        mediaId: media.id.toString(),
        title: media.title || media.name || '',
      })
    ]);
    navigate(detailPath);
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Different haptic feedback based on action (add/remove from favorites)
    if (isFavorite) {
      triggerHapticFeedback(20);
      await removeFromFavorites(media.id, media.media_type);
      setIsFavorite(false);
    } else {
      // Special pattern for adding to favorites
      triggerSuccessHaptic();
      await addToFavorites({
        media_id: media.id,
        media_type: media.media_type,
        title: media.title || media.name || '',
        poster_path: media.poster_path,
        backdrop_path: media.backdrop_path,
        overview: media.overview,
        rating: media.vote_average
      });
      setIsFavorite(true);
    }
    await trackMediaPreference(media.media_type as 'movie' | 'tv', 'favorite');
  };

  const handleWatchlistClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Different haptic feedback based on action (add/remove from watchlist)
    if (isInMyWatchlist) {
      triggerHapticFeedback(20);
      await removeFromWatchlist(media.id, media.media_type);
      setIsInMyWatchlist(false);
    } else {
      // Success pattern for adding to watchlist
      triggerSuccessHaptic();
      await addToWatchlist({
        media_id: media.id,
        media_type: media.media_type,
        title: media.title || media.name || '',
        poster_path: media.poster_path,
        backdrop_path: media.backdrop_path,
        overview: media.overview,
        rating: media.vote_average
      });
      setIsInMyWatchlist(true);
    }
  };

  if (minimal) {
    return (
      <Link
        to={detailPath}
        className={cn("block h-full", className)}
        aria-label={`View details for ${media.title || media.name}`}
      >
        <div className="relative h-full rounded-md overflow-hidden shadow-md">
          {imgLoading && (
            <div className="absolute inset-0 bg-gray-800 animate-pulse" aria-hidden="true" />
          )}
          <img
            src={imageError ? '/placeholder.svg' : getImageUrl(media.poster_path, posterSizes.medium) || '/placeholder.svg'}
            alt={media.title || media.name || 'Media Poster'}
            className={cn("object-cover w-full h-full", imgLoading ? "opacity-0" : "opacity-100")}
            loading="lazy"
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={detailPath}
      className={cn(
        "relative block group/card transform transition-all duration-300 hover:-translate-y-2 focus:outline-none focus:ring-2 focus:ring-blue-500",
        className
      )}
      onClick={handleClick}
      aria-label={`View details for ${media.title || media.name}`}
      tabIndex={0}
      role="button"
    >
      <motion.div>
        <div className="relative rounded-md overflow-hidden shadow-md aspect-[2/3]">
          {imgLoading && (
            <div className="absolute inset-0 bg-gray-800 animate-pulse z-10" aria-hidden="true" />
          )}
          <img
            src={imageError ? '/placeholder.svg' : getImageUrl(media.poster_path, posterSizes.medium) || '/placeholder.svg'}
            alt={media.title || media.name || 'Media Poster'}
            className={cn("object-cover w-full h-full transition-transform duration-500 group-hover/card:scale-110", imgLoading ? "opacity-0" : "opacity-100")}
            loading="lazy"
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
          <div className="absolute top-2 right-2 z-20 flex flex-col gap-2">
            <button
              className={cn(
                "p-1 rounded-full bg-black/60 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors",
                isFavorite ? "text-red-500" : "text-white"
              )}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              onClick={handleFavoriteClick}
              tabIndex={0}
              type="button"
              role="button"
            >
              <Heart size={20} fill={isFavorite ? "#ef4444" : "none"} />
            </button>
            <button
              className={cn(
                "p-1 rounded-full bg-black/60 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors",
                isInMyWatchlist ? "text-blue-400" : "text-white"
              )}
              aria-label={isInMyWatchlist ? "Remove from watchlist" : "Add to watchlist"}
              onClick={handleWatchlistClick}
              tabIndex={0}
              type="button"
              role="button"
            >
              <svg width="20" height="20" fill={isInMyWatchlist ? "#60a5fa" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 5v14l7-5 7 5V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2z" /></svg>
            </button>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent translate-y-full group-hover/card:translate-y-0 transition-transform duration-300">
            <p className="text-white/80 text-xs line-clamp-3">{media.overview}</p>
            <div className="flex justify-center gap-2 mt-2">
              <PlayButtonWithWillChange />
              <button
                className="glass px-3 py-1 rounded text-xs flex items-center gap-1 text-white hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                aria-label="Show details"
                tabIndex={0}
                type="button"
                role="button"
              >
                <Info size={12} /> Details
              </button>
            </div>
          </div>
        </div>
        <div className="mt-2 px-1 transition-all duration-300 group-hover/card:translate-y-0">
          <h3 className="text-white font-medium line-clamp-1 text-balance">{media.title || media.name}</h3>
          <div className="flex items-center justify-between mt-1 text-sm text-white/70">
            <span className="line-clamp-1">
              {media.media_type === 'movie'
                ? media.release_date?.substring(0, 4)
                : media.first_air_date?.substring(0, 4)}
            </span>
            {media.vote_average > 0 && (
              <div className="flex items-center text-amber-400">
                <Star className="h-4 w-4 mr-1 fill-amber-400 group-hover/card:animate-pulse" />
                {media.vote_average.toFixed(1)}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
});

// Play button with will-change management for animations
const PlayButtonWithWillChange = () => {
  const playButtonRef = useRef<HTMLButtonElement>(null);
  const { setupVisibilityHandler, isReducedMotion } = useWillChange(
    playButtonRef,
    'transform, filter',
    {
      respectReducedMotion: true,
      cleanupOnUnmount: false // Since this is a reusable component
    }
  );

  // Set up visibility handler to apply will-change only when visible
  React.useEffect(() => {
    if (isReducedMotion) return;
    
    const cleanup = setupVisibilityHandler((isVisible) => {
      if (playButtonRef.current) {
        if (isVisible) {
          // Apply will-change when element becomes visible
          playButtonRef.current.style.willChange = 'transform, filter';
        } else {
          // Remove will-change when element goes out of view
          playButtonRef.current.style.willChange = 'auto';
        }
      }
    });
    
    return cleanup;
  }, [setupVisibilityHandler, isReducedMotion]);

  // On hover, ensure will-change is applied
  const handleMouseEnter = () => {
    if (!isReducedMotion && playButtonRef.current) {
      playButtonRef.current.style.willChange = 'transform, filter';
    }
  };

  return (
    <button
      ref={playButtonRef}
      className="play-icon glass px-3 py-1 rounded text-xs flex items-center gap-1 text-white hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
      aria-label="Play media"
      tabIndex={0}
      type="button"
      role="button"
      onMouseEnter={handleMouseEnter}
    >
      <Play size={12} /> Play
    </button>
  );
};

export default MediaCard;
