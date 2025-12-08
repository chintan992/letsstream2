import { useParams } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { MovieDetails, TVDetails } from "@/utils/types";
import { motion } from "framer-motion";
import { useState } from "react";
import { useScrollRestoration } from "@/hooks";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import Navbar from "@/components/Navbar";
import { VideoPlayer } from "@/components/player/VideoPlayer";
import VideoSourceSelector from "@/components/player/VideoSourceSelector";
import EpisodeNavigation from "@/components/player/EpisodeNavigation";
import EpisodeSidebar from "@/components/player/EpisodeSidebar";
import MediaActions from "@/components/player/MediaActions";
import { useMediaPlayer } from "@/hooks/use-media-player";
import { videoSources } from "@/utils/video-sources";
import { useAuth } from "@/hooks";
import { useIsMobile } from "@/hooks/use-mobile";

const Player = () => {
  const { id, season, episode, type } = useParams<{
    id: string;
    season?: string;
    episode?: string;
    type: string;
  }>();

  // Derive storage key based on media type and id
  const scrollStorageKey =
    type === "tv" && season
      ? `scroll-player-tv-${id}-${season}`
      : `scroll-player-movie-${id}`;

  useScrollRestoration({ storageKey: scrollStorageKey, enabled: true });
  const { user } = useAuth();
  const [isEpisodeSidebarOpen, setIsEpisodeSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

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
    goBack,
  } = useMediaPlayer(id, season, episode, type);

  const posterUrl = mediaDetails
    ? `https://image.tmdb.org/t/p/w1280${mediaDetails.backdrop_path}`
    : undefined;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-screen bg-background"
    >
      <div className="from-background/95 pointer-events-none fixed inset-0 bg-gradient-to-b to-background" />

      {/* Z-INDEX HIERARCHY:
         - Navbar & Sheet overlays: z-50 (highest - always visible)
         - Episode thumbnail overlays: z-20 (internal UI elements)
         - Episode number badges: z-10 (base UI elements)
         - Video player & other components: natural flow (no explicit z-index)
       */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50"
      >
        <Navbar />
      </motion.nav>

      <div className="container mx-auto px-4 py-4 md:px-6 md:py-6">
        <MediaActions
          isFavorite={isFavorite}
          isInWatchlist={isInMyWatchlist}
          onToggleFavorite={toggleFavorite}
          onToggleWatchlist={toggleWatchlist}
          onBack={goBack}
          onViewDetails={goToDetails}
          title={mediaType === "movie"
            ? (mediaDetails as MovieDetails)?.title
            : (mediaDetails as TVDetails)?.name}
          subtitle={mediaType === "tv" && season && episode
            ? `Season ${season} • Episode ${episode}`
            : undefined}
          year={mediaType === "movie"
            ? (mediaDetails as MovieDetails)?.release_date?.substring(0, 4)
            : (mediaDetails as TVDetails)?.first_air_date?.substring(0, 4)}
          rating={mediaDetails?.vote_average}
          mediaType={mediaType}
        />

        {/* Desktop Layout: Video Player and Episode Sidebar side-by-side */}
        {!isMobile && mediaType === "tv" && episodes.length > 0 ? (
          <div className="flex flex-row gap-4 xl:gap-6">
            <div className="z-10 min-w-0 flex-1 lg:min-w-[560px] xl:min-w-[700px]">
              <VideoPlayer
                isLoading={isLoading}
                iframeUrl={iframeUrl}
                title={title}
                poster={posterUrl}
                onLoaded={handlePlayerLoaded}
                onError={handlePlayerError}
              />
            </div>
            <div className="aspect-video max-h-[70vh] min-h-[350px] w-[280px] flex-shrink-0 md:w-80 lg:w-96 xl:w-[420px]">
              <EpisodeSidebar
                episodes={episodes}
                currentEpisodeIndex={currentEpisodeIndex}
                showId={id ? parseInt(id, 10) : 0}
                season={season ? parseInt(season, 10) : 1}
                seasons={(mediaDetails as any)?.seasons || []}
              />
            </div>
          </div>
        ) : (
          <>
            {/* Video Player Section for Mobile or Non-TV content */}
            <div className="z-10 min-w-0 flex-1 lg:min-w-[560px] xl:min-w-[700px]">
              <VideoPlayer
                isLoading={isLoading}
                iframeUrl={iframeUrl}
                title={title}
                poster={posterUrl}
                onLoaded={handlePlayerLoaded}
                onError={handlePlayerError}
              />
            </div>

            {/* Collapsible Episode Sidebar for Mobile/Tablet */}
            {isMobile && mediaType === "tv" && episodes.length > 0 && (
              <Collapsible
                open={isEpisodeSidebarOpen}
                onOpenChange={setIsEpisodeSidebarOpen}
                className="mt-4"
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-black/95 p-4 backdrop-blur-sm transition-all duration-300 hover:bg-white/5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">Episodes</span>
                      <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/60">
                        {episodes.length}
                      </span>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 text-white/60 transition-transform duration-300 ${isEpisodeSidebarOpen ? "rotate-180" : ""}`}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 max-h-[60vh] overflow-hidden overflow-y-auto data-[state=closed]:animate-slide-up data-[state=open]:animate-slide-down">
                  <EpisodeSidebar
                    episodes={episodes}
                    currentEpisodeIndex={currentEpisodeIndex}
                    showId={id ? parseInt(id, 10) : 0}
                    season={season ? parseInt(season, 10) : 1}
                    seasons={(mediaDetails as any)?.seasons || []}
                  />
                </CollapsibleContent>
              </Collapsible>
            )}
          </>
        )}

        {/* Episode navigation moved below the player and sidebar */}
        {mediaType === "tv" && episodes.length > 0 && (
          <div className="mt-6">
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
          </div>
        )}

        {/* Existing components below video player */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 space-y-6"
        >
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-white">
                Video Sources
              </h3>
              <p className="text-sm text-white/60">
                Select your preferred streaming source
              </p>
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
