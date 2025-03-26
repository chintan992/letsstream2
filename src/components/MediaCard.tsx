import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { Media } from '@/utils/types';
import { posterSizes } from '@/utils/api';
import { Star, Info } from 'lucide-react';
import { motion } from 'framer-motion';

interface MediaCardProps {
  media: Media;
  className?: string;
  featured?: boolean;
  minimal?: boolean;
}

const MediaCard = ({ media, className, featured = false, minimal = false }: MediaCardProps) => {
  // Added console log for debugging
  console.log(`MediaCard: ${media.media_type}/${media.id} - ${media.title || media.name}`);
  
  // Use media_id for navigation if available, fallback to id
  const mediaId = media.media_id || media.id;
  
  const detailPath = media.media_type === 'movie' 
    ? `/movie/${mediaId}` 
    : `/tv/${mediaId}`;
  
  if (minimal) {
    return (
      <Link 
        to={detailPath} 
        className={cn(
          "block h-full",
          className
        )}
      >
        <div className="relative h-full rounded-md overflow-hidden shadow-md">
          <img
            src={`${posterSizes.medium}${media.poster_path}`}
            alt={media.title || media.name || 'Media Poster'}
            className="object-cover w-full h-full"
            loading="lazy"
          />
        </div>
      </Link>
    );
  }
  
  return (
    <Link 
      to={detailPath} 
      className={cn(
        "relative block group/card transform transition-all duration-300 hover:-translate-y-2",
        className
      )}
    >
      <div className="relative rounded-md overflow-hidden shadow-md aspect-[2/3]">
        <img
          src={`${posterSizes.medium}${media.poster_path}`}
          alt={media.title || media.name || 'Media Poster'}
          className="object-cover w-full h-full transition-transform duration-500 group-hover/card:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />
        
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent translate-y-full group-hover/card:translate-y-0 transition-transform duration-300">
          <p className="text-white/80 text-xs line-clamp-3">{media.overview}</p>
          <div className="flex justify-center mt-2">
            <button className="glass px-3 py-1 rounded text-xs flex items-center gap-1 text-white hover:bg-white/20 transition-colors">
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
    </Link>
  );
};

export default MediaCard;
