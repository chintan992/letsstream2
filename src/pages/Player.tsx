
import { useParams } from 'react-router-dom';
import { ExternalLink, List } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Navbar from '@/components/Navbar';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import VideoSourceSelector from '@/components/player/VideoSourceSelector';
import EpisodeNavigation from '@/components/player/EpisodeNavigation';
import EpisodeSidebar from '@/components/player/EpisodeSidebar';
import MediaActions from '@/components/player/MediaActions';
import { useMediaPlayer } from '@/hooks/use-media-player';
import { videoSources } from '@/utils/video-sources';
import { useAuth } from '@/hooks';

const Player = () => {
  const { id, season, episode, type } = useParams<{
    id: string;
    season?: string;
    episode?: string;
    type: string;
  }>();
  const { user } = useAuth();
  const [isEpisodeSheetOpen, setIsEpisodeSheetOpen] = useState(false);
  
  const {
    title,
    mediaType,
    mediaDetails,
    episodes,
    currentEpisodeIndex,
    isLoading,
    isPlayerLoaded,
    iframeUrl,
    selectedSource,
    isFavorite,
    isInMyWatchlist,
    hasNextSeason,
    nextSeasonNumber,
    nextSeasonHasEpisodes,
    handleSourceChange,
    goToDetails,
    goToNextEpisode,
    goToPreviousEpisode,
    toggleFavorite,
    toggleWatchlist,
    handlePlayerLoaded,
    handlePlayerError,
    goBack
  } = useMediaPlayer(id, season, episode, type);

  const posterUrl = mediaDetails ? 
    `https://image.tmdb.org/t/p/w1280${mediaDetails.backdrop_path}` 
    : undefined;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background relative"
    >
      <div className="fixed inset-0 bg-gradient-to-b from-background/95 to-background pointer-events-none" />
      
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-30"
      >
        <Navbar />
      </motion.nav>

      <div className="container mx-auto py-8">
        <MediaActions
          isFavorite={isFavorite}
          isInWatchlist={isInMyWatchlist}
          onToggleFavorite={toggleFavorite}
          onToggleWatchlist={toggleWatchlist}
          onBack={goBack}
          onViewDetails={goToDetails}
        />

        {/* Flex Layout for Video Player and Episode Sidebar */}
        <div className="flex flex-col md:flex-row gap-4 xl:gap-6">
          {/* Video Player Section */}
          <div className="flex-1 min-w-0 lg:min-w-[560px] xl:min-w-[700px]">
            {/* Mobile Toggle Button for Episodes */}
            {mediaType === 'tv' && episodes.length > 0 && (
              <div className="md:hidden mb-4">
                <Sheet open={isEpisodeSheetOpen} onOpenChange={setIsEpisodeSheetOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300"
                    >
                      <List className="h-4 w-4 mr-2" />
                      Episodes
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-80 p-0 bg-background/95 backdrop-blur-md border-white/10">
                    <EpisodeSidebar
                      episodes={episodes}
                      currentEpisodeIndex={currentEpisodeIndex}
                      showId={id ? parseInt(id, 10) : 0}
                      season={season ? parseInt(season, 10) : 1}
                    />
                  </SheetContent>
                </Sheet>
              </div>
            )}
            
            <VideoPlayer
              isLoading={isLoading}
              iframeUrl={iframeUrl}
              title={title}
              poster={posterUrl}
              onLoaded={handlePlayerLoaded}
              onError={handlePlayerError}
            />
          </div>

          {/* Episode Sidebar Section - Desktop Only */}
          {mediaType === 'tv' && episodes.length > 0 && (
            <div className="hidden md:block flex-shrink-0">
              <EpisodeSidebar
                episodes={episodes}
                currentEpisodeIndex={currentEpisodeIndex}
                showId={id ? parseInt(id, 10) : 0}
                season={season ? parseInt(season, 10) : 1}
              />
            </div>
          )}
        </div>

        {/* Existing components below video player */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 space-y-6"
        >
          {mediaType === 'tv' && episodes.length > 0 && (
            <EpisodeNavigation
              episodes={episodes}
              currentEpisodeIndex={currentEpisodeIndex}
              onPreviousEpisode={goToPreviousEpisode}
              onNextEpisode={goToNextEpisode}
              isLastEpisodeOfSeason={currentEpisodeIndex >= episodes.length - 1}
              hasNextSeason={hasNextSeason}
              nextSeasonNumber={nextSeasonNumber}
              nextSeasonHasEpisodes={nextSeasonHasEpisodes}
            />
          )}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-white">Video Sources</h3>
                <p className="text-sm text-white/60">Select your preferred streaming source</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300"
                onClick={goToDetails}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </div>
            <VideoSourceSelector
              videoSources={videoSources}
              selectedSource={selectedSource}
              onSourceChange={handleSourceChange}
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Player;
