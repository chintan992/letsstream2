import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Calendar, Star, Check, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Episode } from '@/utils/types';
import { getImageUrl } from '@/utils/services/tmdb';
import { backdropSizes } from '@/utils/api';

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
  const [searchQuery, setSearchQuery] = useState('');

  // Filter episodes based on search query
  const filteredEpisodes = useMemo(() => {
    if (!searchQuery.trim()) {
      return episodes;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return episodes.filter(episode =>
      ((episode.name || '').toLowerCase().includes(query)) ||
      (episode.overview && episode.overview.toLowerCase().includes(query))
    );
  }, [episodes, searchQuery]);

  const handleKeyDown = (event: React.KeyboardEvent, episodeNumber: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
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
    if (currentEpisode && (searchQuery === '')) {
      const currentEpisodeInFiltered = filteredEpisodes.findIndex(
        ep => ep.episode_number === currentEpisode.episode_number
      );
      if (currentEpisodeInFiltered >= 0 && episodeRefs.current[currentEpisodeInFiltered]) {
        episodeRefs.current[currentEpisodeInFiltered]?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [currentEpisode, filteredEpisodes, searchQuery]);

  return (
    <div className="w-80 md:w-80 lg:w-96 xl:w-[400px] h-full bg-black/95 flex flex-col border border-white/10">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Episodes</h2>
          <span className="px-2 py-1 bg-white/10 rounded-full text-xs text-white/60">
            {filteredEpisodes.length}
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 pb-3">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search episodes..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-accent pl-9 pr-9"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          {searchQuery.length > 0 && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60 hover:text-white/80 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Episode List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {filteredEpisodes.length === 0 && searchQuery.length > 0 ? (
            <div className="py-12 px-4 text-center">
              <Search className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <h3 className="text-white/60 font-medium mb-1">No episodes found</h3>
              <p className="text-white/40 text-sm">Try adjusting your search terms</p>
            </div>
          ) : (
            filteredEpisodes.map((episode, idx) => {
              const isCurrentEpisode = episode.episode_number === currentEpisodeNumber;
              const hasWatched = currentEpisodeNumber >= 0 && episode.episode_number < currentEpisodeNumber;

              return (
                <div
                  key={episode.id}
                  ref={(el) => {
                    episodeRefs.current[idx] = el;
                  }}
                  className={cn(
                    'relative cursor-pointer rounded-lg overflow-hidden transition-all duration-300 hover:bg-white/5',
                    isCurrentEpisode && 'ring-2 ring-accent bg-accent/10',
                    !isCurrentEpisode && 'bg-white/5'
                  )}
                  onClick={() => handleEpisodeClick(episode.episode_number)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => handleKeyDown(e, episode.episode_number)}
                >
                  <div className="flex gap-3 p-3">
                    {/* Thumbnail */}
                    <div className="relative flex-shrink-0 w-[120px] h-[68px] bg-white/10 rounded overflow-hidden">
                      {episode.still_path ? (
                        <img
                          src={getImageUrl(episode.still_path, backdropSizes.small)}
                          alt={episode.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="w-6 h-6 text-white/40" />
                        </div>
                      )}
                      
                      {/* Episode Number Badge */}
                      <div className="absolute bottom-1 left-1 bg-black/80 text-white text-xs font-semibold px-2 py-0.5 rounded z-20">
                        EP {episode.episode_number}
                      </div>

                      {/* Current Episode Indicator */}
                      {isCurrentEpisode && (
                        <div className="absolute inset-0 bg-accent/20 flex items-center justify-center z-10">
                          <Play className="w-4 h-4 text-white" />
                        </div>
                      )}

                      {/* Watched Indicator */}
                      {hasWatched && !isCurrentEpisode && (
                        <div className="absolute top-1 left-1 bg-green-600 rounded-full p-0.5">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Episode Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-white truncate">
                          {episode.name}
                        </h3>
                      </div>
                      
                      {/* Episode Description */}
                      <div className="text-xs text-white/60 leading-relaxed mt-1 line-clamp-2">
                        {episode.overview}
                      </div>
                      
                      <div className="flex items-center gap-3 mt-2 text-xs text-white/60">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {episode.air_date
                              ? new Date(episode.air_date).toLocaleDateString()
                              : 'TBA'}
                          </span>
                        </div>
                        
                        {episode.vote_average > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" />
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