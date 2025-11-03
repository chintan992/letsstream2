import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import ContentRow from '@/components/ContentRow';
import Navbar from '@/components/Navbar';
import ReviewSection from '@/components/ReviewSection';
import TVShowHeader from '@/components/tv/TVShowHeader';
import TVShowEpisodes from '@/components/tv/TVShowEpisodes';
import TVShowAbout from '@/components/tv/TVShowAbout';
import TVShowCast from '@/components/tv/TVShowCast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTVDetails } from '@/hooks/use-tv-details';
import { DownloadSection } from '@/components/DownloadSection';
import { TVDownloadSection } from '@/components/tv/TVDownloadSection';
import { useAuth } from '@/hooks';

type TabType = 'episodes' | 'about' | 'cast' | 'reviews' | 'downloads';

const TVDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<TabType>('episodes');
  const [lastWatchedEpisode, setLastWatchedEpisode] = useState<{
    season: number;
    episode: number;
    progress: number;
    episodeTitle: string;
    episodeThumbnail: string | null;
    timeRemaining: number;
    watchPosition: number;
    duration: number;
  } | null>(null);
  const [isLastWatchedLoading, setIsLastWatchedLoading] = useState(false);
  const { user } = useAuth();
  
  const {
    tvShow,
    episodes,
    selectedSeason,
    setSelectedSeason,
    isLoading,
    error,
    recommendations,
    cast,
    trailerKey,
    isFavorite,
    isInMyWatchlist,
    handlePlayEpisode,
    handleToggleFavorite,
    handleToggleWatchlist,
    getLastWatchedEpisode
  } = useTVDetails(id);

  // Fetch last watched episode when tvShow changes
  useEffect(() => {
    const fetchLastWatchedEpisode = async () => {
      if (!tvShow) return;
      
      try {
        setIsLastWatchedLoading(true);
        const episode = await getLastWatchedEpisode();
        setLastWatchedEpisode(episode);
      } catch (error) {
        console.error('Error fetching last watched episode:', error);
        setLastWatchedEpisode(null);
      } finally {
        setIsLastWatchedLoading(false);
      }
    };

    if (tvShow?.id) {
      fetchLastWatchedEpisode();
    }
  }, [tvShow, getLastWatchedEpisode]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-pulse-slow text-white font-medium">Loading...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <h1 className="text-2xl text-white mb-4">{error}</h1>
        <Button onClick={() => navigate('/')} variant="outline">
          Return to Home
        </Button>
      </div>
    );
  }
  
  if (!tvShow) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <h1 className="text-2xl text-white mb-4">TV Show not found</h1>
        <Button onClick={() => navigate('/')} variant="outline">
          Return to Home
        </Button>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="relative">
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-20 left-6 z-10 text-white p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        
        {!isMobile && trailerKey && (
          <div className="absolute inset-0 bg-black/60">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&modestbranding=1&loop=1&playlist=${trailerKey}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        <TVShowHeader
          tvShow={tvShow}
          isFavorite={isFavorite}
          isInWatchlist={isInMyWatchlist}
          onToggleFavorite={handleToggleFavorite}
          onToggleWatchlist={handleToggleWatchlist}
          onPlayEpisode={handlePlayEpisode}
          lastWatchedEpisode={lastWatchedEpisode}
          isLastWatchedLoading={isLastWatchedLoading}
        />
      </div>
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex border-b border-white/10 mb-6 overflow-x-auto pb-1 hide-scrollbar">
          <button
            className={`py-2 px-4 font-medium whitespace-nowrap ${
              activeTab === 'episodes' 
                ? 'text-white border-b-2 border-accent' 
                : 'text-white/60 hover:text-white'
            }`}
            onClick={() => setActiveTab('episodes')}
          >
            Episodes
          </button>
          <button
            className={`py-2 px-4 font-medium whitespace-nowrap ${
              activeTab === 'about' 
                ? 'text-white border-b-2 border-accent' 
                : 'text-white/60 hover:text-white'
            }`}
            onClick={() => setActiveTab('about')}
          >
            About
          </button>
          <button
            className={`py-2 px-4 font-medium whitespace-nowrap ${
              activeTab === 'cast' 
                ? 'text-white border-b-2 border-accent' 
                : 'text-white/60 hover:text-white'
            }`}
            onClick={() => setActiveTab('cast')}
          >
            Cast
          </button>
          <button
            className={`py-2 px-4 font-medium whitespace-nowrap ${
              activeTab === 'reviews' 
                ? 'text-white border-b-2 border-accent' 
                : 'text-white/60 hover:text-white'
            }`}
            onClick={() => setActiveTab('reviews')}
          >
            Reviews
          </button>
          <button
            className={`py-2 px-4 font-medium whitespace-nowrap ${
              activeTab === 'downloads' 
                ? 'text-white border-b-2 border-accent' 
                : 'text-white/60 hover:text-white'
            }`}
            onClick={() => setActiveTab('downloads')}
            style={{ display: user ? undefined : 'none' }}
          >
            Downloads
          </button>
        </div>
        
        {activeTab === 'episodes' && (
          <TVShowEpisodes 
            seasons={tvShow.seasons}
            episodes={episodes}
            selectedSeason={selectedSeason}
            onSeasonChange={setSelectedSeason}
            onPlayEpisode={handlePlayEpisode}
          />
        )}
        
        {activeTab === 'about' && (
          <TVShowAbout tvShow={tvShow} />
        )}
        
        {activeTab === 'cast' && (
          <TVShowCast cast={cast} />
        )}
        
        {activeTab === 'reviews' && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">User Reviews</h2>
            <ReviewSection mediaId={parseInt(id!, 10)} mediaType="tv" />
          </div>
        )}

        {activeTab === 'downloads' && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Download Episodes</h2>
            <TVDownloadSection
              tvShowName={tvShow.name}
              seasons={tvShow.seasons}
              episodesBySeason={Object.fromEntries(
                tvShow.seasons.map(season => [
                  season.season_number,
                  (episodes || []).filter(ep => ep.season_number === season.season_number)
                ])
              )}
            />
          </div>
        )}
      </div>
      
      {recommendations.length > 0 && (
        <ContentRow
          title="More Like This"
          media={recommendations}
        />
      )}
    </div>
  );
};

export default TVDetailsPage;
